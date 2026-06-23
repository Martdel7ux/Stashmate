using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace SavingsApp.API.Services;

public interface ISwanService
{
    /// <summary>Provisions a virtual IBAN / e-money account for a user. Returns the Swan account id.</summary>
    Task<string> CreateAccountAsync(Guid userId, string email);

    /// <summary>Credits the user's Swan wallet after a successful debit.</summary>
    Task CreditWalletAsync(string swanAccountId, decimal amount, string currency, string reference);

    /// <summary>Returns the current available balance for the account.</summary>
    Task<decimal> GetBalanceAsync(string swanAccountId);
}

/// <summary>
/// Thin typed-HttpClient wrapper over the Swan GraphQL API.
/// Coded to documented GraphQL operation shapes; OAuth client credentials are supplied
/// via config (Swan:ClientId / Swan:ClientSecret) and left blank for the operator.
/// See https://docs.swan.io/api
/// </summary>
public class SwanService : ISwanService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SwanService> _logger;

    public SwanService(HttpClient http, IConfiguration config, ILogger<SwanService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;

        var baseUrl = config["Swan:BaseUrl"] ?? "https://api.sandbox.swan.io";
        _http.BaseAddress = new Uri(baseUrl);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<string> CreateAccountAsync(Guid userId, string email)
    {
        const string mutation = @"
            mutation CreateAccount($input: OnboardIndividualAccountHolderInput!) {
              onboardIndividualAccountHolder(input: $input) {
                ... on OnboardIndividualAccountHolderSuccessPayload {
                  onboarding { account { id } }
                }
                ... on Rejection { message }
              }
            }";

        var variables = new
        {
            input = new
            {
                email,
                accountName = $"SavingsApp wallet {userId}",
                language = "en"
            }
        };

        var json = await ExecuteAsync(mutation, variables, "onboardIndividualAccountHolder");
        var accountId = json
            .SelectToken("data.onboardIndividualAccountHolder.onboarding.account.id")
            ?.Value<string>();

        if (string.IsNullOrWhiteSpace(accountId))
            throw new InvalidOperationException("Swan did not return an account id.");

        return accountId;
    }

    public async Task CreditWalletAsync(string swanAccountId, decimal amount, string currency, string reference)
    {
        const string mutation = @"
            mutation CreditWallet($input: CreateCreditTransferInput!) {
              createCreditTransfer(input: $input) {
                ... on CreateCreditTransferSuccessPayload { transaction { id } }
                ... on Rejection { message }
              }
            }";

        var variables = new
        {
            input = new
            {
                accountId = swanAccountId,
                amount = new { value = amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture), currency },
                reference
            }
        };

        await ExecuteAsync(mutation, variables, "createCreditTransfer");
    }

    public async Task<decimal> GetBalanceAsync(string swanAccountId)
    {
        const string query = @"
            query AccountBalance($id: ID!) {
              account(id: $id) {
                balances { available { value currency } }
              }
            }";

        var json = await ExecuteAsync(query, new { id = swanAccountId }, "account.balances");
        var value = json.SelectToken("data.account.balances.available.value")?.Value<string>();
        return decimal.TryParse(value, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var balance)
            ? balance
            : 0m;
    }

    private async Task<JObject> ExecuteAsync(string query, object variables, string context)
    {
        var token = await GetAccessTokenAsync();
        var body = JsonConvert.SerializeObject(new { query, variables });
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var request = new HttpRequestMessage(HttpMethod.Post, "/sandbox-partner/graphql") { Content = content };
        if (!string.IsNullOrWhiteSpace(token))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var resp = await _http.SendAsync(request);
        var raw = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("Swan {Context} failed: {Status} {Body}", context, (int)resp.StatusCode, raw);
            throw new HttpRequestException($"Swan {context} returned {(int)resp.StatusCode}.");
        }

        var json = JObject.Parse(raw);
        if (json["errors"] is JArray errors && errors.Count > 0)
        {
            _logger.LogError("Swan {Context} GraphQL errors: {Errors}", context, errors.ToString());
            throw new HttpRequestException($"Swan {context} returned GraphQL errors.");
        }
        return json;
    }

    /// <summary>
    /// Exchanges client credentials for an OAuth bearer token. Placeholder implementation —
    /// returns null when credentials are unset so dev flows degrade gracefully. Wire token
    /// caching against Swan's OAuth endpoint when sandbox credentials are available.
    /// </summary>
    private Task<string?> GetAccessTokenAsync()
    {
        var clientId = _config["Swan:ClientId"];
        var clientSecret = _config["Swan:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            return Task.FromResult<string?>(null);

        // TODO: POST to Swan OAuth token endpoint with client_credentials grant and cache the token.
        return Task.FromResult<string?>(null);
    }
}
