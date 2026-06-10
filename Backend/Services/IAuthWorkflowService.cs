using GenZCoders.DTOs;
using GenZCoders.Models.Identity;

namespace GenZCoders.Services;

public interface IAuthWorkflowService
{
    Task<AuthUserDto> CurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AuthUserDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthUserDto> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task RequestEmailVerificationAsync(string email, CancellationToken cancellationToken = default);
    Task<AuthUserDto> VerifyEmailOtpAsync(VerifyEmailOtpRequest request, CancellationToken cancellationToken = default);
    Task<AuthUserDto> VerifyEmailLinkAsync(VerifyEmailLinkRequest request, CancellationToken cancellationToken = default);
    Task<AuthUserDto> CompleteOnboardingAsync(Guid userId, OnboardingRequest request, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(string email, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task InitializeUserAccountAsync(ApplicationUser user, CancellationToken cancellationToken = default);
}
