using GenZCoders.DTOs;

namespace GenZCoders.Services;

public interface IApplicationService
{
    Task<CourseApplicationDto> SubmitAsync(SubmitCourseApplicationRequest request, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> MarkPaidAsync(Guid applicationId, MarkApplicationPaidRequest request, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> ReviewAsync(Guid applicationId, Guid reviewerUserId, ApplicationReviewRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CourseApplicationDto>> PendingAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CourseApplicationDto>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    // New Phase 2 Methods
    Task<CourseApplicationDto> StartApplication(Guid courseId, Guid? cohortId, Guid studentUserId, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> SubmitPretest(Guid applicationId, Guid studentUserId, SubmitPretestRequest request, CancellationToken cancellationToken = default);
    Task<CoursePaymentInstructionsDto> GetPaymentInstructions(Guid courseId, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> UploadPaymentProof(Guid applicationId, Guid studentUserId, UploadPaymentProofRequest request, CancellationToken cancellationToken = default);
    // New Phase3 Admin Methods
    Task<CourseApplicationDto> AdminApproveApplication(Guid applicationId, Guid adminUserId, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> AdminRejectApplication(Guid applicationId, Guid adminUserId, AdminRejectApplicationRequest request, CancellationToken cancellationToken = default);
    Task<CourseApplicationDto> AdminRequestNewPaymentProof(Guid applicationId, Guid adminUserId, CancellationToken cancellationToken = default);
}
