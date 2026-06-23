using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SavingsApp.API.Data;
using SavingsApp.API.Middleware;
using SavingsApp.API.Services;

namespace SavingsApp.API.Controllers;

[ApiController]
[Route("api/mandates")]
public class MandatesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IGoCardlessService _goCardless;
    private readonly ILogger<MandatesController> _logger;

    public MandatesController(AppDbContext db, IGoCardlessService goCardless, ILogger<MandatesController> logger)
    {
        _db = db;
        _goCardless = goCardless;
        _logger = logger;
    }

    /// <summary>Starts a GoCardless redirect flow; client redirects the user to RedirectUrl.</summary>
    [Authorize]
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate()
    {
        var userId = User.GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        // session_token ties the redirect flow to this user; we encode the user id.
        var sessionToken = $"savingsapp-{userId:N}";
        var flow = await _goCardless.InitiateMandateAsync(userId, user.Email, sessionToken);

        return Ok(new { redirectFlowId = flow.Id, redirectUrl = flow.RedirectUrl });
    }

    /// <summary>
    /// GoCardless redirects the user back here with redirect_flow_id. We complete the flow
    /// and persist the resulting mandate id. Anonymous because the browser arrives without a JWT;
    /// the user is resolved from the session_token returned by GoCardless.
    /// </summary>
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery(Name = "redirect_flow_id")] string redirectFlowId)
    {
        if (string.IsNullOrWhiteSpace(redirectFlowId))
            return BadRequest(new { error = "redirect_flow_id is required." });

        // The session_token must match the one used at initiation. In this skeleton we cannot
        // recover the user id without persisting the flow; a production build would store the
        // (redirectFlowId -> userId) pair at initiation. We re-derive it from the completed flow.
        try
        {
            // session_token is re-supplied; the production flow stores it alongside the user.
            var sessionToken = HttpContext.Request.Query["session_token"].ToString();
            var mandateId = await _goCardless.CompleteRedirectFlowAsync(redirectFlowId, sessionToken);

            // Resolve user from session token of form "savingsapp-{guidN}".
            if (sessionToken.StartsWith("savingsapp-") &&
                Guid.TryParse(sessionToken["savingsapp-".Length..], out var userId))
            {
                var user = await _db.Users.FindAsync(userId);
                if (user is not null)
                {
                    user.GoCardlessMandateId = mandateId;
                    await _db.SaveChangesAsync();
                }
            }

            _logger.LogInformation("Mandate {MandateId} confirmed via redirect flow {Flow}.", mandateId, redirectFlowId);
            return Ok(new { mandateId, status = "active" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete redirect flow {Flow}.", redirectFlowId);
            return StatusCode(502, new { error = "Failed to complete mandate flow." });
        }
    }
}
