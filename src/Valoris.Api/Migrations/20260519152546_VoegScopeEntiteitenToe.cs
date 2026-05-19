using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Valoris.Api.Migrations
{
    /// <inheritdoc />
    public partial class VoegScopeEntiteitenToe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HoofdprocesId",
                table: "Zaaksoorten",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Processen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Omschrijving = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Volgorde = table.Column<int>(type: "int", nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Processen_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Producten",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Omschrijving = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Producten", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Producten_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ZaaksoortScopes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    ZaaksoortId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ProcesId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    FrequentiePeriode = table.Column<int>(type: "int", nullable: true),
                    Frequentie = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZaaksoortScopes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZaaksoortScopes_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ZaaksoortScopes_Processen_ProcesId",
                        column: x => x.ProcesId,
                        principalTable: "Processen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ZaaksoortScopes_Producten_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Producten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ZaaksoortScopes_Zaaksoorten_ZaaksoortId",
                        column: x => x.ZaaksoortId,
                        principalTable: "Zaaksoorten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Zaaksoorten_HoofdprocesId",
                table: "Zaaksoorten",
                column: "HoofdprocesId");

            migrationBuilder.CreateIndex(
                name: "IX_Processen_DomeinId",
                table: "Processen",
                column: "DomeinId");

            migrationBuilder.CreateIndex(
                name: "IX_Producten_DomeinId",
                table: "Producten",
                column: "DomeinId");

            migrationBuilder.CreateIndex(
                name: "IX_ZaaksoortScopes_DomeinId_ProductId_ProcesId",
                table: "ZaaksoortScopes",
                columns: new[] { "DomeinId", "ProductId", "ProcesId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZaaksoortScopes_ProcesId",
                table: "ZaaksoortScopes",
                column: "ProcesId");

            migrationBuilder.CreateIndex(
                name: "IX_ZaaksoortScopes_ProductId",
                table: "ZaaksoortScopes",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ZaaksoortScopes_ZaaksoortId",
                table: "ZaaksoortScopes",
                column: "ZaaksoortId");

            migrationBuilder.AddForeignKey(
                name: "FK_Zaaksoorten_Processen_HoofdprocesId",
                table: "Zaaksoorten",
                column: "HoofdprocesId",
                principalTable: "Processen",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Zaaksoorten_Processen_HoofdprocesId",
                table: "Zaaksoorten");

            migrationBuilder.DropTable(
                name: "ZaaksoortScopes");

            migrationBuilder.DropTable(
                name: "Processen");

            migrationBuilder.DropTable(
                name: "Producten");

            migrationBuilder.DropIndex(
                name: "IX_Zaaksoorten_HoofdprocesId",
                table: "Zaaksoorten");

            migrationBuilder.DropColumn(
                name: "HoofdprocesId",
                table: "Zaaksoorten");
        }
    }
}
