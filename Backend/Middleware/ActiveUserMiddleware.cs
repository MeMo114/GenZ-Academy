using GenZCoders.Models.Identity;
using Microsoft.AspNetCore.Identity;

namespace GenZCoders.Middleware;

public class ActiveUserMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ILogger<ActiveUserMiddleware> logger)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    var user = await userManager.FindByIdAsync(userId);
                    if (user == null || !user.IsActive)
                    {
                        await signInManager.SignOutAsync();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new { message = "Account is deactivated." });
                        return;
                    }
                }
                catch (Exception ex)
                {
                    // Transient error, log it and continue (keep authentication intact)
                    logger.LogError(ex, "Error looking up user with ID {UserId} in ActiveUserMiddleware", userId);
                    // Don't sign out user, continue to next middleware
                }
            }
        }

        await next(context);
    }
}
