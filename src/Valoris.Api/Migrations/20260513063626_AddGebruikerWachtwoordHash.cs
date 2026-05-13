using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Valoris.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGebruikerWachtwoordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WachtwoordHash",
                table: "Gebruikers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WachtwoordHash",
                table: "Gebruikers");
        }
    }
}
