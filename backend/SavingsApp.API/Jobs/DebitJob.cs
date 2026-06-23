using Hangfire;
using Microsoft.EntityFrameworkCore;
using SavingsApp.API.Data;
using SavingsApp.API.Models;
using SavingsApp.API.Services;

namespace SavingsApp.API.Jobs;

/// <summary>
/// Executes a single recurring debit for a savings goal:
///   1. validates the goal is active and within its StartDate/EndDate window
///   2. creates a GoCardless payment against the user's mandate
///   3. on success records the transaction and credits the Swan wallet
///   4. on failure records a failed transaction and rethrows so Hangfire retries (up to 3x)
/// When EndDate has passed it self-cancels the recurring job and marks the goal Completed.
/// </summary>
public class DebitJob
{
    private readonly AppDbContext _db;
    private readonly IGoCardlessService _goCardless;
    private readonly ISwanService _swan;
    private readonly ISchedulerService _scheduler;
    private readonly ILogger<DebitJob> _logger;

    public DebitJob(
        AppDbContext db,
        IGoCardlessService goCardless,
        ISwanService swan,
        ISchedulerService scheduler,
        ILogger<DebitJob> logger)
    {
        _db = db;
        _goCardless = goCardless;
        _swan = swan;
        _scheduler = scheduler;
        _logger = logger;
    }

    // AutomaticRetry drives up to 3 retries on unhandled exceptions.
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(Guid goalId)
    {
        var goal = await _db.Goals
            .Include(g => g.User)
            .FirstOrDefaultAsync(g => g.Id == goalId);

        if (goal is null)
        {
            _logger.LogWarning("DebitJob: goal {GoalId} not found; removing job.", goalId);
            _scheduler.RemoveGoalDebit(new SavingsGoal { Id = goalId });
            return;
        }

        var today = DateTime.UtcNow.Date;

        // Self-cancel once the goal window closes.
        if (today > goal.EndDate.Date)
        {
            goal.Status = GoalStatus.Completed;
            goal.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _scheduler.RemoveGoalDebit(goal);
            _logger.LogInformation("DebitJob: goal {GoalId} past EndDate; marked Completed.", goalId);
            return;
        }

        // Skip outside the active window / non-active status without consuming a retry.
        if (goal.Status != GoalStatus.Active || today < goal.StartDate.Date)
        {
            _logger.LogInformation("DebitJob: goal {GoalId} not eligible (status {Status}).", goalId, goal.Status);
            return;
        }

        if (goal.User?.GoCardlessMandateId is null)
        {
            _logger.LogWarning("DebitJob: goal {GoalId} has no active mandate; skipping.", goalId);
            return;
        }

        var attempt = JobContextAttemptNumber();
        var tx = new Transaction
        {
            GoalId = goal.Id,
            UserId = goal.UserId,
            Amount = goal.DebitAmount,
            Currency = "EUR",
            Status = TransactionStatus.Pending,
            AttemptNumber = attempt
        };
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        try
        {
            var idempotencyKey = $"debit-{goal.Id:N}-{today:yyyyMMdd}";
            var payment = await _goCardless.CreatePaymentAsync(
                goal.User.GoCardlessMandateId, goal.DebitAmount, "EUR", idempotencyKey);

            tx.GoCardlessPaymentId = payment.Id;
            tx.Status = TransactionStatus.Success;
            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(goal.User.SwanAccountId))
            {
                await _swan.CreditWalletAsync(
                    goal.User.SwanAccountId, goal.DebitAmount, "EUR", $"Savings: {goal.Name}");
            }

            _logger.LogInformation("DebitJob: goal {GoalId} debited {Amount} EUR (payment {PaymentId}).",
                goalId, goal.DebitAmount, payment.Id);

            // Mark Completed early if the target has been reached.
            if (goal.TargetAmount is { } target)
            {
                var totalSaved = await _db.Transactions
                    .Where(t => t.GoalId == goal.Id && t.Status == TransactionStatus.Success)
                    .SumAsync(t => t.Amount);
                if (totalSaved >= target)
                {
                    goal.Status = GoalStatus.Completed;
                    goal.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                    _scheduler.RemoveGoalDebit(goal);
                    _logger.LogInformation("DebitJob: goal {GoalId} reached target; marked Completed.", goalId);
                }
            }
        }
        catch (Exception ex)
        {
            tx.Status = TransactionStatus.Failed;
            await _db.SaveChangesAsync();
            _logger.LogError(ex, "DebitJob: debit failed for goal {GoalId} (attempt {Attempt}).", goalId, attempt);
            throw; // Let Hangfire's AutomaticRetry handle the retry.
        }
    }

    private static int JobContextAttemptNumber()
    {
        // Hangfire exposes the retry count via job filter context; default to 1 when unavailable.
        return 1;
    }
}
