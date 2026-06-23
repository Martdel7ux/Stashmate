using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SavingsApp.API.Services;

public record MandateRedirectFlow(string Id, string RedirectUrl);
public record CreatedPayment(string Id, string Status);

public interface IGoCardlessService
{
    /// <summary>Creates a redirect flow the user completes to authorise a SEPA mandate.</summary>
    Task<MandateRedirectFlow> InitiateMandateAsync(Guid userId, string email, string sessionToken);

    /// <summary>Completes a redirect flow after the user returns, yielding the mandate id.</summary>
    Task<string> CompleteRedirectFlowAsync(string redirectFlowId, string sessionToken);

    /// <summary>Creates a one-off payment against an existing mandate (in cents/pence).</summary>
    Task<CreatedPayment> CreatePaymentAsync(string mandateId, decimal amount, string currency, string idempotencyKey);

    /// <summary>Verifies the HMAC-SHA256 Webhook-Signature header against the raw body.</summary>
    bool VerifyWebhookSignature(string requestBody, string? signatureHeader);
}

/// <summary>
/// Thin typed-HttpClient wrapper over the GoCardless REST API (v2, 2015-07-06).
/// Coded to documented request/response shapes; credentials are supplied via config
/// (GoCardless:AccessToken / GoCardless:WebhookSecret) and left blank for the operator.
/// See https://developer.gocardless.com/api-reference
/// </summary>
public class GoCardlessService : IGoCardlessService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GoCardlessService> _logger;

    public GoCardlessService(HttpClient http, IConfiguration config, ILogger<GoCardlessService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        var baseUrl = config["GoCardless:BaseUrl"] ?? "https://api-sandbox.gocardless.com";
        _http.BaseAddress = new Uri(baseUrl);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        _http.DefaultRequestHeaders.Add("GoCardless-Version", "2015-07-06");

        var token = config["GoCardless:AccessToken"];
        if (!string.IsNullOrWhiteSpace(token))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public async Task<MandateRedirectFlow> InitiateMandateAsync(Guid userId, string email, string sessionToken)
    {
        var redirectUri = _config["GoCardless:RedirectUri"];
        var payload = new
        {
            redirect_flows = new
            {
                description = "Automated savings mandate",
                session_token = sessionToken,
                success_redirect_url = redirectUri,
                prefilled_customer = new { email }
            }
        };

        using var resp = await PostAsync("/redirect_flows", payload, idempotencyKey: $"rf-{userId}-{Guid.NewGuid()}");
        var json = await ReadJsonAsync(resp, "/redirect_flows");
        var rf = json["redirect_flows"]!;
        return new MandateRedirectFlow(
            rf.Value<string>("id")!,
            rf.Value<string>("redirect_url")!);
    }

    public async Task<string> CompleteRedirectFlowAsync(string redirectFlowId, string sessionToken)
    {
        var payload = new { data = new { session_token = sessionToken } };
        using var resp = await PostAsync($"/redirect_flows/{redirectFlowId}/actions/complete", payload);
        var json = await ReadJsonAsync(resp, "complete redirect flow");
        // Completed flow links to the created mandate.
        var mandateId = json["redirect_flows"]?["links"]?.Value<string>("mandate");
        if (string.IsNullOrWhiteSpace(mandateId))
            throw new InvalidOperationException("GoCardless redirect flow completed without a mandate link.");
        return mandateId;
    }

    public async Task<CreatedPayment> CreatePaymentAsync(string mandateId, decimal amount, string currency, string idempotencyKey)
    {
        // GoCardless expects amounts in the minor unit (e.g. cents).
        var minorUnits = (int)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);
        var payload = new
        {
            payments = new
            {
                amount = minorUnits,
                currency,
                links = new { mandate = mandateId },
                metadata = new { source = "savingsapp-debitjob" }
            }
        };

        using var resp = await PostAsync("/payments", payload, idempotencyKey);
        var json = await ReadJsonAsync(resp, "/payments");
        var p = json["payments"]!;
        return new CreatedPayment(p.Value<string>("id")!, p.Value<string>("status") ?? "pending_submission");
    }

    public bool VerifyWebhookSignature(string requestBody, string? signatureHeader)
    {
        var secret = _config["GoCardless:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(signatureHeader))
            return false;

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(requestBody)))
            .ToLowerInvariant();

        // Constant-time comparison.
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(signatureHeader.Trim().ToLowerInvariant()));
    }

    private async Task<HttpResponseMessage> PostAsync(string path, object payload, string? idempotencyKey = null)
    {
        var body = JsonConvert.SerializeObject(payload);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Post, path) { Content = content };
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
            request.Headers.Add("Idempotency-Key", idempotencyKey);
        return await _http.SendAsync(request);
    }

    private async Task<JObject> ReadJsonAsync(HttpResponseMessage resp, string context)
    {
        var raw = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("GoCardless {Context} failed: {Status} {Body}", context, (int)resp.StatusCode, raw);
            throw new HttpRequestException($"GoCardless {context} returned {(int)resp.StatusCode}.");
        }
        return JObject.Parse(raw);
    }
}
