using GenZCoders.Data;
using GenZCoders.DTOs;
using GenZCoders.Models;
using GenZCoders.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GenZCoders.Controllers;

[ApiController]
[Route("api/learning")]
public class LearningController(ILearningService learning, AcademyDbContext db) : ControllerBase
{
    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("lessons")]
    public async Task<IActionResult> AddLesson([FromBody] LessonCreateRequest request, CancellationToken cancellationToken)
        => Ok(new { id = await learning.AddLessonAsync(request, CurrentUserIdOrNull(), cancellationToken) });

    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("materials")]
    public async Task<IActionResult> AddMaterial([FromBody] MaterialCreateRequest request, CancellationToken cancellationToken)
        => Ok(new { id = await learning.AddMaterialAsync(request, CurrentUserIdOrNull(), cancellationToken) });

    [Authorize(Policy = "AcademyStaff")]
    [HttpPut("engineer/materials/{materialId:guid}")]
    public async Task<IActionResult> UpdateEngineerMaterial(Guid materialId, [FromBody] MaterialUpdateRequest request, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var material = await db.CourseMaterials
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == materialId, cancellationToken);

        if (material == null)
            return NotFound();

        bool hasAccess;
        if (material.CohortId.HasValue)
        {
            hasAccess = await db.Cohorts.AnyAsync(x => x.Id == material.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
        }
        else
        {
            // Check if engineer has any cohort for this course
            hasAccess = await db.Cohorts.AnyAsync(x => x.CourseId == material.CourseId && x.EngineerUserId == engineerUserId, cancellationToken);
        }

        if (!hasAccess)
            return Forbid();

        if (request.Title != null)
            material.Title = request.Title;
        if (request.Url != null)
            material.Url = request.Url;
        if (request.Description != null)
            material.Description = request.Description;
        if (request.MaterialType.HasValue)
            material.MaterialType = request.MaterialType.Value;
        if (request.IsDownloadable.HasValue)
            material.IsDownloadable = request.IsDownloadable.Value;
        if (request.IsPublished.HasValue)
            material.IsPublished = request.IsPublished.Value;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { material.Id });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpDelete("engineer/materials/{materialId:guid}")]
    public async Task<IActionResult> DeleteEngineerMaterial(Guid materialId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var material = await db.CourseMaterials
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == materialId, cancellationToken);

        if (material == null)
            return NotFound();

        bool hasAccess;
        if (material.CohortId.HasValue)
        {
            hasAccess = await db.Cohorts.AnyAsync(x => x.Id == material.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
        }
        else
        {
            // Check if engineer has any cohort for this course
            hasAccess = await db.Cohorts.AnyAsync(x => x.CourseId == material.CourseId && x.EngineerUserId == engineerUserId, cancellationToken);
        }

        if (!hasAccess)
            return Forbid();

        db.CourseMaterials.Remove(material);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { deleted = true, id = materialId });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/tasks/{taskId:guid}")]
    public async Task<IActionResult> GetEngineerTask(Guid taskId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var task = await db.LearningTasks
            .AsNoTracking()
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);

        if (task == null)
            return NotFound();

        if (task.CohortId.HasValue)
        {
            var cohort = await db.Cohorts.FirstOrDefaultAsync(x => x.Id == task.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
            if (cohort == null)
                return Forbid();
        }

        return Ok(new
        {
            id = task.Id,
            courseSessionId = task.CourseSessionId,
            courseRoundId = task.CohortId,
            title = task.Title,
            description = task.Description,
            instructions = task.Instructions,
            taskType = task.TaskType.ToString(),
            submissionType = task.SubmissionType.ToString(),
            maxScore = task.MaxScore,
            xpReward = task.XpReward,
            dueHoursAfterSession = task.DueHoursAfterSession,
            rubricJson = task.RubricJson
        });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPut("engineer/tasks/{taskId:guid}")]
    public async Task<IActionResult> UpdateEngineerTask(Guid taskId, [FromBody] TaskUpdateRequest request, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var task = await db.LearningTasks
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);

        if (task == null)
            return NotFound();

        if (task.CohortId.HasValue)
        {
            var cohort = await db.Cohorts.FirstOrDefaultAsync(x => x.Id == task.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
            if (cohort == null)
                return Forbid();
        }

        if (request.Title != null)
            task.Title = request.Title;
        if (request.Description != null)
            task.Description = request.Description;
        if (request.Instructions != null)
            task.Instructions = request.Instructions;
        if (request.TaskType.HasValue)
            task.TaskType = request.TaskType.Value;
        if (request.SubmissionType.HasValue)
            task.SubmissionType = request.SubmissionType.Value;
        if (request.MaxScore.HasValue)
            task.MaxScore = request.MaxScore.Value;
        if (request.XpReward.HasValue)
            task.XpReward = request.XpReward.Value;
        if (request.DueHoursAfterSession.HasValue)
            task.DueHoursAfterSession = request.DueHoursAfterSession.Value;
        if (request.RubricJson != null)
            task.RubricJson = request.RubricJson;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { task.Id });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/tasks/{taskId:guid}/submissions")]
    public async Task<IActionResult> GetEngineerTaskSubmissions(Guid taskId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var task = await db.LearningTasks
            .AsNoTracking()
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);

        if (task == null)
            return NotFound();

        if (task.CohortId.HasValue)
        {
            var cohort = await db.Cohorts.FirstOrDefaultAsync(x => x.Id == task.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
            if (cohort == null)
                return Forbid();
        }

        var submissions = await db.TaskSubmissions
            .AsNoTracking()
            .Include(x => x.StudentUser)
            .Where(x => x.LearningTaskId == taskId)
            .Select(x => new
            {
                id = x.Id,
                studentId = x.StudentUserId,
                studentName = x.StudentUser != null ? (x.StudentUser.FirstName + " " + x.StudentUser.LastName).Trim() : "Student",
                studentEmail = x.StudentUser != null ? x.StudentUser.Email : null,
                submissionUrl = x.SubmissionUrl,
                repositoryUrl = x.RepositoryUrl,
                submissionText = x.SubmissionText,
                submittedAt = x.SubmittedAt,
                status = x.Status.ToString(),
                score = x.Score,
                feedback = x.Feedback,
                gradedByUserId = x.GradedByUserId,
                gradedAt = x.GradedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(submissions);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpDelete("engineer/tasks/{taskId:guid}")]
    public async Task<IActionResult> DeleteEngineerTask(Guid taskId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var task = await db.LearningTasks
            .Include(x => x.Cohort)
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);

        if (task == null)
            return NotFound();

        if (task.CohortId.HasValue)
        {
            var cohort = await db.Cohorts.FirstOrDefaultAsync(x => x.Id == task.CohortId.Value && x.EngineerUserId == engineerUserId, cancellationToken);
            if (cohort == null)
                return Forbid();
        }

        db.LearningTasks.Remove(task);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { deleted = true, id = taskId });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("tasks")]
    public async Task<IActionResult> CreateTask([FromBody] TaskCreateRequest request, CancellationToken cancellationToken)
        => Ok(new { id = await learning.CreateTaskAsync(request, CurrentUserIdOrNull(), cancellationToken) });

    [Authorize(Roles = AcademyRole.Student)]
    [HttpPost("tasks/submissions")]
    public async Task<IActionResult> SubmitTask([FromBody] TaskSubmitRequest request, CancellationToken cancellationToken)
    {
        return Ok(new { id = await learning.SubmitTaskAsync(CurrentUserId(), request, cancellationToken) });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("tasks/submissions/{submissionId:guid}/grade")]
    public async Task<IActionResult> Grade(Guid submissionId, [FromBody] GradeSubmissionRequest request, CancellationToken cancellationToken)
    {
        await learning.GradeSubmissionAsync(submissionId, CurrentUserId(), request, cancellationToken);
        return Ok(new { graded = true });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("attendance")]
    public async Task<IActionResult> MarkAttendance([FromBody] AttendanceMarkRequest request, CancellationToken cancellationToken)
    {
        await learning.MarkAttendanceAsync(request, CurrentUserIdOrNull(), cancellationToken);
        return Ok(new { marked = true });
    }

    [Authorize]
    [HttpGet("room/{courseIdOrSlug}")]
    public async Task<IActionResult> Room(string courseIdOrSlug, CancellationToken cancellationToken)
    {
        Guid courseId;
        if (Guid.TryParse(courseIdOrSlug, out var id))
        {
            courseId = id;
        }
        else
        {
            var course = await db.Courses.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == courseIdOrSlug, cancellationToken);
            if (course == null) return NotFound(new { message = "Course not found." });
            courseId = course.Id;
        }
        return Ok(await learning.GetRoomAsync(courseId, CurrentUserId(), cancellationToken));
    }

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("progress")]
    public async Task<IActionResult> Progress(CancellationToken cancellationToken)
        => Ok(await learning.GetProgressAsync(CurrentUserId(), cancellationToken));

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("enrollments")]
    public async Task<IActionResult> MyEnrollments(CancellationToken cancellationToken)
        => Ok(await learning.GetMyEnrollmentsAsync(CurrentUserId(), cancellationToken));

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("materials")]
    public async Task<IActionResult> MyMaterials([FromQuery] Guid? courseId, CancellationToken cancellationToken)
        => Ok(await learning.GetMyMaterialsAsync(CurrentUserId(), courseId, cancellationToken));

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("certificates")]
    public async Task<IActionResult> MyCertificates(CancellationToken cancellationToken)
        => Ok(await learning.GetMyCertificatesAsync(CurrentUserId(), cancellationToken));

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("sessions")]
    public async Task<IActionResult> MySessions(CancellationToken cancellationToken)
        => Ok(await learning.GetMySessionsAsync(CurrentUserId(), cancellationToken));

    [Authorize(Roles = AcademyRole.Student)]
    [HttpGet("tasks")]
    public async Task<IActionResult> MyTasks([FromQuery] List<Guid>? cohortIds, CancellationToken cancellationToken)
    {
        List<Guid> ids;
        if (cohortIds == null || cohortIds.Count == 0)
        {
            var enrollments = await learning.GetMyEnrollmentsAsync(CurrentUserId(), cancellationToken);
            ids = enrollments.Select(e => e.CohortId).Distinct().ToList();
        }
        else
        {
            ids = cohortIds;
        }
        return Ok(await learning.GetMyTasksAsync(ids, CurrentUserId(), cancellationToken));
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/sessions")]
    public async Task<IActionResult> EngineerSessions(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohorts = await db.Cohorts
            .Where(x => x.EngineerUserId == engineerUserId)
            .ToListAsync(cancellationToken);

        var cohortIds = cohorts.Select(x => x.Id).ToList();

        var sessions = await db.SessionInstances
            .Include(x => x.Cohort)
            .ThenInclude(c => c!.Course)
            .Include(x => x.Cohort)
            .ThenInclude(c => c!.EngineerUser)
            .Where(x => cohortIds.Contains(x.CohortId))
            .OrderBy(x => x.ScheduledAt)
            .Select(x => new
            {
                id = x.Id.ToString(),
                sessionId = x.Id,
                cohortId = x.CohortId,
                title = x.Cohort != null && x.Cohort.Course != null ? $"{x.Cohort.Course.Title}: {x.WeekTitle}" : x.WeekTitle,
                weekTitle = x.WeekTitle,
                group = x.Cohort != null ? x.Cohort.Name : "Default Group",
                date = x.ScheduledAt.ToString("MMMM dd, yyyy"),
                time = x.ScheduledAt.ToString("HH:mm") + " - " + x.ScheduledAt.AddMinutes(x.DurationMinutes).ToString("HH:mm") + " EET",
                students = x.Cohort != null ? x.Cohort.CurrentStudents : 0,
                status = x.Status.ToString().ToLowerInvariant(),
                zoomStartUrl = x.Cohort != null ? x.Cohort.ZoomStartUrl : null,
                sessionLink = x.SessionLink,
                weekNumber = x.WeekNumber,
                scheduledAt = x.ScheduledAt,
                durationMinutes = x.DurationMinutes,
                instructorName = x.Cohort != null && x.Cohort.EngineerUser != null ? $"{x.Cohort.EngineerUser.FirstName} {x.Cohort.EngineerUser.LastName}".Trim() : null
            })
            .ToListAsync(cancellationToken);

        return Ok(sessions);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/students")]
    public async Task<IActionResult> EngineerStudents(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohorts = await db.Cohorts
            .Where(x => x.EngineerUserId == engineerUserId)
            .ToListAsync(cancellationToken);

        var cohortIds = cohorts.Select(x => x.Id).ToList();

        var enrollments = await db.CohortEnrollments
            .Include(x => x.StudentUser)
            .Include(x => x.Cohort)
                .ThenInclude(c => c!.Course)
            .Where(x => cohortIds.Contains(x.CohortId))
            .ToListAsync(cancellationToken);

        var result = new List<object>();

        foreach (var enrollment in enrollments)
        {
            var studentUserId = enrollment.StudentUserId;
            var courseId = enrollment.Cohort?.CourseId ?? Guid.Empty;

            var app = await db.CourseApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StudentUserId == studentUserId && x.CourseId == courseId, cancellationToken);

            result.Add(new
            {
                id = $"STU-{enrollment.Id.ToString()[..6].ToUpper()}",
                name = enrollment.StudentUser != null ? $"{enrollment.StudentUser.FirstName} {enrollment.StudentUser.LastName}".Trim() : "Student Candidate",
                course = enrollment.Cohort?.Course?.Title ?? "Enrolled Course",
                group = enrollment.Cohort?.Name ?? "Group",
                attendance = "95%",
                grade = "A",
                applicationId = app?.Id.ToString()
            });
        }

        return Ok(result);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/materials")]
    public async Task<IActionResult> EngineerMaterials(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohorts = await db.Cohorts
            .Where(x => x.EngineerUserId == engineerUserId)
            .ToListAsync(cancellationToken);

        var cohortIds = cohorts.Select(x => x.Id).ToList();
        var courseIds = cohorts.Select(x => x.CourseId).ToList();

        var materials = await db.CourseMaterials
            .AsNoTracking()
            .Include(x => x.Cohort)
                .ThenInclude(c => c!.Course)
            .Where(x => 
                (x.CohortId.HasValue && cohortIds.Contains(x.CohortId.Value)) 
                || (!x.CohortId.HasValue && courseIds.Contains(x.CourseId))
            )
            .OrderByDescending(x => x.CreatedAt)
            .Select(m => new
            {
                id = m.Id,
                title = m.Title,
                description = m.Description,
                url = m.Url,
                materialType = m.MaterialType.ToString(),
                isDownloadable = m.IsDownloadable,
                isPublished = m.IsPublished,
                courseId = m.CourseId,
                courseTitle = m.Cohort != null && m.Cohort.Course != null ? m.Cohort.Course.Title : null,
                cohortId = m.CohortId,
                cohortName = m.Cohort != null ? m.Cohort.Name : null,
                createdAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(materials);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/pending-tasks")]
    public async Task<IActionResult> EngineerPendingTasks(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();
        var cohorts = await db.Cohorts.Where(x => x.EngineerUserId == engineerUserId).ToListAsync(cancellationToken);
        var cohortIds = cohorts.Select(x => x.Id).ToList();

        var tasks = await db.TaskSubmissions
            .Include(x => x.LearningTask)
            .ThenInclude(t => t!.Cohort)
            .ThenInclude(c => c!.Course)
            .Where(x => x.LearningTask != null && x.LearningTask.CohortId != null && cohortIds.Contains(x.LearningTask.CohortId.Value) && x.Score == null)
            .GroupBy(x => new { x.LearningTask!.Id, x.LearningTask.Title, CourseTitle = x.LearningTask.Cohort!.Course!.Title, GroupName = x.LearningTask.Cohort.Name })
            .Select(g => new
            {
                id = g.Key.Id,
                title = g.Key.Title,
                course = g.Key.CourseTitle,
                group = g.Key.GroupName,
                submissions = g.Count()
            })
            .ToListAsync(cancellationToken);

        return Ok(tasks);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/cohorts")]
    public async Task<IActionResult> EngineerCohorts(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohorts = await db.Cohorts
            .AsNoTracking()
            .Include(x => x.Course)
            .Where(x => x.EngineerUserId == engineerUserId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(r => new
            {
                cohortId = r.Id,
                cohortName = r.Name,
                courseId = r.CourseId,
                courseTitle = r.Course == null ? "" : r.Course.Title,
                status = r.Status.ToString(),
                startDate = r.StartDate,
                endDate = r.EndDate,
                maxStudents = r.MaxStudents,
                studentsCount = r.CohortEnrollments.Count(),
                isEnrollmentOpen = r.IsEnrollmentOpen,
                sessionsCount = r.SessionInstances.Count()
            })
            .ToListAsync(cancellationToken);

        return Ok(cohorts);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/courses")]
    public async Task<IActionResult> EngineerCourses(CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var engineerCohorts = await db.Cohorts
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.CohortEnrollments)
            .Include(x => x.SessionInstances)
            .Where(x => x.EngineerUserId == engineerUserId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var groupedCourses = engineerCohorts
            .GroupBy(x => new { x.CourseId, x.Course?.Title, x.Course?.Slug })
            .Select(g => new
            {
                courseId = g.Key.CourseId,
                courseTitle = g.Key.Title ?? "",
                courseSlug = g.Key.Slug ?? "",
                roundsCount = g.Count(),
                studentsCount = g.Sum(x => x.CohortEnrollments.Count()),
                sessionsCount = g.Sum(x => x.SessionInstances.Count()),
                rounds = g.Select(r => new
                {
                    cohortId = r.Id,
                    cohortName = r.Name,
                    status = r.Status.ToString(),
                    studentsCount = r.CohortEnrollments.Count(),
                    sessionsCount = r.SessionInstances.Count()
                })
                .ToList()
            })
            .ToList();

        return Ok(groupedCourses);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/cohorts/{cohortId:guid}")]
    public async Task<IActionResult> EngineerCohortDetail(Guid cohortId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohort = await db.Cohorts
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.EngineerUser)
            .Include(x => x.CtaUser)
            .Include(x => x.CohortEnrollments)
                .ThenInclude(e => e.StudentUser)
            .FirstOrDefaultAsync(x => x.Id == cohortId && x.EngineerUserId == engineerUserId, cancellationToken);

        if (cohort == null)
        {
            return NotFound();
        }

        var weeks = await db.SessionInstances
            .AsNoTracking()
            .Where(x => x.CohortId == cohortId)
            .OrderBy(x => x.WeekNumber)
            .Select(w => new
            {
                id = w.Id,
                weekNumber = w.WeekNumber,
                weekTitle = w.WeekTitle,
                sessionType = w.SessionType.ToString(),
                scheduledAt = w.ScheduledAt,
                durationMinutes = w.DurationMinutes,
                status = w.Status.ToString(),
                sessionLink = w.SessionLink,
                recordingUrl = w.RecordingUrl
            })
            .ToListAsync(cancellationToken);

        var materials = await db.CourseMaterials
            .AsNoTracking()
            .Where(x => 
                (x.CohortId == cohortId) 
                || (x.CourseId == cohort.CourseId && x.CohortId == null)
            )
            .Select(m => new
            {
                id = m.Id,
                title = m.Title,
                url = m.Url,
                materialType = m.MaterialType.ToString(),
                description = m.Description,
                isDownloadable = m.IsDownloadable
            })
            .ToListAsync(cancellationToken);

        var tasks = await db.LearningTasks
            .AsNoTracking()
            .Where(x => x.CohortId == cohortId)
            .Select(t => new
            {
                id = t.Id,
                title = t.Title,
                description = t.Description,
                instructions = t.Instructions,
                taskType = t.TaskType.ToString(),
                submissionType = t.SubmissionType.ToString(),
                maxScore = t.MaxScore,
                xpReward = t.XpReward,
                dueHoursAfterSession = t.DueHoursAfterSession
            })
            .ToListAsync(cancellationToken);

        var pendingSubmissions = await db.TaskSubmissions
            .AsNoTracking()
            .Include(x => x.LearningTask)
            .Include(x => x.StudentUser)
            .Where(x => x.LearningTask!.CohortId == cohortId && x.Score == null)
            .Select(s => new
            {
                id = s.Id,
                studentName = s.StudentUser != null ? (s.StudentUser.FirstName + " " + s.StudentUser.LastName).Trim() : "Student",
                taskTitle = s.LearningTask!.Title,
                s.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            cohortId = cohort.Id,
            cohortName = cohort.Name,
            courseId = cohort.CourseId,
            courseTitle = cohort.Course?.Title ?? "",
            courseSlug = cohort.Course?.Slug ?? "",
            status = cohort.Status.ToString(),
            startDate = cohort.StartDate,
            endDate = cohort.EndDate,
            maxStudents = cohort.MaxStudents,
            studentsCount = cohort.CohortEnrollments.Count,
            isEnrollmentOpen = cohort.IsEnrollmentOpen,
            sessionsCount = weeks.Count,
            engineerName = cohort.EngineerUser != null ? (cohort.EngineerUser.FirstName + " " + cohort.EngineerUser.LastName).Trim() : "",
            ctaName = cohort.CtaUser != null ? (cohort.CtaUser.FirstName + " " + cohort.CtaUser.LastName).Trim() : "",
            zoomJoinUrl = cohort.ZoomJoinUrl,
            zoomStartUrl = cohort.ZoomStartUrl,
            zoomMeetingId = cohort.ZoomMeetingId,
            students = cohort.CohortEnrollments
                .Select(e => new
                {
                    id = e.Id.ToString(),
                    name = e.StudentUser != null ? (e.StudentUser.FirstName + " " + e.StudentUser.LastName).Trim() : "Student",
                    studentUserId = e.StudentUserId
                })
                .ToList(),
            sessions = weeks,
            materials = materials,
            tasks = tasks,
            pendingSubmissions = pendingSubmissions
        });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPost("engineer/cohorts/{cohortId:guid}/weeks")]
    public async Task<IActionResult> CreateEngineerRoundWeek(Guid cohortId, [FromBody] UpdateRoundWeekRequest request, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var cohort = await db.Cohorts.FirstOrDefaultAsync(x => x.Id == cohortId && x.EngineerUserId == engineerUserId, cancellationToken);
        if (cohort is null) return NotFound("Cohort not found");

        var maxWeekNum = await db.SessionInstances
            .Where(x => x.CohortId == cohortId)
            .Select(x => (int?)x.WeekNumber)
            .MaxAsync(cancellationToken) ?? 0;

        Enum.TryParse<SessionType>(request.SessionType, out var st);
        Enum.TryParse<SessionStatus>(request.Status, out var ws);

        var courseSession = await db.CourseSessions.FirstOrDefaultAsync(x => x.CourseId == cohort.CourseId, cancellationToken);
        if (courseSession is null)
        {
            courseSession = new CourseSession
            {
                CourseId = cohort.CourseId,
                Title = request.WeekTitle ?? $"Session {maxWeekNum + 1}",
                SessionType = st,
                DurationMinutes = request.DurationMinutes ?? 120
            };
            db.CourseSessions.Add(courseSession);
            await db.SaveChangesAsync(cancellationToken);
        }

        var instance = new SessionInstance
        {
            CohortId = cohortId,
            CourseSessionId = courseSession.Id,
            WeekNumber = request.WeekNumber > 0 ? request.WeekNumber : (maxWeekNum + 1),
            WeekTitle = request.WeekTitle ?? $"Week {maxWeekNum + 1}",
            SessionType = st,
            ScheduledAt = request.ScheduledAt ?? DateTimeOffset.UtcNow.AddDays(7),
            DurationMinutes = request.DurationMinutes ?? 120,
            Status = ws,
            SessionLink = request.SessionLink
        };

        db.SessionInstances.Add(instance);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { id = instance.Id });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("engineer/cohorts/{cohortId:guid}/weeks/{weekId:guid}")]
    public async Task<IActionResult> GetEngineerRoundWeek(Guid cohortId, Guid weekId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var week = await db.SessionInstances
            .AsNoTracking()
            .Where(x => x.Id == weekId && x.CohortId == cohortId && x.Cohort.EngineerUserId == engineerUserId)
            .Select(x => new
            {
                id = x.Id,
                weekNumber = x.WeekNumber,
                weekTitle = x.WeekTitle,
                sessionType = x.SessionType.ToString(),
                scheduledAt = x.ScheduledAt,
                durationMinutes = x.DurationMinutes,
                status = x.Status.ToString(),
                sessionLink = x.SessionLink,
                recordingUrl = x.RecordingUrl,
                cohortId = x.CohortId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (week is null) return NotFound();
        return Ok(week);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpPut("engineer/cohorts/{cohortId:guid}/weeks/{weekId:guid}")]
    public async Task<IActionResult> UpdateEngineerRoundWeek(Guid cohortId, Guid weekId, [FromBody] UpdateRoundWeekRequest request, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var week = await db.SessionInstances
            .FirstOrDefaultAsync(x => x.Id == weekId && x.CohortId == cohortId && x.Cohort.EngineerUserId == engineerUserId, cancellationToken);
        
        if (week is null) return NotFound();

        week.WeekTitle = request.WeekTitle ?? week.WeekTitle;
        if (Enum.TryParse<SessionType>(request.SessionType, out var st))
            week.SessionType = st;
        if (Enum.TryParse<SessionStatus>(request.Status, out var ws))
            week.Status = ws;
        week.SessionLink = request.SessionLink;
        week.RecordingUrl = request.RecordingUrl;
        week.WeekNumber = request.WeekNumber;
        if (request.ScheduledAt.HasValue)
            week.ScheduledAt = request.ScheduledAt.Value;
        if (request.DurationMinutes.HasValue)
            week.DurationMinutes = request.DurationMinutes.Value;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { week.Id });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpDelete("engineer/cohorts/{cohortId:guid}/weeks/{weekId:guid}")]
    public async Task<IActionResult> DeleteEngineerRoundWeek(Guid cohortId, Guid weekId, CancellationToken cancellationToken)
    {
        var engineerUserId = CurrentUserId();

        var week = await db.SessionInstances
            .FirstOrDefaultAsync(x => x.Id == weekId && x.CohortId == cohortId && x.Cohort.EngineerUserId == engineerUserId, cancellationToken);
        
        if (week is null) return NotFound();

        db.SessionInstances.Remove(week);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { deleted = true, id = weekId });
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("cta/sessions")]
    public async Task<IActionResult> CTASessions(CancellationToken cancellationToken)
    {
        var ctaUserId = CurrentUserId();
        // Since there is no explicit CTA field yet, we'll return upcoming sessions for the cohorts they might assist
        // Alternatively, just return all sessions for the academy
        var sessions = await db.SessionInstances
            .Include(x => x.Cohort)
            .ThenInclude(c => c!.Course)
            .OrderBy(x => x.ScheduledAt)
            .Select(x => new
            {
                id = x.Id.ToString(),
                title = x.Cohort != null && x.Cohort.Course != null ? $"{x.Cohort.Course.Title}: {x.WeekTitle}" : x.WeekTitle,
                group = x.Cohort != null ? x.Cohort.Name : "Default Group",
                date = x.ScheduledAt.ToString("MMMM dd, yyyy"),
                time = x.ScheduledAt.ToString("HH:mm") + " - " + x.ScheduledAt.AddMinutes(x.DurationMinutes).ToString("HH:mm") + " EET",
                lead = x.Cohort != null && x.Cohort.EngineerUser != null ? x.Cohort.EngineerUser.FirstName + " " + x.Cohort.EngineerUser.LastName : "TBD",
                zoomStartUrl = x.Cohort != null ? x.Cohort.ZoomStartUrl : null
            })
            .ToListAsync(cancellationToken);

        return Ok(sessions);
    }

    [Authorize(Policy = "AcademyStaff")]
    [HttpGet("cta/students")]
    public async Task<IActionResult> CTAStudents(CancellationToken cancellationToken)
    {
        var enrollments = await db.CohortEnrollments
            .Include(x => x.StudentUser)
            .Include(x => x.Cohort)
                .ThenInclude(c => c!.Course)
            .Take(50) // limit for demo
            .ToListAsync(cancellationToken);

        var result = enrollments.Select(enrollment => new
        {
            id = $"STU-{enrollment.Id.ToString()[..6].ToUpper()}",
            name = enrollment.StudentUser != null ? $"{enrollment.StudentUser.FirstName} {enrollment.StudentUser.LastName}".Trim() : "Student Candidate",
            course = enrollment.Cohort?.Course?.Title ?? "Enrolled Course",
            group = enrollment.Cohort?.Name ?? "Group",
            notesCount = 0,
            status = "On Track"
        });

        return Ok(result);
    }

    private Guid CurrentUserId()
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;

    private Guid? CurrentUserIdOrNull()
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
