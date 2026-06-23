using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SavingsApp.API.Data;
using SavingsApp.API.DTOs;
using SavingsApp.API.Middleware;
using SavingsApp.API.Models;
using SavingsApp.API.Services;

namespace SavingsApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/goals")]
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISchedulerService _scheduler;

    public GoalsController(AppDbContext db, ISchedulerService scheduler)
    {
        _db = db;
        _scheduler = scheduler;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GoalResponse>>> List()
    {
        var userId = User.GetUserId();
        var goals = await _db.Goals
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                Goal = g,
                TotalSaved = g.Transactions
                    .Where(t => t.Status == TransactionStatus.Success)
                    .Sum(t => (decimal?)t.Amount) ?? 0m
            })
            .ToListAsync();

        return Ok(goals.Select(x => GoalResponse.From(x.Goal, x.TotalSaved)));
    }

    [HttpPost]
    public async Task<ActionResult<GoalResponse>> Create(CreateGoalRequest request)
    {
        var userId = User.GetUserId();

        // Treat the incoming values as calendar dates at UTC midnight. Npgsql maps these to
        // 'timestamp with time zone', which only accepts Kind=Utc DateTimes.
        var startDate = DateTime.SpecifyKind(request.StartDate.Date, DateTimeKind.Utc);
        var endDate = DateTime.SpecifyKind(request.EndDate.Date, DateTimeKind.Utc);

        if (endDate <= startDate)
            return BadRequest(new { error = "EndDate must be after StartDate." });

        var goal = new SavingsGoal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            TargetAmount = request.TargetAmount,
            DebitAmount = request.DebitAmount,
            DebitDay = Math.Clamp(request.DebitDay, 1, 28), // cap to 28 (February-safe)
            StartDate = startDate,
            EndDate = endDate,
            Status = GoalStatus.Active
        };

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync();

        _scheduler.ScheduleGoalDebit(goal);
        goal.HangfireJobId = _scheduler.RecurringJobId(goal.Id);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = goal.Id }, GoalResponse.From(goal, 0m));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GoalResponse>> Get(Guid id)
    {
        var userId = User.GetUserId();
        var goal = await _db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
        if (goal is null) return NotFound();

        var totalSaved = await _db.Transactions
            .Where(t => t.GoalId == id && t.Status == TransactionStatus.Success)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        return Ok(GoalResponse.From(goal, totalSaved));
    }

    [HttpPatch("{id:guid}/pause")]
    public async Task<ActionResult<GoalResponse>> Pause(Guid id)
    {
        var goal = await GetOwnedGoal(id);
        if (goal is null) return NotFound();
        if (goal.Status is GoalStatus.Completed or GoalStatus.Cancelled)
            return BadRequest(new { error = $"Cannot pause a {goal.Status} goal." });

        goal.Status = GoalStatus.Paused;
        goal.UpdatedAt = DateTime.UtcNow;
        _scheduler.RemoveGoalDebit(goal);
        await _db.SaveChangesAsync();

        return Ok(GoalResponse.From(goal, await TotalSaved(id)));
    }

    [HttpPatch("{id:guid}/resume")]
    public async Task<ActionResult<GoalResponse>> Resume(Guid id)
    {
        var goal = await GetOwnedGoal(id);
        if (goal is null) return NotFound();
        if (goal.Status != GoalStatus.Paused)
            return BadRequest(new { error = $"Cannot resume a {goal.Status} goal." });

        goal.Status = GoalStatus.Active;
        goal.UpdatedAt = DateTime.UtcNow;
        _scheduler.ScheduleGoalDebit(goal);
        goal.HangfireJobId = _scheduler.RecurringJobId(goal.Id);
        await _db.SaveChangesAsync();

        return Ok(GoalResponse.From(goal, await TotalSaved(id)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var goal = await GetOwnedGoal(id);
        if (goal is null) return NotFound();

        goal.Status = GoalStatus.Cancelled;
        goal.UpdatedAt = DateTime.UtcNow;
        _scheduler.RemoveGoalDebit(goal);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id:guid}/transactions")]
    public async Task<ActionResult<IEnumerable<TransactionResponse>>> Transactions(Guid id)
    {
        var userId = User.GetUserId();
        var owns = await _db.Goals.AnyAsync(g => g.Id == id && g.UserId == userId);
        if (!owns) return NotFound();

        var txs = await _db.Transactions
            .Where(t => t.GoalId == id)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(txs.Select(TransactionResponse.From));
    }

    private async Task<SavingsGoal?> GetOwnedGoal(Guid id)
    {
        var userId = User.GetUserId();
        return await _db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
    }

    private async Task<decimal> TotalSaved(Guid goalId) =>
        await _db.Transactions
            .Where(t => t.GoalId == goalId && t.Status == TransactionStatus.Success)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;
}
