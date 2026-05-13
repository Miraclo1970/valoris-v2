using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api")]
public class MetingenController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public MetingenController(ValorisDbContext db) => _db = db;

    [HttpGet("domeinen/{domeinId}/metingen")]
    public async Task<IActionResult> GetByDomein(int domeinId)
    {
        if (!await _db.Domeinen.AnyAsync(d => d.Id == domeinId))
            return NotFound();

        var metingen = await _db.Metingen
            .Where(m => m.Metingsdoel.DomeinIndicator.DomeinId == domeinId)
            .Select(m => new MetingDto(
                m.Id, m.MetingsdoelId, m.PeriodeId,
                m.Waarde, m.Datum, m.Bron, m.Gevalideerd))
            .ToListAsync();
        return Ok(metingen);
    }

    [HttpPost("metingen")]
    public async Task<IActionResult> Create(MetingCreateDto dto)
    {
        var meting = new Meting
        {
            MetingsdoelId = dto.MetingsdoelId,
            PeriodeId = dto.PeriodeId,
            Waarde = dto.Waarde,
            Datum = dto.Datum,
            Bron = dto.Bron
        };
        _db.Metingen.Add(meting);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Create), new { id = meting.Id }, meting.Id);
    }

    [HttpPut("metingen/{id}")]
    public async Task<IActionResult> Update(int id, MetingUpdateDto dto)
    {
        var meting = await _db.Metingen.FindAsync(id);
        if (meting is null) return NotFound();

        meting.Waarde = dto.Waarde;
        meting.Datum = dto.Datum;
        meting.Bron = dto.Bron;
        meting.Gevalideerd = dto.Gevalideerd;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
