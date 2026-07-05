using GenZCoders.Models;

namespace GenZCoders.DTOs;

public record ApplicationAnswerInput(Guid QuestionId, string AnswerText);

public record SubmitCourseApplicationRequest(
    Guid CourseId,
    Guid? CourseRoundId,
    string StudentEmail,
    string StudentName,
    IReadOnlyList<ApplicationAnswerInput> Answers);

public record ApplicationReviewRequest(bool Accepted, string? Notes);

public record MarkApplicationPaidRequest(string PaymentMethod, string PaymentReference, decimal AmountEgp);
public record UploadPaymentReceiptRequest(string ReceiptUrl, string PaymentMethod);

// New Phase 2 & 3 DTOs
public record UploadPaymentProofRequest(string ProofUrl, string? TransactionNumber = null, string? Notes = null);
public record SubmitPretestRequest(Guid PretestAttemptId, decimal Score);
public record CoursePaymentInstructionsDto(
    decimal AmountEgp,
    string? AccountName,
    string? AccountNumber,
    string? Instructions,
    string? QrCodeUrl);
// Phase 3 Admin Request DTOs
public record AdminRejectApplicationRequest(string RejectionReason);

public record ApplicationQuestionCreateRequest(
    Guid CourseId,
    Guid? CourseRoundId,
    ApplicationQuestionType QuestionType,
    string QuestionText,
    string? HelpText,
    string OptionsJson,
    string? CorrectAnswer,
    bool AutoGrade,
    int SortOrder);

public record ApplicationQuestionDto(
    Guid Id,
    Guid CourseId,
    Guid? CourseRoundId,
    ApplicationQuestionType QuestionType,
    string QuestionText,
    string? HelpText,
    string OptionsJson,
    bool IsRequired,
    bool AutoGrade,
    int SortOrder);

public record CourseApplicationDto(
    Guid Id,
    Guid CourseId,
    Guid? CourseRoundId,
    string StudentEmail,
    ApplicationStatus Status,
    bool QuestionsPassed,
    bool PaymentUnlocked,
    bool PaymentCompleted,
    string? PaymentReceiptUrl,
    string? PaymentMethod,
    bool PaymentReceiptPendingReview,
    ApplicationReviewDecision ReviewDecision,
    decimal ApplicationScore,
    // New Phase 2 and 3 Fields
    bool PretestEnabled,
    bool PretestTaken,
    decimal? PretestScore,
    bool? PretestPassed,
    string? PaymentProofUrl,
    string? PaymentTransactionNumber,
    string? PaymentNotes,
    string? RejectionReason,
    Guid? LastReviewedByUserId,
    DateTimeOffset? LastReviewedAt,
    // New Phase4 Fields
    Guid? ApprovedByUserId,
    DateTimeOffset? ApprovedAt);
