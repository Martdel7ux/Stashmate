namespace SavingsApp.API.Models;

public enum GoalStatus
{
    Active = 0,
    Paused = 1,
    Completed = 2,
    Cancelled = 3
}

public class SavingsGoal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Total euros to save. Optional — null means open-ended.</summary>
    public decimal? TargetAmount { get; set; }

    /// <summary>Euros pulled from the bank per cycle.</summary>
    public decimal DebitAmount { get; set; }

    /// <summary>Day of month to debit. Capped to 1-28 to stay valid in February.</summary>
    public int DebitDay { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public GoalStatus Status { get; set; } = GoalStatus.Active;

    /// <summary>Id of the Hangfire recurring job driving the debit, if scheduled.</summary>
    public string? HangfireJobId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
