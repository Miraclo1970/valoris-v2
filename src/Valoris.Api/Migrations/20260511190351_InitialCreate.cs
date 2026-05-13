using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Valoris.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Domeinen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Omschrijving = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Basisperiode = table.Column<int>(type: "int", nullable: false),
                    Interventiedrempel = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Domeinen", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gebruikers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gebruikers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Indicatoren",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Eenheid = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Aggregatiewijze = table.Column<int>(type: "int", nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Indicatoren", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Periodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Startdatum = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Einddatum = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Periodes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rollen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rollen", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Veranderingen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Omschrijving = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Prioriteit = table.Column<int>(type: "int", nullable: false),
                    Kosten = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Startdatum = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Einddatum = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veranderingen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Veranderingen_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Zaaksoorten",
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
                    table.PrimaryKey("PK_Zaaksoorten", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Zaaksoorten_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DomeinIndicatoren",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    IndicatorId = table.Column<int>(type: "int", nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DomeinIndicatoren", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DomeinIndicatoren_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DomeinIndicatoren_Indicatoren_IndicatorId",
                        column: x => x.IndicatorId,
                        principalTable: "Indicatoren",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GebruikerDomeinRollen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GebruikerId = table.Column<int>(type: "int", nullable: false),
                    DomeinId = table.Column<int>(type: "int", nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GebruikerDomeinRollen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GebruikerDomeinRollen_Domeinen_DomeinId",
                        column: x => x.DomeinId,
                        principalTable: "Domeinen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GebruikerDomeinRollen_Gebruikers_GebruikerId",
                        column: x => x.GebruikerId,
                        principalTable: "Gebruikers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GebruikerDomeinRollen_Rollen_RolId",
                        column: x => x.RolId,
                        principalTable: "Rollen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Metingsdoelen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomeinIndicatorId = table.Column<int>(type: "int", nullable: false),
                    ZaaksoortId = table.Column<int>(type: "int", nullable: false),
                    NormWaarde = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    NormRichting = table.Column<int>(type: "int", nullable: false),
                    Gewicht = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Actief = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metingsdoelen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Metingsdoelen_DomeinIndicatoren_DomeinIndicatorId",
                        column: x => x.DomeinIndicatorId,
                        principalTable: "DomeinIndicatoren",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Metingsdoelen_Zaaksoorten_ZaaksoortId",
                        column: x => x.ZaaksoortId,
                        principalTable: "Zaaksoorten",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Metingen",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MetingsdoelId = table.Column<int>(type: "int", nullable: false),
                    PeriodeId = table.Column<int>(type: "int", nullable: false),
                    Waarde = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Datum = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Bron = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Gevalideerd = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metingen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Metingen_Metingsdoelen_MetingsdoelId",
                        column: x => x.MetingsdoelId,
                        principalTable: "Metingsdoelen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Metingen_Periodes_PeriodeId",
                        column: x => x.PeriodeId,
                        principalTable: "Periodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Veranderimpacten",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VeranderingId = table.Column<int>(type: "int", nullable: false),
                    MetingsdoelId = table.Column<int>(type: "int", nullable: false),
                    PeriodeId = table.Column<int>(type: "int", nullable: false),
                    Waarde = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veranderimpacten", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Veranderimpacten_Metingsdoelen_MetingsdoelId",
                        column: x => x.MetingsdoelId,
                        principalTable: "Metingsdoelen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Veranderimpacten_Periodes_PeriodeId",
                        column: x => x.PeriodeId,
                        principalTable: "Periodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Veranderimpacten_Veranderingen_VeranderingId",
                        column: x => x.VeranderingId,
                        principalTable: "Veranderingen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DomeinIndicatoren_DomeinId",
                table: "DomeinIndicatoren",
                column: "DomeinId");

            migrationBuilder.CreateIndex(
                name: "IX_DomeinIndicatoren_IndicatorId",
                table: "DomeinIndicatoren",
                column: "IndicatorId");

            migrationBuilder.CreateIndex(
                name: "IX_GebruikerDomeinRollen_DomeinId",
                table: "GebruikerDomeinRollen",
                column: "DomeinId");

            migrationBuilder.CreateIndex(
                name: "IX_GebruikerDomeinRollen_GebruikerId",
                table: "GebruikerDomeinRollen",
                column: "GebruikerId");

            migrationBuilder.CreateIndex(
                name: "IX_GebruikerDomeinRollen_RolId",
                table: "GebruikerDomeinRollen",
                column: "RolId");

            migrationBuilder.CreateIndex(
                name: "IX_Metingen_MetingsdoelId",
                table: "Metingen",
                column: "MetingsdoelId");

            migrationBuilder.CreateIndex(
                name: "IX_Metingen_PeriodeId",
                table: "Metingen",
                column: "PeriodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Metingsdoelen_DomeinIndicatorId",
                table: "Metingsdoelen",
                column: "DomeinIndicatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Metingsdoelen_ZaaksoortId",
                table: "Metingsdoelen",
                column: "ZaaksoortId");

            migrationBuilder.CreateIndex(
                name: "IX_Veranderimpacten_MetingsdoelId",
                table: "Veranderimpacten",
                column: "MetingsdoelId");

            migrationBuilder.CreateIndex(
                name: "IX_Veranderimpacten_PeriodeId",
                table: "Veranderimpacten",
                column: "PeriodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Veranderimpacten_VeranderingId",
                table: "Veranderimpacten",
                column: "VeranderingId");

            migrationBuilder.CreateIndex(
                name: "IX_Veranderingen_DomeinId",
                table: "Veranderingen",
                column: "DomeinId");

            migrationBuilder.CreateIndex(
                name: "IX_Zaaksoorten_DomeinId_Volgorde",
                table: "Zaaksoorten",
                columns: new[] { "DomeinId", "Volgorde" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GebruikerDomeinRollen");

            migrationBuilder.DropTable(
                name: "Metingen");

            migrationBuilder.DropTable(
                name: "Veranderimpacten");

            migrationBuilder.DropTable(
                name: "Gebruikers");

            migrationBuilder.DropTable(
                name: "Rollen");

            migrationBuilder.DropTable(
                name: "Metingsdoelen");

            migrationBuilder.DropTable(
                name: "Periodes");

            migrationBuilder.DropTable(
                name: "Veranderingen");

            migrationBuilder.DropTable(
                name: "DomeinIndicatoren");

            migrationBuilder.DropTable(
                name: "Zaaksoorten");

            migrationBuilder.DropTable(
                name: "Indicatoren");

            migrationBuilder.DropTable(
                name: "Domeinen");
        }
    }
}
