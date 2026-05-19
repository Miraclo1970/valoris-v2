using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/domeinen/{domeinId}/scope")]
[Authorize]
public class ZaaksoortScopeController : ControllerBase
{
    private readonly ValorisDbContext _db;
    public ZaaksoortScopeController(ValorisDbContext db) => _db = db;

    /// <summary>
    /// Volledige scope matrix voor een domein:
    /// - Alle producten (rijen)
    /// - Alle processen (kolommen)
    /// - Alle zaaksoort-scope koppelingen
    /// - Alle zaaksoorten met HoofdprocesId
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMatrix(int domeinId)
    {
        var producten = await _db.Producten
            .Where(p => p.DomeinId == domeinId && p.Actief)
            .OrderBy(p => p.Naam)
            .Select(p => new { p.Id, p.Naam, p.Omschrijving })
            .ToListAsync();

        var processen = await _db.Processen
            .Where(p => p.DomeinId == domeinId && p.Actief)
            .OrderBy(p => p.Volgorde)
            .Select(p => new { p.Id, p.Naam, p.Omschrijving, p.Volgorde })
            .ToListAsync();

        var scopes = await _db.ZaaksoortScopes
            .Where(s => s.DomeinId == domeinId)
            .Select(s => new
            {
                s.Id,
                s.ZaaksoortId,
                s.ProductId,
                s.ProcesId,
                Type = s.Type.ToString().ToLower(),
                FrequentiePeriode = s.FrequentiePeriode.HasValue ? s.FrequentiePeriode.Value.ToString().ToLower() : null,
                s.Frequentie
            })
            .ToListAsync();

        var zaaksoorten = await _db.Zaaksoorten
            .Where(z => z.DomeinId == domeinId && z.Actief)
            .OrderBy(z => z.Volgorde)
            .Select(z => new { z.Id, z.Naam, z.Icoon, z.Behandeling, z.HoofdprocesId })
            .ToListAsync();

        return Ok(new { producten, processen, scopes, zaaksoorten });
    }

    [HttpPost("scopes")]
    public async Task<IActionResult> Create(int domeinId, [FromBody] ScopeBody body)
    {
        // Uniekheidscheck: binnen dit domein mag product×proces maar één keer voorkomen
        var bestaat = await _db.ZaaksoortScopes
            .AnyAsync(s => s.DomeinId == domeinId && s.ProductId == body.ProductId && s.ProcesId == body.ProcesId);
        if (bestaat)
            return Conflict(new { fout = "Deze product-procescombinatie is al gekoppeld aan een zaaksoort in dit domein." });

        if (!Enum.TryParse<ScopeType>(body.Type, true, out var type))
            return BadRequest(new { fout = "Ongeldig type. Kies verplicht of optioneel." });

        FrequentiePeriode? fp = null;
        if (!string.IsNullOrEmpty(body.FrequentiePeriode))
        {
            if (!Enum.TryParse<FrequentiePeriode>(body.FrequentiePeriode, true, out var parsed))
                return BadRequest(new { fout = "Ongeldig frequentieperiode." });
            fp = parsed;
        }

        var scope = new ZaaksoortScope
        {
            DomeinId = domeinId,
            ZaaksoortId = body.ZaaksoortId,
            ProductId = body.ProductId,
            ProcesId = body.ProcesId,
            Type = type,
            FrequentiePeriode = fp,
            Frequentie = body.Frequentie
        };
        _db.ZaaksoortScopes.Add(scope);
        await _db.SaveChangesAsync();
        return Ok(scope.Id);
    }

    [HttpPut("scopes/{id}")]
    public async Task<IActionResult> Update(int domeinId, int id, [FromBody] ScopeUpdateBody body)
    {
        var scope = await _db.ZaaksoortScopes.FirstOrDefaultAsync(s => s.Id == id && s.DomeinId == domeinId);
        if (scope is null) return NotFound();

        if (!Enum.TryParse<ScopeType>(body.Type, true, out var type))
            return BadRequest(new { fout = "Ongeldig type." });

        FrequentiePeriode? fp = null;
        if (!string.IsNullOrEmpty(body.FrequentiePeriode))
        {
            if (!Enum.TryParse<FrequentiePeriode>(body.FrequentiePeriode, true, out var parsed))
                return BadRequest(new { fout = "Ongeldig frequentieperiode." });
            fp = parsed;
        }

        scope.Type = type;
        scope.FrequentiePeriode = fp;
        scope.Frequentie = body.Frequentie;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("scopes/{id}")]
    public async Task<IActionResult> Delete(int domeinId, int id)
    {
        var scope = await _db.ZaaksoortScopes.FirstOrDefaultAsync(s => s.Id == id && s.DomeinId == domeinId);
        if (scope is null) return NotFound();
        _db.ZaaksoortScopes.Remove(scope);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Stel het hoofdproces van een zaaksoort in</summary>
    [HttpPut("zaaksoorten/{zaaksoortId}/hoofdproces")]
    public async Task<IActionResult> SetHoofdproces(int domeinId, int zaaksoortId, [FromBody] HoofdprocesBody body)
    {
        var zaaksoort = await _db.Zaaksoorten.FirstOrDefaultAsync(z => z.Id == zaaksoortId && z.DomeinId == domeinId);
        if (zaaksoort is null) return NotFound();
        zaaksoort.HoofdprocesId = body.HoofdprocesId;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record ScopeBody(int ZaaksoortId, int ProductId, int ProcesId, string Type, string? FrequentiePeriode, decimal? Frequentie);
    public record ScopeUpdateBody(string Type, string? FrequentiePeriode, decimal? Frequentie);
    public record HoofdprocesBody(int? HoofdprocesId);
}
