using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GaStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class Ne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentMethodConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MethodKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    IsDefaultGateway = table.Column<bool>(type: "bit", nullable: false),
                    IsGateway = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentMethodConfigurations", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PaymentMethodConfigurations",
                columns: new[] { "Id", "DateCreated", "DateUpdated", "DisplayName", "IsDefaultGateway", "IsEnabled", "IsGateway", "MethodKey", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("31f67e0c-765b-4fdf-ae16-2f8874c17f11"), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Paystack", true, true, true, "Paystack", 1 },
                    { new Guid("705320a5-3401-47e6-a61f-27d2d214f6f4"), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Manual Bank Transfer", false, true, false, "manual", 4 },
                    { new Guid("7b3d0c80-4f8d-4923-a019-c12730b4a2a7"), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Commission", false, true, false, "commission", 3 },
                    { new Guid("afdbd8dd-59aa-4eb8-a80b-9ebd7a26bd87"), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 3, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Flutterwave", false, true, true, "Flutterwave", 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentMethodConfigurations_MethodKey",
                table: "PaymentMethodConfigurations",
                column: "MethodKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentMethodConfigurations");
        }
    }
}
