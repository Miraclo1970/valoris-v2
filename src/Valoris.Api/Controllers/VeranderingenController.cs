using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class VeranderingenController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public VeranderingenController(ValorisDbContext db) => _db = db;

    [HttpGet("domeinen/{domeinId}/veranderingen")]
    public async Task<IActionResult> GetByDomein(int domeinId)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == domeinId))
            return NotFound();

        var veranderingen = await _db.Veranderingen
            .Where(v => v.DomeinId == domeinId)
            .Select(v => new VeranderingDto(
                v.Id, v.DomeinId, v.Naam, v.Omschrijving,
                v.Type.ToString().ToLower(),
                v.Status.ToString().ToLower(),
                v.Prioriteit, v.Kosten,
                v.Startdatum, v.Einddatum))
            .ToListAsync();
        return Ok(veranderingen);
    }

    [HttpPost("veranderingen")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> Create(VeranderingCreateDto dto)
    {
        if (!Enum.TryParse<VeranderingType>(dto.Type, ignoreCase: true, out var type))
            return BadRequest("Onbekend Type.");
        if (!Enum.TryParse<VeranderingStatus>(dto.Status, ignoreCase: true, out var status))
            return BadRequest("Onbekende Status.");

        var verandering = new Verandering
        {
            DomeinId = dto.DomeinId,
            Naam = dto.Naam,
            Omschrijving = dto.Omschrijving,
            Type = type,
            Status = status,
            Prioriteit = dto.Prioriteit,
            Kosten = dto.Kosten,
            Startdatum = dto.Startdatum,
            Einddatum = dto.Einddatum
        };
        _db.Veranderingen.Add(verandering);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Create), new { id = verandering.Id }, verandering.Id);
    }

    [HttpPut("veranderingen/{id}")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> Update(int id, VeranderingUpdateDto dto)
    {
        var verandering = await _db.Veranderingen.FindAsync(id);
        if (verandering is null) return NotFound();

        if (!Enum.TryParse<VeranderingType>(dto.Type, ignoreCase: true, out var type))
            return BadRequest("Onbekend Type.");
        if (!Enum.TryParse<VeranderingStatus>(dto.Status, ignoreCase: true, out var status))
            return BadRequest("Onbekende Status.");

        verandering.Naam = dto.Naam;
        verandering.Omschrijving = dto.Omschrijving;
        verandering.Type = type;
        verandering.Status = status;
        verandering.Prioriteit = dto.Prioriteit;
        verandering.Kosten = dto.Kosten;
        verandering.Startdatum = dto.Startdatum;
        verandering.Einddatum = dto.Einddatum;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("veranderingen/import-csv")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> ImportCsv(IFormFile file, [FromQuery] int domeinId)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == domeinId))
            return NotFound("Domein niet gevonden.");

        if (file is null || file.Length == 0)
            return BadRequest("Geen bestand ontvangen.");

        var veranderingen = new List<Verandering>();
        var errors = new List<string>();

        using var reader = new System.IO.StreamReader(file.OpenReadStream());
        var header = await reader.ReadLineAsync();
        if (header is null) return BadRequest("Leeg CSV-bestand.");

        var columns = header.Split(',').Select(c => c.Trim().ToLower()).ToArray();
        int naamIdx = Array.IndexOf(columns, "naam");
        if (naamIdx < 0) return BadRequest("Verplichte kolom 'Naam' ontbreekt.");

        int omschrijvingIdx = Array.IndexOf(columns, "omschrijving");
        int typeIdx = Array.IndexOf(columns, "type");
        int statusIdx = Array.IndexOf(columns, "status");

        int lineNumber = 1;
        string? line;
        while ((line = await reader.ReadLineAsync()) is not null)
        {
            lineNumber++;
            var fields = line.Split(',');
            var naam = fields.ElementAtOrDefault(naamIdx)?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(naam))
            {
                errors.Add($"Regel {lineNumber}: Naam is verplicht.");
                continue;
            }

            VeranderingType type = VeranderingType.Overig;
            if (typeIdx >= 0)
            {
                var typeStr = fields.ElementAtOrDefault(typeIdx)?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(typeStr) &&
                    !Enum.TryParse(typeStr, ignoreCase: true, out type))
                    errors.Add($"Regel {lineNumber}: Onbekend Type '{typeStr}' — 'overig' gebruikt.");
            }

            VeranderingStatus status = VeranderingStatus.Gepland;
            if (statusIdx >= 0)
            {
                var statusStr = fields.ElementAtOrDefault(statusIdx)?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(statusStr) &&
                    !Enum.TryParse(statusStr, ignoreCase: true, out status))
                    errors.Add($"Regel {lineNumber}: Onbekende Status '{statusStr}' — 'gepland' gebruikt.");
            }

            veranderingen.Add(new Verandering
            {
                DomeinId = domeinId,
                Naam = naam,
                Omschrijving = omschrijvingIdx >= 0 ? (fields.ElementAtOrDefault(omschrijvingIdx)?.Trim() ?? string.Empty) : string.Empty,
                Type = type,
                Status = status,
                Prioriteit = 0,
                Kosten = 0,
                Startdatum = DateTime.Today,
                Einddatum = DateTime.Today
            });
        }

        _db.Veranderingen.AddRange(veranderingen);
        await _db.SaveChangesAsync();

        return Ok(new { imported = veranderingen.Count, warnings = errors });
    }
}
