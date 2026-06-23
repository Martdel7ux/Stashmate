using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SavingsApp.API.Data;
using SavingsApp.API.DTOs;
using SavingsApp.API.Middleware;
using SavingsApp.API.Services;

namespace SavingsApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISwanService _swan;
    private readonly ILogger<WalletController> _logger;

    public WalletController(AppDbContext db, ISwanService swan, ILogger<WalletController> logger)
    {
        _db = db;
        _swan = swan;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<WalletResponse>> Get()
    {
        var userId = User.GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (string.IsNullOrWhiteSpace(user.SwanAccountId))
            return Ok(new WalletResponse(null, 0m, "EUR"));

        decimal balance;
        try
        {
            balance = await _swan.GetBalanceAsync(user.SwanAccountId);
        }
        catch (Exception ex)
        {
            // Fall back to the sum of successful debits when Swan is unavailable in dev.
            _logger.LogWarning(ex, "Swan balance lookup failed; falling back to local sum.");
            balance = _db.Transactions
                .Where(t => t.UserId == userId && t.Status == Models.TransactionStatus.Success)
                .Sum(t => (decimal?)t.Amount) ?? 0m;
        }

        return Ok(new WalletResponse(user.SwanAccountId, balance, "EUR"));
    }
}
