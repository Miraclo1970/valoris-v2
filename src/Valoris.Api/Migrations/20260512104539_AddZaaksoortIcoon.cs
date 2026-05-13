using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Valoris.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddZaaksoortIcoon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icoon",
                table: "Zaaksoorten",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icoon",
                table: "Zaaksoorten");
        }
    }
}
