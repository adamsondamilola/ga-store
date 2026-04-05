using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaStore.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddedMultiVendor2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessAddress",
                table: "VendorKycs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessAddress",
                table: "VendorKycs");
        }
    }
}
