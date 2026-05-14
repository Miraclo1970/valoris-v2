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
public class VeranderimpactController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public VeranderimpactController(ValorisDbContext db) => _db = db;

    [HttpGet("domeinen/{domeinId}/veranderimpact")]
    public async Task<IActionResult> GetByDomein(int domeinId)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == domeinId))
            return NotFound();

        var impacts = await _db.Veranderimpacten
            .Where(vi => vi.Verandering.DomeinId == domeinId)
            .Select(vi => new VeranderimpactDto(
                vi.Id, vi.VeranderingId, vi.MetingsdoelId, vi.PeriodeId,
                vi.Waarde, vi.Type.ToString().ToLower()))
            .ToListAsync();
        return Ok(impacts);
    }

    [HttpPost("veranderimpact")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> Create(VeranderimpactCreateDto dto)
    {
        if (!Enum.TryParse<ImpactType>(dto.Type, ignoreCase: true, out var type))
            return BadRequest("Onbekend Type.");

        var impact = new Veranderimpact
        {
            VeranderingId = dto.VeranderingId,
            MetingsdoelId = dto.MetingsdoelId,
            PeriodeId = dto.PeriodeId,
            Waarde = dto.Waarde,
            Type = type
        };
        _db.Veranderimpacten.Add(impact);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Create), new { id = impact.Id }, impact.Id);
    }

    [HttpPut("veranderimpact/{id}")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> Update(int id, VeranderimpactUpdateDto dto)
    {
        var impact = await _db.Veranderimpacten.FindAsync(id);
        if (impact is null) return NotFound();

        if (!Enum.TryParse<ImpactType>(dto.Type, ignoreCase: true, out var type))
            return BadRequest("Onbekend Type.");

        impact.Waarde = dto.Waarde;
        impact.Type = type;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("veranderimpact/{id}")]
    [Authorize(Roles = "beheerder,redacteur")]
    public async Task<IActionResult> Delete(int id)
    {
        var impact = await _db.Veranderimpacten.FindAsync(id);
        if (impact is null) return NotFound();

        _db.Veranderimpacten.Remove(impact);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
