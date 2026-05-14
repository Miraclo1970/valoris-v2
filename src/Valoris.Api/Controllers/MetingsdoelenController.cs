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
public class MetingsdoelenController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public MetingsdoelenController(ValorisDbContext db) => _db = db;

    [HttpGet("domeinen/{domeinId}/metingsdoelen")]
    public async Task<IActionResult> GetByDomein(int domeinId)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == domeinId))
            return NotFound();

        var metingsdoelen = await _db.Metingsdoelen
            .Where(m => m.DomeinIndicator.DomeinId == domeinId && m.Actief)
            .Include(m => m.DomeinIndicator).ThenInclude(di => di.Indicator)
            .Include(m => m.Zaaksoort)
            .Select(m => new MetingsdoelDto(
                m.Id,
                m.DomeinIndicatorId,
                m.ZaaksoortId,
                m.Zaaksoort.Naam,
                m.DomeinIndicator.Indicator.Naam,
                m.NormWaarde,
                m.NormRichting.ToString().ToLower(),
                m.Gewicht,
                m.Actief))
            .ToListAsync();
        return Ok(metingsdoelen);
    }

    [HttpPost("metingsdoelen")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Create(MetingsdoelCreateDto dto)
    {
        if (!Enum.TryParse<NormRichting>(dto.NormRichting, ignoreCase: true, out var richting))
            return BadRequest("Onbekende NormRichting.");

        var metingsdoel = new Metingsdoel
        {
            DomeinIndicatorId = dto.DomeinIndicatorId,
            ZaaksoortId = dto.ZaaksoortId,
            NormWaarde = dto.NormWaarde,
            NormRichting = richting,
            Gewicht = dto.Gewicht
        };
        _db.Metingsdoelen.Add(metingsdoel);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Create), new { id = metingsdoel.Id }, metingsdoel.Id);
    }

    [HttpPut("metingsdoelen/{id}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Update(int id, MetingsdoelUpdateDto dto)
    {
        var metingsdoel = await _db.Metingsdoelen.FindAsync(id);
        if (metingsdoel is null) return NotFound();

        if (!Enum.TryParse<NormRichting>(dto.NormRichting, ignoreCase: true, out var richting))
            return BadRequest("Onbekende NormRichting.");

        metingsdoel.NormWaarde = dto.NormWaarde;
        metingsdoel.NormRichting = richting;
        metingsdoel.Gewicht = dto.Gewicht;
        metingsdoel.Actief = dto.Actief;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
