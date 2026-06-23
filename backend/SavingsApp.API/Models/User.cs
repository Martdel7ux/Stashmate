namespace SavingsApp.API.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Swan account/wallet identifier (set after Swan account creation).</summary>
    public string? SwanAccountId { get; set; }

    /// <summary>GoCardless mandate id, populated once the mandate is confirmed active.</summary>
    public string? GoCardlessMandateId { get; set; }

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Navigation
    public ICollection<SavingsGoal> Goals { get; set; } = new List<SavingsGoal>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
