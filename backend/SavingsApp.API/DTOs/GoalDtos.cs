using System.ComponentModel.DataAnnotations;
using SavingsApp.API.Models;

namespace SavingsApp.API.DTOs;

public record CreateGoalRequest(
    [Required, MaxLength(200)] string Name,
    decimal? TargetAmount,
    [Range(0.01, 1_000_000)] decimal DebitAmount,
    [Range(1, 28)] int DebitDay,
    DateTime StartDate,
    DateTime EndDate);

public record GoalResponse(
    Guid Id,
    string Name,
    decimal? TargetAmount,
    decimal DebitAmount,
    int DebitDay,
    DateTime StartDate,
    DateTime EndDate,
    GoalStatus Status,
    decimal TotalSaved,
    DateTime CreatedAt)
{
    public static GoalResponse From(SavingsGoal g, decimal totalSaved) => new(
        g.Id, g.Name, g.TargetAmount, g.DebitAmount, g.DebitDay,
        g.StartDate, g.EndDate, g.Status, totalSaved, g.CreatedAt);
}

public record TransactionResponse(
    Guid Id,
    Guid GoalId,
    decimal Amount,
    string Currency,
    TransactionStatus Status,
    string? GoCardlessPaymentId,
    int AttemptNumber,
    DateTime CreatedAt)
{
    public static TransactionResponse From(Transaction t) => new(
        t.Id, t.GoalId, t.Amount, t.Currency, t.Status,
        t.GoCardlessPaymentId, t.AttemptNumber, t.CreatedAt);
}

public record WalletResponse(
    string? SwanAccountId,
    decimal Balance,
    string Currency);
