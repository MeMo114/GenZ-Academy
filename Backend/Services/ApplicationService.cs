// Updated for enrollment workflow state machine fix
using GenZCoders.Data;
using GenZCoders.DTOs;
using GenZCoders.Models;
using GenZCoders.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GenZCoders.Services;

public class ApplicationService(
    AcademyDbContext db,
    UserManager<ApplicationUser> userManager,
    INotificationService notifications) : IApplicationService
{
    public async Task<CourseApplicationDto> SubmitAsync(SubmitCourseApplicationRequest request, CancellationToken cancellationToken = default)
    {
        var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == request.CourseId, cancellationToken)
            ?? throw new InvalidOperationException("Course not found.");

        var student = await EnsureStudentAsync(request.StudentEmail, request.StudentName);
        var questions = await db.CourseApplicationQuestions
            .Where(x => x.CourseId == request.CourseId && x.IsActive && (x.CohortId == null || x.CohortId == request.CourseRoundId))
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        var answers = request.Answers.ToDictionary(x => x.QuestionId, x => x.AnswerText);
        var correct = 0;
        var graded = 0;

        var application = new CourseApplication
        {
            CourseId = request.CourseId,
            CohortId = request.CourseRoundId,
            StudentUserId = student.Id,
            Status = ApplicationStatus.Submitted
        };

        foreach (var question in questions)
        {
            answers.TryGetValue(question.Id, out var answerText);
            var isCorrect = Grade(question, answerText ?? string.Empty);
            if (isCorrect.HasValue)
            {
                graded++;
                if (isCorrect.Value) correct++;
            }

            application.Answers.Add(new CourseApplicationAnswer
            {
                CourseApplicationQuestionId = question.Id,
                AnswerText = answerText ?? string.Empty,
                IsCorrect = isCorrect,
                ScoreAwarded = isCorrect == true ? 1 : 0
            });
        }

        application.ApplicationScore = graded == 0 ? 100 : decimal.Round(correct * 100m / graded, 2);
        application.QuestionsPassed = questions.Count == 0 || application.ApplicationScore >= 50;
        application.PaymentUnlocked = application.QuestionsPassed;
        application.Status = application.QuestionsPassed ? ApplicationStatus.PaymentPending : ApplicationStatus.UnderReview;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        db.CourseApplications.Add(application);
        await db.SaveChangesAsync(cancellationToken);

        await notifications.QueueAsync(student.Id, "Application received", application.PaymentUnlocked
            ? $"Your {course.Title} application passed. Payment is now open."
            : $"Your {course.Title} application was received and is waiting for review.",
            [NotificationChannel.InApp, NotificationChannel.Email, NotificationChannel.WhatsApp], cancellationToken);

        return ToDto(application, student.Email ?? string.Empty);
    }

    public async Task<CourseApplicationDto> MarkPaidAsync(Guid applicationId, MarkApplicationPaidRequest request, CancellationToken cancellationToken = default)
    {
        var application = await db.CourseApplications.Include(x => x.Course).Include(x => x.StudentUser).FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken)
            ?? throw new InvalidOperationException("Application not found.");

        if (!application.PaymentUnlocked)
        {
            throw new InvalidOperationException("Payment is locked until application questions pass or staff approve it.");
        }

        var order = new EnrollmentOrder
        {
            StudentUserId = application.StudentUserId,
            OrderType = OrderType.Single,
            SubtotalEgp = application.Course?.PriceEgp ?? request.AmountEgp,
            TotalAmountEgp = request.AmountEgp,
            PaymentMethod = request.PaymentMethod,
            PaymentReference = request.PaymentReference,
            PaymentStatus = PaymentStatus.Paid,
            PaidAt = DateTimeOffset.UtcNow
        };
        db.EnrollmentOrders.Add(order);

        application.EnrollmentOrder = order;
        application.PaymentCompleted = true;
        application.PaidAt = DateTimeOffset.UtcNow;
        application.Status = ApplicationStatus.UnderReview;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        var round = application.CohortId.HasValue
            ? await db.Cohorts.FirstOrDefaultAsync(x => x.Id == application.CohortId, cancellationToken)
            : null;

        if (round is { AutoAcceptPaidApplications: true, RequireEngineerApproval: false })
        {
            await AcceptApplicationAsync(application, null, "Auto accepted after payment.", cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        await notifications.QueueAsync(application.StudentUserId, "Payment received", "Your payment was received. Your application is now waiting for final academy approval.", [NotificationChannel.InApp, NotificationChannel.Email, NotificationChannel.WhatsApp], cancellationToken);
        return ToDto(application, application.StudentUser?.Email ?? string.Empty);
    }

    public async Task<CourseApplicationDto> ReviewAsync(Guid applicationId, Guid reviewerUserId, ApplicationReviewRequest request, CancellationToken cancellationToken = default)
    {
        var application = await db.CourseApplications.Include(x => x.Course).Include(x => x.StudentUser).FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken)
            ?? throw new InvalidOperationException("Application not found.");

        if (request.Accepted)
        {
            await AcceptApplicationAsync(application, reviewerUserId, request.Notes, cancellationToken);
        }
        else
        {
            application.Status = ApplicationStatus.Rejected;
            application.ReviewDecision = ApplicationReviewDecision.Rejected;
            application.ReviewedByUserId = reviewerUserId;
            application.ReviewNotes = request.Notes;
            application.ReviewedAt = DateTimeOffset.UtcNow;
            application.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        await notifications.QueueAsync(application.StudentUserId, request.Accepted ? "Application accepted" : "Application update", request.Accepted
            ? "You have been accepted. Your course room is now open."
            : "Your application was reviewed. Please check your dashboard for details.",
            [NotificationChannel.InApp, NotificationChannel.Email, NotificationChannel.WhatsApp], cancellationToken);

        return ToDto(application, application.StudentUser?.Email ?? string.Empty);
    }

    public async Task<IReadOnlyList<CourseApplicationDto>> PendingAsync(CancellationToken cancellationToken = default)
        => await db.CourseApplications
            .AsNoTracking()
            .Include(x => x.StudentUser)
            .Where(x => x.Status == ApplicationStatus.UnderReview || x.Status == ApplicationStatus.PaymentPending)
            .OrderBy(x => x.SubmittedAt)
            .Select(x => ToDto(x, x.StudentUser == null ? string.Empty : x.StudentUser.Email ?? string.Empty))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<CourseApplicationDto>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default)
        => await db.CourseApplications
            .AsNoTracking()
            .Include(x => x.StudentUser)
            .Where(x => x.StudentUserId == userId)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => ToDto(x, x.StudentUser == null ? string.Empty : x.StudentUser.Email ?? string.Empty))
            .ToListAsync(cancellationToken);

    private async Task AcceptApplicationAsync(CourseApplication application, Guid? reviewerUserId, string? notes, CancellationToken cancellationToken)
    {
        application.Status = ApplicationStatus.Accepted;
        application.ReviewDecision = ApplicationReviewDecision.Accepted;
        application.ReviewedByUserId = reviewerUserId;
        application.ReviewNotes = notes;
        application.ReviewedAt = DateTimeOffset.UtcNow;
        application.AcceptedAt = DateTimeOffset.UtcNow;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        var price = application.Course?.PriceEgp ?? 0;
        var shouldActivate = price == 0 || application.PaymentCompleted;

        var enrollment = await db.Enrollments.FirstOrDefaultAsync(x => x.CourseId == application.CourseId && x.StudentUserId == application.StudentUserId, cancellationToken);
        if (enrollment is null)
        {
            enrollment = new Enrollment
            {
                CourseId = application.CourseId,
                CohortId = application.CohortId,
                StudentUserId = application.StudentUserId,
                EnrollmentOrderId = application.EnrollmentOrderId,
                EnrollmentStatus = shouldActivate ? EnrollmentStatus.Active : EnrollmentStatus.Pending,
                Status = shouldActivate ? "active" : "pending_payment",
                UnitPriceEgp = price,
                FinalPriceEgp = price
            };
            db.Enrollments.Add(enrollment);
        }
        else if (shouldActivate)
        {
            enrollment.EnrollmentStatus = EnrollmentStatus.Active;
            enrollment.Status = "active";
        }

        if (shouldActivate && application.CohortId.HasValue)
        {
            var cohort = await db.Cohorts
                .Include(c => c.CohortEnrollments)
                .Include(c => c.Course)
                .FirstOrDefaultAsync(c => c.Id == application.CohortId.Value, cancellationToken);

            if (cohort != null)
            {
                // Check if current round is full
                if (cohort.MaxStudents > 0 && cohort.CohortEnrollments.Count >= cohort.MaxStudents)
                {
                    // Create a new round
                    var newCohort = new Cohort
                    {
                        CourseId = cohort.CourseId,
                        Name = $"{cohort.Course!.Title} - Round {(await db.Cohorts.CountAsync(c => c.CourseId == cohort.CourseId, cancellationToken)) + 1}",
                        Slug = $"{cohort.Slug}-overflow-{Guid.NewGuid().ToString("N")[..6]}",
                        StartDate = cohort.StartDate,
                        MaxStudents = cohort.MaxStudents,
                        Status = CohortStatus.Upcoming,
                        IsEnrollmentOpen = true,
                        AutoAcceptPaidApplications = cohort.AutoAcceptPaidApplications,
                        RequireEngineerApproval = cohort.RequireEngineerApproval
                    };
                    db.Cohorts.Add(newCohort);
                    await db.SaveChangesAsync(cancellationToken);
                    
                    // Assign application and enrollment to the new round
                    application.CohortId = newCohort.Id;
                    enrollment.CohortId = newCohort.Id;
                    cohort = newCohort;
                }

                if (!await db.CohortEnrollments.AnyAsync(x => x.CohortId == cohort.Id && x.StudentUserId == application.StudentUserId, cancellationToken))
                {
                    db.CohortEnrollments.Add(new CohortEnrollment
                    {
                        CohortId = cohort.Id,
                        StudentUserId = application.StudentUserId,
                        Enrollment = enrollment
                    });
                }
            }
        }
    }

    private async Task<ApplicationUser> EnsureStudentAsync(string email, string name)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(normalized);
        if (user is not null) return user;

        var names = name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        user = new ApplicationUser
        {
            UserName = normalized,
            Email = normalized,
            FirstName = names.FirstOrDefault() ?? "Student",
            LastName = names.Length > 1 ? names[1] : string.Empty,
            RoleKey = AcademyRole.Student
        };

        var result = await userManager.CreateAsync(user);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
        }

        await userManager.AddToRoleAsync(user, AcademyRole.Student);
        return user;
    }

    private static bool? Grade(CourseApplicationQuestion question, string answer)
    {
        if (!question.AutoGrade || string.IsNullOrWhiteSpace(question.CorrectAnswer)) return null;
        return string.Equals(question.CorrectAnswer.Trim(), answer.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static CourseApplicationDto ToDto(CourseApplication application, string email)
    {
        bool? pretestPassed = null;
        if (application.PretestTaken && application.Course != null && application.PretestScore.HasValue)
        {
            pretestPassed = application.PretestScore >= application.Course.PretestPassingScore;
        }
        return new CourseApplicationDto(
            application.Id,
            application.CourseId,
            application.CohortId,
            email,
            application.Status,
            application.QuestionsPassed,
            application.PaymentUnlocked,
            application.PaymentCompleted,
            application.PaymentReceiptUrl,
            application.PaymentMethod,
            application.PaymentReceiptPendingReview,
            application.ReviewDecision,
            application.ApplicationScore,
            application.Course?.PretestEnabled ?? false,
            application.PretestTaken,
            application.PretestScore,
            pretestPassed,
            application.PaymentProofUrl,
            application.PaymentTransactionNumber,
            application.PaymentNotes,
            application.RejectionReason,
            application.LastReviewedByUserId,
            application.LastReviewedAt,
            application.ApprovedByUserId,
            application.ApprovedAt);
    }

    // New Phase 2 Methods
    public async Task<CourseApplicationDto> StartApplication(Guid courseId, Guid? cohortId, Guid studentUserId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(studentUserId.ToString());
        if (user == null)
            throw new InvalidOperationException("User not found");

        // Check for existing active application
        var existingApp = await db.CourseApplications
            .FirstOrDefaultAsync(x => x.CourseId == courseId &&
                                       x.StudentUserId == studentUserId &&
                                       x.Status != ApplicationStatus.Cancelled &&
                                       x.Status != ApplicationStatus.Rejected, cancellationToken);
        if (existingApp != null)
            return ToDto(existingApp, user.Email ?? "");

        var course = await db.Courses.FindAsync(new object[] { courseId }, cancellationToken);
        if (course == null)
            throw new InvalidOperationException("Course not found");

        var app = new CourseApplication
        {
            CourseId = courseId,
            CohortId = cohortId,
            StudentUserId = studentUserId,
            Status = course.PretestEnabled ? ApplicationStatus.WaitingForPretest : ApplicationStatus.WaitingForPayment
        };

        db.CourseApplications.Add(app);
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(app, user.Email ?? "");
    }

    public async Task<CourseApplicationDto> SubmitPretest(Guid applicationId, Guid studentUserId, SubmitPretestRequest request, CancellationToken cancellationToken = default)
    {
        var app = await db.CourseApplications
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == applicationId && x.StudentUserId == studentUserId, cancellationToken);
        if (app == null)
            throw new InvalidOperationException("Application not found");

        app.PretestTaken = true;
        app.PretestScore = request.Score;
        app.PretestAttemptId = request.PretestAttemptId;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        if (app.Course != null && request.Score >= app.Course.PretestPassingScore)
        {
            app.Status = ApplicationStatus.WaitingForPayment;
        }
        else
        {
            app.Status = ApplicationStatus.PretestFailed;
        }

        await db.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(studentUserId.ToString());
        return ToDto(app, user?.Email ?? "");
    }

    public async Task<CoursePaymentInstructionsDto> GetPaymentInstructions(Guid courseId, CancellationToken cancellationToken = default)
    {
        var course = await db.Courses.FindAsync(new object[] { courseId }, cancellationToken);
        if (course == null)
            throw new InvalidOperationException("Course not found");

        return new CoursePaymentInstructionsDto(
            course.PriceEgp,
            course.PaymentAccountName,
            course.PaymentAccountNumber,
            course.PaymentInstructions,
            course.PaymentQrCodeUrl);
    }

    public async Task<CourseApplicationDto> UploadPaymentProof(Guid applicationId, Guid studentUserId, UploadPaymentProofRequest request, CancellationToken cancellationToken = default)
    {
        var app = await db.CourseApplications
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == applicationId && x.StudentUserId == studentUserId, cancellationToken);
        if (app == null)
            throw new InvalidOperationException("Application not found");

        app.PaymentProofUrl = request.ProofUrl;
        app.PaymentTransactionNumber = request.TransactionNumber;
        app.PaymentNotes = request.Notes;
        app.Status = ApplicationStatus.PaymentUnderReview;
        app.RejectionReason = null; // Clear previous rejection reason when student uploads new proof
        app.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(studentUserId.ToString());
        return ToDto(app, user?.Email ?? "");
    }

    // New Phase3 Admin Methods
    public async Task<CourseApplicationDto> AdminApproveApplication(Guid applicationId, Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var app = await db.CourseApplications
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (app == null)
            throw new InvalidOperationException("Application not found.");

        // Idempotency check: if already approved, return early!
        if (app.Status == ApplicationStatus.Approved)
        {
            var user = await userManager.FindByIdAsync(app.StudentUserId.ToString());
            return ToDto(app, user?.Email ?? "");
        }

        app.Status = ApplicationStatus.Approved;
        app.RejectionReason = null;
        app.LastReviewedByUserId = adminUserId;
        app.LastReviewedAt = DateTimeOffset.UtcNow;
        app.ApprovedByUserId = adminUserId;
        app.ApprovedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        // Now do automatic enrollment!
        var price = app.Course?.PriceEgp ?? 0;

        // 1. Create EnrollmentOrder
        var order = new EnrollmentOrder
        {
            StudentUserId = app.StudentUserId,
            OrderType = OrderType.Single,
            SubtotalEgp = price,
            TotalAmountEgp = price,
            PaymentMethod = "Approved Application",
            PaymentReference = "Application Approved",
            PaymentStatus = PaymentStatus.Paid,
            PaidAt = DateTimeOffset.UtcNow
        };
        db.EnrollmentOrders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
        app.EnrollmentOrderId = order.Id;

        // 2. Create PaymentTransaction
        var transaction = new PaymentTransaction
        {
            EnrollmentOrderId = order.Id,
            Provider = "manual",
            ProviderTransactionId = "ApplicationApproved",
            AmountEgp = price,
            Status = PaymentStatus.Paid,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.PaymentTransactions.Add(transaction);

        // 3. Create or activate Enrollment
        var existingEnrollment = await db.Enrollments
            .FirstOrDefaultAsync(x => x.CourseId == app.CourseId && x.StudentUserId == app.StudentUserId, cancellationToken);
        Enrollment enrollment;
        if (existingEnrollment is null)
        {
            enrollment = new Enrollment
            {
                CourseId = app.CourseId,
                CohortId = app.CohortId,
                StudentUserId = app.StudentUserId,
                EnrollmentOrderId = order.Id,
                EnrollmentStatus = EnrollmentStatus.Active,
                Status = "active",
                UnitPriceEgp = price,
                FinalPriceEgp = price,
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.Enrollments.Add(enrollment);
            await db.SaveChangesAsync(cancellationToken);
        }
        else
        {
            existingEnrollment.EnrollmentOrderId = order.Id;
            existingEnrollment.EnrollmentStatus = EnrollmentStatus.Active;
            existingEnrollment.Status = "active";
            existingEnrollment.CohortId = app.CohortId;
            enrollment = existingEnrollment;
        }

        // 4. Create CohortEnrollment (if CohortId provided) and update Cohort's current student count
        if (app.CohortId.HasValue)
        {
            var existingCohortEnrollment = await db.CohortEnrollments
                .FirstOrDefaultAsync(e => e.CohortId == app.CohortId.Value && e.StudentUserId == app.StudentUserId, cancellationToken);
            if (existingCohortEnrollment is null)
            {
                var cohortEnrollment = new CohortEnrollment
                {
                    CohortId = app.CohortId.Value,
                    StudentUserId = app.StudentUserId,
                    EnrollmentId = enrollment.Id,
                    EnrolledAt = DateTimeOffset.UtcNow
                };
                db.CohortEnrollments.Add(cohortEnrollment);
                
                var cohort = await db.Cohorts.FindAsync(new object[] { app.CohortId.Value }, cancellationToken);
                if (cohort != null)
                {
                    cohort.CurrentStudents += 1;
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var studentUser = await userManager.FindByIdAsync(app.StudentUserId.ToString());
        return ToDto(app, studentUser?.Email ?? "");
    }

    public async Task<CourseApplicationDto> AdminRejectApplication(Guid applicationId, Guid adminUserId, AdminRejectApplicationRequest request, CancellationToken cancellationToken = default)
    {
        var app = await db.CourseApplications
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (app == null)
            throw new InvalidOperationException("Application not found");

        app.Status = ApplicationStatus.Rejected;
        app.RejectionReason = request.RejectionReason;
        app.LastReviewedByUserId = adminUserId;
        app.LastReviewedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(app.StudentUserId.ToString());
        return ToDto(app, user?.Email ?? "");
    }

    public async Task<CourseApplicationDto> AdminRequestNewPaymentProof(Guid applicationId, Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var app = await db.CourseApplications
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (app == null)
            throw new InvalidOperationException("Application not found");

        app.Status = ApplicationStatus.RequestingNewPaymentProof;
        app.LastReviewedByUserId = adminUserId;
        app.LastReviewedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(app.StudentUserId.ToString());
        return ToDto(app, user?.Email ?? "");
    }
}
