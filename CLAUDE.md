# Valoris — CLAUDE.md

## Wat bouwen we?

Valoris is een performance management en sturingsinstrument voor publieke dienstverlening.
Organisaties definiëren domeinen, breken die op in zaaksoorten (de klantreis), koppelen
prestatie- en inrichtingsindicatoren aan zaaksoorten, registreren metingen, en plannen
veranderingen. Een strategiematrix visualiseert of de veranderingen de goede kant opgaan.

Dit is een uitbreiding van de bestaande Valoris COMC-codebase — geen nieuw project.

---

## Techstack (niet wijzigen tenzij expliciete technische noodzaak)

### Backend
- ASP.NET Core API (`Valoris.Api`)
- Entity Framework Core 8 (`Microsoft.EntityFrameworkCore.SqlServer` 8.0.x)
- `ValorisDbContext : DbContext` in `src/Valoris.Api/Data/ValorisDbContext.cs`
- Registratie: `AddDbContext` + `UseSqlServer("DefaultConnection")` in `Program.cs`
- Schema-beheer: EF Core migrations in `src/Valoris.Api/Migrations/`
- Database: Microsoft SQL Server (dev: localhost, db Valoris, sa-auth)
- Productie: connection string via omgevingsvariabelen

### Frontend
- React + TypeScript + Vite
- SPA communiceert met de API via fetch / HTTP client
- React Router met RequireAuth en rolgebaseerde guards
- AuthContext voor authenticatie en rolbeheer
- CSS via tokens.css + global.css (design tokens — geen Tailwind)

### Hosting
- VPS (eigen server)
- Geen Supabase, geen externe auth services

---

## Bestaande componenten — hergebruiken

| Component | Gebruik in Valoris nieuw |
|---|---|
| `MatrixChart` | Uitbreiden voor Scherm 3 Strategie |
| `TrendChart` | Meethistorie per indicator Scherm 1 |
| `Sparkline` | Delta-weergave naast indicatorwaarden |
| `InlineNumber` | IST-waarden in alle schermen |
| `Layout / Shell` | Ongewijzigd hergebruiken |
| `AuthContext` | Uitbreiden met drie rollen |
| `Card` | Ongewijzigd hergebruiken |
| `Modal.tsx` | Activeren voor CSV-import Scherm 2 |
| `CausalModelStrip` | Ombouwen naar Klantreis-strip |
| `StructuralChangeViz` | Basis voor impact-canvas Scherm 2 |
| `api/client` | Uitbreiden met nieuwe endpoints |
| `vierWandelingen.ts` | Omzetten naar drie-rollen model |

---

## Datamodel — EF Core entities toevoegen aan ValorisDbContext

```csharp
// Nieuwe entities — toevoegen aan ValorisDbContext als DbSet<T>

Gebruiker          { Id, Email, Naam, Actief }
Rol                { Id, Naam }  // waarden: "beheerder" | "redacteur" | "lezer"
GebruikerDomeinRol { Id, GebruikerId, DomeinId, RolId }

Domein             { Id, Naam, Omschrijving, Basisperiode (enum), Interventiedrempel, Actief }
Zaaksoort          { Id, DomeinId, Naam, Omschrijving, Volgorde (int), Actief }
                   // Volgorde: verplicht, uniek binnen DomeinId

Indicator          { Id, Naam, Type (enum: prestatie|inrichting), Eenheid,
                     Aggregatiewijze (enum: som|gemiddelde|laatste_waarde|gewogen_gemiddelde), Actief }
                   // Indicator = herbruikbare bibliotheek, domein-onafhankelijk

DomeinIndicator    { Id, DomeinId, IndicatorId, Actief }
                   // Tussentabel: maakt Indicator beschikbaar binnen een Domein

Metingsdoel        { Id, DomeinIndicatorId, ZaaksoortId,
                     NormWaarde (decimal), NormRichting (enum: lager_is_beter|hoger_is_beter),
                     Gewicht (decimal), Actief }

Meting             { Id, MetingsdoelId, PeriodeId, Waarde (decimal), Datum, Bron, Gevalideerd }

Periode            { Id, Startdatum, Einddatum, Type (enum: maand|kwartaal|jaar) }
                   // Geen Actief vlag — huidige periode wordt afgeleid (zie logica)

Verandering        { Id, DomeinId, Naam, Omschrijving, Type (enum), Status (enum),
                     Prioriteit (int), Kosten (decimal), Startdatum, Einddatum }

Veranderimpact     { Id, VeranderingId, MetingsdoelId, PeriodeId,
                     Waarde (decimal), Type (enum: verwacht|gerealiseerd) }
                   // Geen directe ZaaksoortId — loopt via MetingsdoelId -> Zaaksoort
```

### EF Core werkwijze
- Voeg entities toe aan `ValorisDbContext` als `DbSet<T>`
- Configureer relaties via Fluent API in `OnModelCreating`
- Schema-wijzigingen altijd via: `dotnet ef migrations add <Naam> --project src/Valoris.Api`
- Nooit handmatig SQL schrijven voor schema-wijzigingen

---

## Autorisatiemodel

Drie rollen via `GebruikerDomeinRol`. Backend is altijd leidend.

| Actie | beheerder | redacteur | lezer |
|---|---|---|---|
| Domein / Zaaksoort / Indicator beheren | ✓ | — | — |
| Metingsdoel aanmaken / bewerken | ✓ | — | — |
| Verandering aanmaken / bewerken | ✓ | ✓ | — |
| Meting invoeren / bewerken | ✓ | ✓ | — |
| Veranderimpact bewerken | ✓ | ✓ | — |
| Alle schermen lezen | ✓ | ✓ | ✓ |

- Backend: `[Authorize(Roles = "beheerder")]` op controllers/endpoints
- Frontend: `AuthContext.hasRole(rol)` voor UI tonen/verbergen — backend blijft leidend

---

## Nieuwe routes (toevoegen aan React Router / App.tsx)

| Pad | Pagina | Minimale rol |
|---|---|---|
| `/inrichting/:domeinId` | `InrichtingPage` | beheerder |
| `/veranderingen/:domeinId` | `VeranderingenPage` | redacteur |
| `/strategie/:domeinId` | `StrategiePage` | lezer |

---

## Bedrijfslogica (implementeer exact zo)

### Huidige periode (T-SQL / EF Core LINQ)
```sql
-- T-SQL
SELECT TOP 1 * FROM Periodes
WHERE Startdatum <= GETDATE()
  AND Einddatum >= GETDATE()
  AND Type = (SELECT Basisperiode FROM Domeinen WHERE Id = @domeinId)
ORDER BY Startdatum DESC

-- Fallback als geen match:
SELECT TOP 1 * FROM Periodes ORDER BY Einddatum DESC
```
```csharp
// EF Core equivalent
var huidigePeriode = await _db.Periodes
    .Where(p => p.Startdatum <= DateTime.Today
             && p.Einddatum >= DateTime.Today
             && p.Type == domein.Basisperiode)
    .OrderByDescending(p => p.Startdatum)
    .FirstOrDefaultAsync()
  ?? await _db.Periodes
    .OrderByDescending(p => p.Einddatum)
    .FirstOrDefaultAsync();
```

### Zaaksoort volgorde
```csharp
// Altijd:
.OrderBy(z => z.Volgorde)
// Nooit zonder OrderBy zaaksoorten ophalen
```

### Aggregatie (Indicator.Aggregatiewijze)
```
som            → SUM(Waarde) binnen periode
gemiddelde     → AVG(Waarde) binnen periode
laatste_waarde → TOP 1 Waarde ORDER BY Datum DESC binnen periode
gewogen_gemiddelde → v1: behandel als gemiddelde
```

### Normalisatie naar 0–100 (strategiematrix, server-side berekenen)
```csharp
double NormaliseerScore(decimal ist, decimal soll, string richting)
{
    if (ist == 0) return 0;
    double score = richting == "lager_is_beter"
        ? (double)soll / (double)ist * 100
        : (double)ist / (double)soll * 100;
    return Math.Clamp(score, 0, 100);
}

// IST per zaaksoort = gewogen gemiddelde van genormaliseerde scores
double index = metingsdoelen
    .Sum(m => NormaliseerScore(m.IstWaarde, m.NormWaarde, m.NormRichting) * (double)m.Gewicht)
    / metingsdoelen.Sum(m => (double)m.Gewicht);
```

### CSV-import veranderingen
```
Verplichte kolom: Naam
Optionele kolommen: Omschrijving, Type, Status
Flow: upload → valideer → INSERT Verandering records via EF Core
Geen externe koppelingen (JIRA etc.) in v1
```

---

## Nieuwe API endpoints (Valoris.Api)

```
GET    /api/domeinen
GET    /api/domeinen/{id}/zaaksoorten          -- altijd ORDER BY Volgorde
GET    /api/domeinen/{id}/indicatoren
GET    /api/domeinen/{id}/metingsdoelen
POST   /api/metingsdoelen
PUT    /api/metingsdoelen/{id}

GET    /api/domeinen/{id}/metingen
POST   /api/metingen
PUT    /api/metingen/{id}

GET    /api/domeinen/{id}/veranderingen
POST   /api/veranderingen
PUT    /api/veranderingen/{id}
POST   /api/veranderingen/import-csv

GET    /api/domeinen/{id}/veranderimpact
POST   /api/veranderimpact
PUT    /api/veranderimpact/{id}
DELETE /api/veranderimpact/{id}

GET    /api/domeinen/{id}/strategie
       -- berekent IST, SOLL, vector per zaaksoort server-side
       -- retourneert genormaliseerde scores (0-100) klaar voor MatrixChart
```

---

## Wat NIET bouwen in v1

- JIRA of andere externe koppelingen
- Vrije askeuze strategiematrix-assen
- `gewogen_gemiddelde` aggregatie (behandel als `gemiddelde`)
- Beheer van Rol-entiteiten (hardcoded: beheerder, redacteur, lezer)
- Nieuwe auth-infrastructuur (bestaande .NET auth hergebruiken)

---

## Conventies

- Volg bestaande naamgeving in `Valoris.Api` en React-componenten
- EF Core migrations voor alle schema-wijzigingen — nooit handmatig SQL
- `MatrixChart` gebruikt Canvas API — geen CSS-positionering voor de matrix
- Frontend-autorisatie via `AuthContext.hasRole()` — backend altijd leidend
- Alle `decimal` velden in C# voor financiële/gewogen waarden
- Nullable references ingeschakeld (`<Nullable>enable</Nullable>`)

---

## Deployment (VPS — Docker Compose)

### Stack op de VPS
- Locatie: `~/valoris` op de VPS
- 6 containers: frontend (React), backend (Valoris.Api), SQL Server, Nginx
- Nginx als reverse proxy op poort 80
- Beheerd via `docker compose`

### Deploy workflow
```bash
git pull                              # laatste versie ophalen
docker compose up -d --build          # rebuild + herstart gewijzigde containers
```

### Aandachtspunten bij nieuwe containers of services
- Elke nieuwe service (bijv. een worker, een extra API) krijgt een eigen service-blok in `docker-compose.yml`
- SQL Server draait al als container — geen tweede instantie toevoegen
- Connection string in de backend-container loopt via de Docker service-naam, niet `localhost`:
  `Server=sqlserver;Database=Valoris;User Id=sa;Password=...`
- Omgevingsvariabelen (connection string, secrets) via `.env` bestand of Docker secrets — nooit hardcoden in `docker-compose.yml`

### Git-authenticatie op de VPS
- Als `git pull` faalt: SSH deploy key of PAT instellen
- Na auth-fix: opnieuw `git pull` + `docker compose up -d --build` voor de nieuwste versie

### Wat NIET wijzigen
- Nginx-configuratie alleen aanpassen als er nieuwe routes of services bijkomen
- SQL Server container niet vervangen door native installatie

---

## Ontwikkelworkflow (lokaal → VPS)

### Twee omgevingen, één codebase

| | Lokaal | VPS (Docker) |
|---|---|---|
| Database host | `localhost` | `sqlserver` (Docker service-naam) |
| Connection string | `appsettings.Development.json` | omgevingsvariabele via `.env` |
| Frontend | `vite dev` (poort 5173) | Nginx (poort 80) |
| Backend | `dotnet run` (poort bijv. 5000) | Docker container |
| ASPNETCORE_ENVIRONMENT | `Development` | `Production` |

### Lokale ontwikkelomgeving opzetten

```bash
# Backend
cd src/Valoris.Api
dotnet run

# Frontend (aparte terminal)
cd src/valoris-frontend
npm run dev
```

Connection string in `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=Valoris;User Id=sa;Password=<jouw-dev-wachtwoord>;TrustServerCertificate=True"
  }
}
```

### Nieuwe EF Core migration (altijd lokaal aanmaken)

```bash
cd src/Valoris.Api
dotnet ef migrations add <Naam>
dotnet ef database update        # past lokale DB direct bij
```

Commit de migration-bestanden mee naar git — op de VPS wordt de migration
automatisch toegepast bij startup via:
```csharp
// Program.cs (al of toe te voegen):
using var scope = app.Services.CreateScope();
scope.ServiceProvider.GetRequiredService<ValorisDbContext>().Database.Migrate();
```

### Deploy naar VPS (testversie)

```bash
# Lokaal: commit + push
git add .
git commit -m "feat: ..."
git push

# Op de VPS:
cd ~/valoris
git pull
docker compose up -d --build
```

### Volgorde bij nieuwe feature

1. **Lokaal:** entity toevoegen aan `ValorisDbContext`
2. **Lokaal:** migration aanmaken en `database update`
3. **Lokaal:** API endpoint bouwen en testen
4. **Lokaal:** React component bouwen en testen tegen lokale API
5. **Commit + push**
6. **VPS:** `git pull` + `docker compose up -d --build`
7. Migration wordt automatisch toegepast bij container-start

### Wat NOOIT doen
- Migrations aanmaken op de VPS — altijd lokaal, dan committen
- `appsettings.Development.json` committen met echte wachtwoorden
- Connection string hardcoden in `docker-compose.yml` (gebruik `.env`)
