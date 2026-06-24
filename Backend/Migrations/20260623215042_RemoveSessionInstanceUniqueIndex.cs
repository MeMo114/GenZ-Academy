using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GenZCoders.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSessionInstanceUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SessionInstances_CohortId_CourseSessionId",
                table: "SessionInstances");

            migrationBuilder.CreateIndex(
                name: "IX_SessionInstances_CohortId_CourseSessionId",
                table: "SessionInstances",
                columns: new[] { "CohortId", "CourseSessionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SessionInstances_CohortId_CourseSessionId",
                table: "SessionInstances");

            migrationBuilder.CreateIndex(
                name: "IX_SessionInstances_CohortId_CourseSessionId",
                table: "SessionInstances",
                columns: new[] { "CohortId", "CourseSessionId" },
                unique: true);
        }
    }
}
