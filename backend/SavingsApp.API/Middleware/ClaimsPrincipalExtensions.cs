using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SavingsApp.API.Middleware;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Reads the authenticated user's id from the JWT 'sub' claim.</summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(value, out var id))
            return id;

        throw new UnauthorizedAccessException("Authenticated user id is missing or malformed.");
    }
}
