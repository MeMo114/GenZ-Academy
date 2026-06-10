using GenZCoders.Data;
using GenZCoders.Models;
using GenZCoders.Models.Identity;
using GenZCoders.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GenZCoders.Controllers;

[Authorize(Roles = AcademyRole.AcademyAdmin)]
[ApiController]
[Route("api/admin/users")]
public class AdminUsersController(
    UserManager<ApplicationUser> userManager, 
    AcademyDbContext db,
    IAuthWorkflowService authWorkflow) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? role, [FromQuery] string? isActive, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleUserIds = await db.UserRoles
                .Join(db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Where(x => x.Name == role)
                .Select(x => x.UserId)
                .ToListAsync(ct);
            query = query.Where(u => roleUserIds.Contains(u.Id));
        }

        if (!string.IsNullOrWhiteSpace(isActive))
        {
            if (bool.TryParse(isActive, out var activeVal))
            {
                query = query.Where(u => u.IsActive == activeVal);
            }
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new {
                u.Id,
                u.Email,
                DisplayName = u.FirstName + " " + u.LastName,
                Role = u.RoleKey,
                u.TotalXp,
                u.CreatedAt,
                u.EmailConfirmed,
                u.IsActive
            })
            .Take(200)
            .ToListAsync(ct);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user is null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);
        
        // Fetch profiles if they exist
        var studentProfile = await db.StudentProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == id, ct);
        var staffProfile = await db.StaffProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == id, ct);
        var notificationSettings = await db.UserNotificationSettings.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == id, ct);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            DisplayName = user.FirstName + " " + user.LastName,
            user.RoleKey,
            user.TotalXp,
            user.CreatedAt,
            user.IsActive,
            Roles = roles,
            Profiles = new {
                Student = studentProfile,
                Staff = staffProfile
            },
            NotificationSettings = notificationSettings
        });
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        var nameParts = request.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = nameParts.Length > 0 ? nameParts[0] : "User",
            LastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "",
            RoleKey = request.Role,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        await authWorkflow.InitializeUserAccountAsync(user, HttpContext.RequestAborted);
        return Ok(new { user.Id });
    }

    [HttpPut("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        user.IsActive = !user.IsActive;
        
        // Invalidate session if deactivating
        if (!user.IsActive)
        {
            await userManager.UpdateSecurityStampAsync(user);
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { user.Id, user.IsActive });
    }

    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, request.Role);

        user.RoleKey = request.Role;
        await userManager.UpdateAsync(user);

        return Ok(new { user.Id, Role = request.Role });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        // 1. Update Core Identity Fields safely
        if (user.Email != request.Email)
        {
            var setEmailResult = await userManager.SetEmailAsync(user, request.Email);
            if (!setEmailResult.Succeeded) return BadRequest(new { errors = setEmailResult.Errors.Select(e => e.Description) });
            
            var setUserNameResult = await userManager.SetUserNameAsync(user, request.Email);
            if (!setUserNameResult.Succeeded) return BadRequest(new { errors = setUserNameResult.Errors.Select(e => e.Description) });
        }

        var nameParts = request.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        user.FirstName = nameParts.Length > 0 ? nameParts[0] : user.FirstName;
        user.LastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "";
        
        // 2. Update Role if changed
        bool roleChanged = user.RoleKey != request.Role;
        if (roleChanged)
        {
            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Any())
            {
                await userManager.RemoveFromRolesAsync(user, currentRoles);
            }
            
            var addRoleResult = await userManager.AddToRoleAsync(user, request.Role);
            if (!addRoleResult.Succeeded) return BadRequest(new { errors = addRoleResult.Errors.Select(e => e.Description) });
            
            user.RoleKey = request.Role;
        }

        // 3. Save changes and invalidate session (SecurityStamp)
        await userManager.UpdateSecurityStampAsync(user);
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        // 4. Ensure profile exists for the new role if changed
        if (roleChanged)
        {
            await authWorkflow.InitializeUserAccountAsync(user, HttpContext.RequestAborted);
        }

        return Ok(new { user.Id });
    }
}

public record CreateUserRequest(string Email, string Name, string Role, string Password);
public record UpdateUserRoleRequest(string Role);
public record UpdateUserRequest(string Email, string Name, string Role);
