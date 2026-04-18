using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using GaStore.Models.Database;

#nullable disable

namespace GaStore.Data.Migrations
{
    [DbContext(typeof(DatabaseContext))]
    [Migration("20260416213000_AddProductAvailableOnRequestFix")]
    public partial class AddProductAvailableOnRequestFix : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Products"
                ADD COLUMN IF NOT EXISTS "IsAvailableOnRequest" boolean NOT NULL DEFAULT FALSE;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAvailableOnRequest",
                table: "Products");
        }
    }
}
