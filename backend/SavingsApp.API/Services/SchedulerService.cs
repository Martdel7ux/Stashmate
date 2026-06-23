using Hangfire;
using SavingsApp.API.Jobs;
using SavingsApp.API.Models;

namespace SavingsApp.API.Services;

public interface ISchedulerService
{
    /// <summary>Schedules (or updates) the monthly recurring debit job for a goal.</summary>
    void ScheduleGoalDebit(SavingsGoal goal);

    /// <summary>Removes the recurring debit job for a goal.</summary>
    void RemoveGoalDebit(SavingsGoal goal);

    /// <summary>Stable recurring-job id derived from the goal id.</summary>
    string RecurringJobId(Guid goalId);
}

public class SchedulerService : ISchedulerService
{
    private readonly IRecurringJobManager _recurringJobs;
    private readonly ILogger<SchedulerService> _logger;

    public SchedulerService(IRecurringJobManager recurringJobs, ILogger<SchedulerService> logger)
    {
        _recurringJobs = recurringJobs;
        _logger = logger;
    }

    public string RecurringJobId(Guid goalId) => $"goal-debit-{goalId}";

    public void ScheduleGoalDebit(SavingsGoal goal)
    {
        var jobId = RecurringJobId(goal.Id);
        var cron = BuildCron(goal.DebitDay);

        // Fires at 09:00 on the configured day each month. The DebitJob itself enforces
        // the StartDate/EndDate window and self-cancels once EndDate is reached.
        _recurringJobs.AddOrUpdate<DebitJob>(
            jobId,
            job => job.ExecuteAsync(goal.Id),
            cron,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        _logger.LogInformation("Scheduled debit job {JobId} with cron '{Cron}'", jobId, cron);
    }

    public void RemoveGoalDebit(SavingsGoal goal)
    {
        var jobId = RecurringJobId(goal.Id);
        _recurringJobs.RemoveIfExists(jobId);
        _logger.LogInformation("Removed debit job {JobId}", jobId);
    }

    /// <summary>"0 9 D * *" — 09:00 on day D (capped 1-28) of every month.</summary>
    private static string BuildCron(int debitDay)
    {
        var day = Math.Clamp(debitDay, 1, 28);
        return $"0 9 {day} * *";
    }
}
