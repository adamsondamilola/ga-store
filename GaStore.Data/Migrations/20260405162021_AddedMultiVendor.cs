using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedMultiVendor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanPost",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVendor",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "KycStatus",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReviewRejectionReason",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewStatus",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByAdminId",
                table: "Products",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedForReviewAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VendorId",
                table: "Products",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "VendorKycs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LivePictureUrl = table.Column<string>(type: "text", nullable: true),
                    ValidIdUrl = table.Column<string>(type: "text", nullable: true),
                    BusinessCertificateUrl = table.Column<string>(type: "text", nullable: true),
                    IdType = table.Column<string>(type: "text", nullable: true),
                    BusinessName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorKycs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorKycs_Users_ReviewedByAdminId",
                        column: x => x.ReviewedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorKycs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_ReviewedByAdminId",
                table: "Products",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_VendorId",
                table: "Products",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorKycs_ReviewedByAdminId",
                table: "VendorKycs",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorKycs_UserId",
                table: "VendorKycs",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_ReviewedByAdminId",
                table: "Products",
                column: "ReviewedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_VendorId",
                table: "Products",
                column: "VendorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_ReviewedByAdminId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_VendorId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "VendorKycs");

            migrationBuilder.DropIndex(
                name: "IX_Products_ReviewedByAdminId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_VendorId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CanPost",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsVendor",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "KycStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewRejectionReason",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewedByAdminId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SubmittedForReviewAt",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "Products");
        }
    }
}
