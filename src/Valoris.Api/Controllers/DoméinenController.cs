using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Helpers;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/domeinen")]
[Authorize]
public class DoméinenController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public DoméinenController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var domeinen = await _db.Domeinen
            .Where(d => d.Actief)
            .Select(d => new DomeinDto(
                d.Id, d.Naam, d.Omschrijving,
                d.Basisperiode.ToString().ToLower(),
                d.Interventiedrempel, d.Actief))
            .ToListAsync();
        return Ok(domeinen);
    }

    [HttpPost]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Create([FromBody] DomeinCreate body)
    {
        if (!Enum.TryParse<PeriodeType>(body.Basisperiode, true, out var periodeType))
            return BadRequest("Ongeldige basisperiode");

        var domein = new Domein
        {
            Naam = body.Naam,
            Omschrijving = body.Omschrijving,
            Basisperiode = periodeType,
            Interventiedrempel = body.Interventiedrempel,
            Actief = true,
        };
        _db.Domeinen.Add(domein);
        await _db.SaveChangesAsync();
        return Ok(domein.Id);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Update(int id, [FromBody] DomeinCreate body)
    {
        var domein = await _db.Domeinen.FindAsync(id);
        if (domein is null) return NotFound();
        if (!Enum.TryParse<PeriodeType>(body.Basisperiode, true, out var periodeType))
            return BadRequest("Ongeldige basisperiode");

        domein.Naam = body.Naam;
        domein.Omschrijving = body.Omschrijving;
        domein.Basisperiode = periodeType;
        domein.Interventiedrempel = body.Interventiedrempel;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/zaaksoorten")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> CreateZaaksoort(int id, [FromBody] ZaaksoortCreate body)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == id)) return NotFound();
        var maxVolgorde = await _db.Zaaksoorten
            .Where(z => z.DomeinId == id)
            .Select(z => (int?)z.Volgorde)
            .MaxAsync() ?? 0;
        var z = new Zaaksoort
        {
            DomeinId = id,
            Naam = body.Naam,
            Omschrijving = body.Omschrijving,
            Icoon = body.Icoon,
            Behandeling = body.Behandeling,
            Volgorde = maxVolgorde + 1,
            Actief = true,
        };
        _db.Zaaksoorten.Add(z);
        await _db.SaveChangesAsync();
        return Ok(z.Id);
    }

    [HttpPut("{id}/zaaksoorten/{zaaksoortId:int}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> UpdateZaaksoort(int id, int zaaksoortId, [FromBody] ZaaksoortCreate body)
    {
        var z = await _db.Zaaksoorten.FirstOrDefaultAsync(z => z.Id == zaaksoortId && z.DomeinId == id);
        if (z is null) return NotFound();
        z.Naam = body.Naam;
        z.Omschrijving = body.Omschrijving;
        z.Icoon = body.Icoon;
        z.Behandeling = body.Behandeling;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/zaaksoorten")]
    public async Task<IActionResult> GetZaaksoorten(int id)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == id))
            return NotFound();

        var zaaksoorten = await _db.Zaaksoorten
            .Where(z => z.DomeinId == id && z.Actief)
            .OrderBy(z => z.Volgorde)
            .Select(z => new ZaaksoortDto(
                z.Id, z.DomeinId, z.Naam, z.Omschrijving, z.Icoon, z.Behandeling, z.Volgorde, z.Actief))
            .ToListAsync();
        return Ok(zaaksoorten);
    }

    [HttpPut("{id}/zaaksoorten/herschikken")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> HerschikZaaksoorten(int id, [FromBody] int[] volgordeIds)
    {
        var zaaksoorten = await _db.Zaaksoorten
            .Where(z => z.DomeinId == id && z.Actief)
            .ToListAsync();

        for (var i = 0; i < volgordeIds.Length; i++)
        {
            var z = zaaksoorten.FirstOrDefault(x => x.Id == volgordeIds[i]);
            if (z is not null) z.Volgorde = i + 1;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/zaaksoorten/{zaaksoortId:int}/verplaats")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> VerplaatsZaaksoort(int id, int zaaksoortId, [FromBody] VerplaatsBody body)
    {
        var zaaksoorten = await _db.Zaaksoorten
            .Where(z => z.DomeinId == id && z.Actief)
            .OrderBy(z => z.Volgorde)
            .ToListAsync();

        var idx = zaaksoorten.FindIndex(z => z.Id == zaaksoortId);
        if (idx < 0) return NotFound();

        var swapIdx = body.Richting == "omhoog" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= zaaksoorten.Count) return BadRequest("Kan niet verder verschuiven");

        (zaaksoorten[idx].Volgorde, zaaksoorten[swapIdx].Volgorde) =
            (zaaksoorten[swapIdx].Volgorde, zaaksoorten[idx].Volgorde);

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/periodes")]
    public async Task<IActionResult> GetPeriodes(int id)
    {
        var domein = await _db.Domeinen.FindAsync(id);
        if (domein is null) return NotFound();

        var periodes = await _db.Periodes
            .Where(p => p.Type == domein.Basisperiode)
            .OrderByDescending(p => p.Startdatum)
            .Select(p => new { p.Id, p.Startdatum, p.Einddatum, Type = p.Type.ToString().ToLower() })
            .ToListAsync();
        return Ok(periodes);
    }

    [HttpGet("{id}/periodes/huidig")]
    public async Task<IActionResult> GetHuidigePeride(int id)
    {
        var domein = await _db.Domeinen.FindAsync(id);
        if (domein is null) return NotFound();

        var periode = await _db.Periodes
            .Where(p => p.Startdatum <= DateTime.Today
                     && p.Einddatum >= DateTime.Today
                     && p.Type == domein.Basisperiode)
            .OrderByDescending(p => p.Startdatum)
            .FirstOrDefaultAsync()
          ?? await _db.Periodes.OrderByDescending(p => p.Einddatum).FirstOrDefaultAsync();

        if (periode is null) return NotFound();
        return Ok(new { periode.Id, periode.Startdatum, periode.Einddatum, Type = periode.Type.ToString().ToLower() });
    }

    [HttpPost("{id}/indicatoren")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> KoppelIndicator(int id, [FromBody] DomeinIndicatorCreate body)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == id)) return NotFound();
        var bestaand = await _db.DomeinIndicatoren
            .FirstOrDefaultAsync(di => di.DomeinId == id && di.IndicatorId == body.IndicatorId);
        if (bestaand is not null)
        {
            bestaand.Actief = true;
            await _db.SaveChangesAsync();
            return Ok(bestaand.Id);
        }
        var di = new DomeinIndicator { DomeinId = id, IndicatorId = body.IndicatorId, Actief = true };
        _db.DomeinIndicatoren.Add(di);
        await _db.SaveChangesAsync();
        return Ok(di.Id);
    }

    [HttpDelete("{id}/indicatoren/{domeinIndicatorId}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> OntkoppelIndicator(int id, int domeinIndicatorId)
    {
        var di = await _db.DomeinIndicatoren
            .FirstOrDefaultAsync(di => di.Id == domeinIndicatorId && di.DomeinId == id);
        if (di is null) return NotFound();
        di.Actief = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/indicatoren")]
    public async Task<IActionResult> GetIndicatoren(int id)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == id))
            return NotFound();

        var indicatoren = await _db.DomeinIndicatoren
            .Where(di => di.DomeinId == id && di.Actief)
            .Include(di => di.Indicator)
            .ToListAsync();

        return Ok(indicatoren.Select(di => new DomeinIndicatorDto(
            di.Id, di.DomeinId, di.IndicatorId,
            di.Indicator.Naam,
            di.Indicator.Type.ToString().ToLower(),
            di.Indicator.Eenheid,
            AggHelper.ToString(di.Indicator.Aggregatiewijze),
            di.Actief)));
    }
}
