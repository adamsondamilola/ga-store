using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class VendorEarning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "BankAccounts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FlutterwaveRecipientCode",
                table: "BankAccounts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDefaultPayoutAccount",
                table: "BankAccounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPayoutVerified",
                table: "BankAccounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaystackRecipientCode",
                table: "BankAccounts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredPayoutGateway",
                table: "BankAccounts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VendorPayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProcessedByAdminId = table.Column<Guid>(type: "uuid", nullable: false),
                    Gateway = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PlatformCommissionAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    FlatFeeAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    EarningsCount = table.Column<int>(type: "integer", nullable: false),
                    Reference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ExternalTransferId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    InitiatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorPayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorPayouts_BankAccounts_BankAccountId",
                        column: x => x.BankAccountId,
                        principalTable: "BankAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorPayouts_Users_ProcessedByAdminId",
                        column: x => x.ProcessedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorPayouts_Users_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorEarnings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    VendorPayoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProductName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    VariantName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PlatformCommissionRate = table.Column<decimal>(type: "numeric", nullable: false),
                    PlatformCommissionAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    FlatFeeAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EarnedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaidOutOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorEarnings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_OrderItems_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_Users_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorEarnings_VendorPayouts_VendorPayoutId",
                        column: x => x.VendorPayoutId,
                        principalTable: "VendorPayouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_OrderId",
                table: "VendorEarnings",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_OrderItemId",
                table: "VendorEarnings",
                column: "OrderItemId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_ProductId",
                table: "VendorEarnings",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_VendorId",
                table: "VendorEarnings",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorEarnings_VendorPayoutId",
                table: "VendorEarnings",
                column: "VendorPayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_BankAccountId",
                table: "VendorPayouts",
                column: "BankAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_ProcessedByAdminId",
                table: "VendorPayouts",
                column: "ProcessedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_VendorId",
                table: "VendorPayouts",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorEarnings");

            migrationBuilder.DropTable(
                name: "VendorPayouts");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "FlutterwaveRecipientCode",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "IsDefaultPayoutAccount",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "IsPayoutVerified",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "PaystackRecipientCode",
                table: "BankAccounts");

            migrationBuilder.DropColumn(
                name: "PreferredPayoutGateway",
                table: "BankAccounts");
        }
    }
}
