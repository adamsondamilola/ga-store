using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class BackfillLimitedOffersSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LimitedOffers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BadgeText = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ShowOnHomepage = table.Column<bool>(type: "bit", nullable: false),
                    CtaText = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CtaLink = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BackgroundImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LimitedOffers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LimitedOfferProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LimitedOfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DateUpdated = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LimitedOfferProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LimitedOfferProducts_LimitedOffers_LimitedOfferId",
                        column: x => x.LimitedOfferId,
                        principalTable: "LimitedOffers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LimitedOfferProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LimitedOfferProducts_LimitedOfferId_ProductId",
                table: "LimitedOfferProducts",
                columns: new[] { "LimitedOfferId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LimitedOfferProducts_ProductId",
                table: "LimitedOfferProducts",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LimitedOfferProducts");

            migrationBuilder.DropTable(
                name: "LimitedOffers");
        }
    }
}
