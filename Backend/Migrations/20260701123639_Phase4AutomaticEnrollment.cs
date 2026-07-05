using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GenZCoders.Migrations
{
    /// <inheritdoc />
    public partial class Phase4AutomaticEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovedAt",
                table: "CourseApplications",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "CourseApplications",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "CourseApplications");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "CourseApplications");
        }
    }
}
