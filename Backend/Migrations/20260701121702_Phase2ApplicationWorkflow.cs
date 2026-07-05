using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GenZCoders.Migrations
{
    /// <inheritdoc />
    public partial class Phase2ApplicationWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentAccountName",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentAccountNumber",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentInstructions",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentQrCodeUrl",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PretestEnabled",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PretestPassingScore",
                table: "Courses",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "PretestQuizId",
                table: "Courses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentNotes",
                table: "CourseApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentProofUrl",
                table: "CourseApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTransactionNumber",
                table: "CourseApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PretestAttemptId",
                table: "CourseApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PretestScore",
                table: "CourseApplications",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PretestTaken",
                table: "CourseApplications",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentAccountName",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PaymentAccountNumber",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PaymentInstructions",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PaymentQrCodeUrl",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PretestEnabled",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PretestPassingScore",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PretestQuizId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PaymentNotes",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "PaymentProofUrl",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "PaymentTransactionNumber",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "PretestAttemptId",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "PretestScore",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "PretestTaken",
                table: "CourseApplications");
        }
    }
}
