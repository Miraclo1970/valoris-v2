using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Valoris.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddZaaksoortBehandeling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Behandeling",
                table: "Zaaksoorten",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Behandeling",
                table: "Zaaksoorten");
        }
    }
}
