namespace SavingsApp.API.Models;

public enum TransactionStatus
{
    Pending = 0,
    Success = 1,
    Failed = 2
}

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid GoalId { get; set; }
    public SavingsGoal? Goal { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";

    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;

    /// <summary>GoCardless payment id once the payment has been created.</summary>
    public string? GoCardlessPaymentId { get; set; }

    /// <summary>1-based attempt counter (Hangfire retries increment this).</summary>
    public int AttemptNumber { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
