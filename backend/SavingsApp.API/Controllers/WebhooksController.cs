using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using SavingsApp.API.Data;
using SavingsApp.API.Models;
using SavingsApp.API.Services;

namespace SavingsApp.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IGoCardlessService _goCardless;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(AppDbContext db, IGoCardlessService goCardless, ILogger<WebhooksController> logger)
    {
        _db = db;
        _goCardless = goCardless;
        _logger = logger;
    }

    /// <summary>
    /// GoCardless webhook. Verifies the Webhook-Signature (HMAC-SHA256 of the raw body)
    /// then reconciles payment events onto our transactions.
    /// </summary>
    [HttpPost("gocardless")]
    public async Task<IActionResult> GoCardless()
    {
        var body = await ReadRawBodyAsync();
        var signature = Request.Headers["Webhook-Signature"].ToString();

        if (!_goCardless.VerifyWebhookSignature(body, signature))
        {
            _logger.LogWarning("Rejected GoCardless webhook: invalid signature.");
            return Unauthorized();
        }

        var payload = JObject.Parse(body);
        foreach (var ev in payload["events"] as JArray ?? new JArray())
        {
            var resourceType = ev.Value<string>("resource_type");
            var action = ev.Value<string>("action");
            var paymentId = ev["links"]?.Value<string>("payment");

            if (resourceType != "payments" || string.IsNullOrWhiteSpace(paymentId))
                continue;

            var tx = await _db.Transactions
                .FirstOrDefaultAsync(t => t.GoCardlessPaymentId == paymentId);
            if (tx is null) continue;

            tx.Status = action switch
            {
                "confirmed" or "paid_out" => TransactionStatus.Success,
                "failed" or "cancelled" or "charged_back" => TransactionStatus.Failed,
                _ => tx.Status
            };
            _logger.LogInformation("GoCardless event '{Action}' applied to payment {PaymentId}.", action, paymentId);
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Swan webhook. Swan authenticates webhooks with an OAuth bearer token rather than an
    /// HMAC signature; validate the Authorization header before processing wallet events.
    /// </summary>
    [HttpPost("swan")]
    public async Task<IActionResult> Swan()
    {
        var auth = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(auth) || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Rejected Swan webhook: missing bearer token.");
            return Unauthorized();
        }

        // TODO: validate the bearer token against Swan's introspection/JWKS endpoint.
        var body = await ReadRawBodyAsync();
        _logger.LogInformation("Received Swan webhook ({Bytes} bytes).", body.Length);

        // Wallet event reconciliation (balance updates, transfer settlement) goes here.
        return Ok();
    }

    private async Task<string> ReadRawBodyAsync()
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        Request.Body.Position = 0;
        return body;
    }
}
