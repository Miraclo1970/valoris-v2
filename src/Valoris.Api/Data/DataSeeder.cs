using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data.Entities;
using Valoris.Api.Services;

namespace Valoris.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(ValorisDbContext db)
    {
        // Altijd iconen en behandeling bijwerken (migrations voegen nullable kolommen toe)
        await PatchIconenAsync(db);
        await PatchBehandelingAsync(db);

        // Rol-tabel vullen (hardcoded waarden) + gebruikers — altijd draaien
        await SeedRollenAsync(db);
        await SeedGebruikersAsync(db);

        if (await db.Domeinen.AnyAsync()) return;

        // --- Periodes: Q1-Q4 2025 + Q1 2026 ---
        var periodes = new[]
        {
            new Periode { Startdatum = new DateTime(2025, 1, 1),  Einddatum = new DateTime(2025, 3, 31),  Type = PeriodeType.Kwartaal },
            new Periode { Startdatum = new DateTime(2025, 4, 1),  Einddatum = new DateTime(2025, 6, 30),  Type = PeriodeType.Kwartaal },
            new Periode { Startdatum = new DateTime(2025, 7, 1),  Einddatum = new DateTime(2025, 9, 30),  Type = PeriodeType.Kwartaal },
            new Periode { Startdatum = new DateTime(2025, 10, 1), Einddatum = new DateTime(2025, 12, 31), Type = PeriodeType.Kwartaal },
            new Periode { Startdatum = new DateTime(2026, 1, 1),  Einddatum = new DateTime(2026, 3, 31),  Type = PeriodeType.Kwartaal },
        };
        db.Periodes.AddRange(periodes);

        // --- Rollen ---
        var rollen = new[]
        {
            new Rol { Naam = "beheerder" },
            new Rol { Naam = "redacteur" },
            new Rol { Naam = "lezer" },
        };
        db.Rollen.AddRange(rollen);

        // --- Domein ---
        var domein = new Domein
        {
            Naam = "Burgerzaken",
            Omschrijving = "Dienstverlening aan burgers op het gebied van persoonsgegevens en documenten.",
            Basisperiode = PeriodeType.Kwartaal,
            Interventiedrempel = 60,
            Actief = true,
        };
        db.Domeinen.Add(domein);

        // --- Zaaksoorten (klantreis) ---
        var zaaksoorten = new[]
        {
            new Zaaksoort { Domein = domein, Naam = "Identiteitsbewijs",      Omschrijving = "Aanvraag of verlenging ID-kaart / paspoort.", Icoon = "🪪", Behandeling = "Balie", Volgorde = 1, Actief = true },
            new Zaaksoort { Domein = domein, Naam = "Uittreksel BRP",         Omschrijving = "Opvragen uittreksel basisregistratie personen.", Icoon = "📄", Behandeling = "Online", Volgorde = 2, Actief = true },
            new Zaaksoort { Domein = domein, Naam = "Rijbewijsverlenging",    Omschrijving = "Verlenging of vervanging rijbewijs.", Icoon = "🚗", Behandeling = "Balie", Volgorde = 3, Actief = true },
            new Zaaksoort { Domein = domein, Naam = "Verhuizing doorgeven",   Omschrijving = "Inschrijving nieuwe adres in BRP.", Icoon = "🏠", Behandeling = "Online", Volgorde = 4, Actief = true },
            new Zaaksoort { Domein = domein, Naam = "Huwelijksaangifte",      Omschrijving = "Aangifte van voorgenomen huwelijk.", Icoon = "💍", Behandeling = "Balie", Volgorde = 5, Actief = true },
        };
        db.Zaaksoorten.AddRange(zaaksoorten);

        // --- Indicatoren: 3 prestatie + 4 inrichting ---
        var indDoorlooptijd   = new Indicator { Naam = "Doorlooptijd",          Type = IndicatorType.Prestatie,  Eenheid = "dagen", Aggregatiewijze = Aggregatiewijze.Gemiddelde,   Actief = true };
        var indTevredenheid   = new Indicator { Naam = "Klanttevredenheid",     Type = IndicatorType.Prestatie,  Eenheid = "/ 10",  Aggregatiewijze = Aggregatiewijze.Gemiddelde,   Actief = true };
        var indAfhandeling    = new Indicator { Naam = "Afhandelingspercentage",Type = IndicatorType.Prestatie,  Eenheid = "%",     Aggregatiewijze = Aggregatiewijze.LaatstWaarde, Actief = true };
        var indAutomatisering = new Indicator { Naam = "Automatisering",        Type = IndicatorType.Inrichting, Eenheid = "%",     Aggregatiewijze = Aggregatiewijze.LaatstWaarde, Actief = true };
        var indSTP            = new Indicator { Naam = "STP",                   Type = IndicatorType.Inrichting, Eenheid = "%",     Aggregatiewijze = Aggregatiewijze.LaatstWaarde, Actief = true };
        var indStandaard      = new Indicator { Naam = "Standaardisatie",       Type = IndicatorType.Inrichting, Eenheid = "%",     Aggregatiewijze = Aggregatiewijze.LaatstWaarde, Actief = true };
        var indDigitaal       = new Indicator { Naam = "Digitale kanalen",      Type = IndicatorType.Inrichting, Eenheid = "%",     Aggregatiewijze = Aggregatiewijze.LaatstWaarde, Actief = true };
        db.Indicatoren.AddRange(indDoorlooptijd, indTevredenheid, indAfhandeling, indAutomatisering, indSTP, indStandaard, indDigitaal);

        // --- DomeinIndicatoren ---
        var diDoorlooptijd    = new DomeinIndicator { Domein = domein, Indicator = indDoorlooptijd,   Actief = true };
        var diTevredenheid    = new DomeinIndicator { Domein = domein, Indicator = indTevredenheid,   Actief = true };
        var diAfhandeling     = new DomeinIndicator { Domein = domein, Indicator = indAfhandeling,    Actief = true };
        var diAutomatisering  = new DomeinIndicator { Domein = domein, Indicator = indAutomatisering, Actief = true };
        var diSTP             = new DomeinIndicator { Domein = domein, Indicator = indSTP,            Actief = true };
        var diStandaard       = new DomeinIndicator { Domein = domein, Indicator = indStandaard,      Actief = true };
        var diDigitaal        = new DomeinIndicator { Domein = domein, Indicator = indDigitaal,       Actief = true };
        db.DomeinIndicatoren.AddRange(diDoorlooptijd, diTevredenheid, diAfhandeling, diAutomatisering, diSTP, diStandaard, diDigitaal);

        // --- Metingsdoelen ---
        // Doel: matrix spreiding: Identiteitsbewijs ~65% inr, Uittreksel ~80%, Rijbewijs ~35%, Verhuizing ~95%, Huwelijk ~85%
        var doelen = new[]
        {
            // Identiteitsbewijs — prestatie hoog (~97%), inrichting midden (~65%)
            new Metingsdoel { Zaaksoort = zaaksoorten[0], DomeinIndicator = diDoorlooptijd,   NormWaarde = 5,   NormRichting = NormRichting.LagerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[0], DomeinIndicator = diTevredenheid,   NormWaarde = 8,   NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[0], DomeinIndicator = diAfhandeling,    NormWaarde = 95,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.2m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[0], DomeinIndicator = diAutomatisering, NormWaarde = 70,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[0], DomeinIndicator = diDigitaal,       NormWaarde = 60,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            // Uittreksel BRP — prestatie midden (~80%), inrichting goed (~82%)
            new Metingsdoel { Zaaksoort = zaaksoorten[1], DomeinIndicator = diDoorlooptijd,   NormWaarde = 1,   NormRichting = NormRichting.LagerIsBeter,  Gewicht = 0.5m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[1], DomeinIndicator = diTevredenheid,   NormWaarde = 8,   NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[1], DomeinIndicator = diAutomatisering, NormWaarde = 80,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[1], DomeinIndicator = diSTP,            NormWaarde = 50,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[1], DomeinIndicator = diDigitaal,       NormWaarde = 70,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            // Rijbewijsverlenging — prestatie laag (~45%), inrichting laag (~35%)
            new Metingsdoel { Zaaksoort = zaaksoorten[2], DomeinIndicator = diDoorlooptijd,   NormWaarde = 10,  NormRichting = NormRichting.LagerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[2], DomeinIndicator = diTevredenheid,   NormWaarde = 7.5m,NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[2], DomeinIndicator = diAfhandeling,    NormWaarde = 90,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[2], DomeinIndicator = diAutomatisering, NormWaarde = 60,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[2], DomeinIndicator = diSTP,            NormWaarde = 40,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            // Verhuizing doorgeven — prestatie hoog (~97%), inrichting hoog (~93%)
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diDoorlooptijd,   NormWaarde = 3,   NormRichting = NormRichting.LagerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diTevredenheid,   NormWaarde = 8,   NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diAfhandeling,    NormWaarde = 95,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diAutomatisering, NormWaarde = 75,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diSTP,            NormWaarde = 60,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[3], DomeinIndicator = diStandaard,      NormWaarde = 80,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            // Huwelijksaangifte — prestatie uitstekend (~93%), inrichting goed (~83%)
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diDoorlooptijd,   NormWaarde = 14,  NormRichting = NormRichting.LagerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diTevredenheid,   NormWaarde = 9,   NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.5m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diAfhandeling,    NormWaarde = 98,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.2m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diAutomatisering, NormWaarde = 50,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.4m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diStandaard,      NormWaarde = 70,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
            new Metingsdoel { Zaaksoort = zaaksoorten[4], DomeinIndicator = diDigitaal,       NormWaarde = 65,  NormRichting = NormRichting.HogerIsBeter,  Gewicht = 0.3m, Actief = true },
        };
        db.Metingsdoelen.AddRange(doelen);

        // Flush to get IDs before creating metingen
        await db.SaveChangesAsync();

        // --- Metingen: 5 periodes × alle doelen ---
        // IST-waarden per kwartaal — variatie zodat de matrix interessant is
        // [Q1-2025, Q2-2025, Q3-2025, Q4-2025, Q1-2026]
        var metingData = new (int doelIdx, decimal[] waarden)[]
        {
            // Identiteitsbewijs — prestatie ~97%, inrichting ~65%
            (0,  new[] { 5.2m,  4.8m,  4.5m,  4.3m,  4.1m }),  // doorlooptijd (norm 5)
            (1,  new[] { 7.8m,  7.9m,  8.1m,  8.2m,  8.3m }),  // tevredenheid (norm 8)
            (2,  new[] { 93m,   94m,   95m,   96m,   97m  }),   // afhandeling (norm 95)
            (3,  new[] { 42m,   44m,   45m,   46m,   47m  }),   // automatisering (norm 70) → ~65%
            (4,  new[] { 35m,   36m,   37m,   38m,   39m  }),   // digitale kanalen (norm 60) → ~65%
            // Uittreksel BRP — prestatie ~78%, inrichting ~82%
            (5,  new[] { 1.5m,  1.4m,  1.6m,  1.3m,  1.2m }),  // doorlooptijd (norm 1)
            (6,  new[] { 7.2m,  7.0m,  7.1m,  7.3m,  7.4m }),  // tevredenheid (norm 8)
            (7,  new[] { 64m,   66m,   68m,   70m,   72m  }),   // automatisering (norm 80) → ~90%
            (8,  new[] { 35m,   37m,   40m,   42m,   45m  }),   // STP (norm 50) → ~90%
            (9,  new[] { 45m,   47m,   49m,   51m,   53m  }),   // digitale kanalen (norm 70) → ~76%
            // Rijbewijsverlenging — prestatie ~46%, inrichting ~34%
            (10, new[] { 18m,   16m,   15m,   14m,   13m  }),   // doorlooptijd (norm 10)
            (11, new[] { 6.5m,  6.3m,  6.4m,  6.6m,  6.8m }),  // tevredenheid (norm 7.5)
            (12, new[] { 78m,   80m,   81m,   83m,   85m  }),   // afhandeling (norm 90)
            (13, new[] { 18m,   19m,   20m,   20m,   21m  }),   // automatisering (norm 60) → ~33%
            (14, new[] { 14m,   14m,   15m,   15m,   16m  }),   // STP (norm 40) → ~38%
            // Verhuizing doorgeven — prestatie ~97%, inrichting ~95%
            (15, new[] { 3.2m,  3.0m,  2.8m,  2.7m,  2.5m }),  // doorlooptijd (norm 3)
            (16, new[] { 7.8m,  8.0m,  8.1m,  8.2m,  8.4m }),  // tevredenheid (norm 8)
            (17, new[] { 93m,   94m,   95m,   96m,   97m  }),   // afhandeling (norm 95)
            (18, new[] { 74m,   75m,   76m,   77m,   78m  }),   // automatisering (norm 75) → ~100%
            (19, new[] { 57m,   58m,   59m,   60m,   61m  }),   // STP (norm 60) → ~100%
            (20, new[] { 72m,   73m,   74m,   75m,   76m  }),   // standaardisatie (norm 80) → ~93%
            // Huwelijksaangifte — prestatie ~93%, inrichting ~83%
            (21, new[] { 12m,   11m,   10m,   9m,    8m   }),   // doorlooptijd (norm 14)
            (22, new[] { 8.8m,  8.9m,  9.0m,  9.1m,  9.2m }),  // tevredenheid (norm 9)
            (23, new[] { 97m,   98m,   98m,   99m,   99m  }),   // afhandeling (norm 98)
            (24, new[] { 40m,   41m,   42m,   43m,   44m  }),   // automatisering (norm 50) → ~86%
            (25, new[] { 57m,   58m,   59m,   60m,   61m  }),   // standaardisatie (norm 70) → ~86%
            (26, new[] { 52m,   53m,   54m,   55m,   56m  }),   // digitale kanalen (norm 65) → ~84%
        };

        var metingen = new List<Meting>();
        foreach (var (doelIdx, waarden) in metingData)
        {
            for (int p = 0; p < periodes.Length; p++)
            {
                metingen.Add(new Meting
                {
                    MetingsdoelId = doelen[doelIdx].Id,
                    PeriodeId     = periodes[p].Id,
                    Waarde        = waarden[p],
                    Datum         = periodes[p].Startdatum.AddDays(45),
                    Bron          = "Seed",
                    Gevalideerd   = true,
                });
            }
        }
        db.Metingen.AddRange(metingen);

        // --- Veranderingen ---
        db.Veranderingen.AddRange(
            new Verandering { Domein = domein, Naam = "Digitaal loket fase 2", Omschrijving = "Online aanvraag rijbewijs mogelijk maken.", Type = VeranderingType.Technisch, Status = VeranderingStatus.Actief, Prioriteit = 1, Kosten = 45000, Startdatum = new DateTime(2025, 10, 1), Einddatum = new DateTime(2026, 3, 31) },
            new Verandering { Domein = domein, Naam = "Procesoptimalisatie BRP",Omschrijving = "Doorlooptijd uittreksel terugbrengen via procesherinrichting.", Type = VeranderingType.Procesmatig, Status = VeranderingStatus.Gepland, Prioriteit = 2, Kosten = 12000, Startdatum = new DateTime(2026, 1, 1), Einddatum = new DateTime(2026, 6, 30) },
            new Verandering { Domein = domein, Naam = "Training frontoffice",  Omschrijving = "Kwaliteitsverbetering afhandeling rijbewijzen.", Type = VeranderingType.Structureel, Status = VeranderingStatus.Actief, Prioriteit = 3, Kosten = 8000, Startdatum = new DateTime(2025, 11, 1), Einddatum = new DateTime(2026, 2, 28) }
        );

        await db.SaveChangesAsync();

        // (gebruikers worden bovenaan geseed, na SaveChanges zijn alle IDs beschikbaar)
    }

    private static async Task SeedRollenAsync(ValorisDbContext db)
    {
        var bestaand = await db.Rollen.Select(r => r.Naam).ToListAsync();
        var nieuw = new[] { "beheerder", "redacteur", "lezer" }
            .Where(n => !bestaand.Contains(n))
            .Select(n => new Rol { Naam = n });
        db.Rollen.AddRange(nieuw);
        if (nieuw.Any()) await db.SaveChangesAsync();
    }

    private static async Task SeedGebruikersAsync(ValorisDbContext db)
    {
        if (await db.Gebruikers.AnyAsync()) return;

        var domeinId = await db.Domeinen.Select(d => d.Id).FirstOrDefaultAsync();
        if (domeinId == 0) return; // domeinen nog niet aangemaakt

        var rollen = await db.Rollen.ToDictionaryAsync(r => r.Naam, r => r.Id);
        if (!rollen.ContainsKey("beheerder")) return;

        var admin     = new Gebruiker { Email = "admin@valoris.nl",     Naam = "Admin",     WachtwoordHash = PasswordHasher.Hash("admin"),     Actief = true };
        var redacteur = new Gebruiker { Email = "redacteur@valoris.nl", Naam = "Redacteur", WachtwoordHash = PasswordHasher.Hash("redacteur"), Actief = true };
        var lezer     = new Gebruiker { Email = "lezer@valoris.nl",     Naam = "Lezer",     WachtwoordHash = PasswordHasher.Hash("lezer"),     Actief = true };

        db.Gebruikers.AddRange(admin, redacteur, lezer);
        await db.SaveChangesAsync();

        db.GebruikerDomeinRollen.AddRange(
            new GebruikerDomeinRol { GebruikerId = admin.Id,     DomeinId = domeinId, RolId = rollen["beheerder"] },
            new GebruikerDomeinRol { GebruikerId = redacteur.Id, DomeinId = domeinId, RolId = rollen["redacteur"] },
            new GebruikerDomeinRol { GebruikerId = lezer.Id,     DomeinId = domeinId, RolId = rollen["lezer"] }
        );
        await db.SaveChangesAsync();
    }

    private static async Task PatchIconenAsync(ValorisDbContext db)
    {
        var icoonMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Identiteitsbewijs"]    = "🪪",
            ["Uittreksel BRP"]       = "📄",
            ["Rijbewijsverlenging"]  = "🚗",
            ["Verhuizing doorgeven"] = "🏠",
            ["Huwelijksaangifte"]    = "💍",
        };

        var zaaksoorten = await db.Zaaksoorten
            .Where(z => z.Icoon == null)
            .ToListAsync();

        foreach (var z in zaaksoorten)
            if (icoonMap.TryGetValue(z.Naam, out var icoon))
                z.Icoon = icoon;

        if (zaaksoorten.Any())
            await db.SaveChangesAsync();
    }

    private static async Task PatchBehandelingAsync(ValorisDbContext db)
    {
        var behandelingMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Identiteitsbewijs"]    = "Balie",
            ["Uittreksel BRP"]       = "Online",
            ["Rijbewijsverlenging"]  = "Balie",
            ["Verhuizing doorgeven"] = "Online",
            ["Huwelijksaangifte"]    = "Balie",
        };

        var zaaksoorten = await db.Zaaksoorten
            .Where(z => z.Behandeling == null)
            .ToListAsync();

        foreach (var z in zaaksoorten)
            if (behandelingMap.TryGetValue(z.Naam, out var behandeling))
                z.Behandeling = behandeling;

        if (zaaksoorten.Any())
            await db.SaveChangesAsync();
    }
}
