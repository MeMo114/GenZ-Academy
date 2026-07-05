using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GenZCoders.Migrations
{
    /// <inheritdoc />
    public partial class Phase3AdminApplicationReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastReviewedAt",
                table: "CourseApplications",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LastReviewedByUserId",
                table: "CourseApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "CourseApplications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastReviewedAt",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "LastReviewedByUserId",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "CourseApplications");
        }
    }
}
