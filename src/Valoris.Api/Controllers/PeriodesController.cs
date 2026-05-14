using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/periodes")]
[Authorize]
public class PeriodesController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public PeriodesController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var periodes = await _db.Periodes
            .OrderByDescending(p => p.Startdatum)
            .Select(p => new { p.Id, p.Startdatum, p.Einddatum, Type = p.Type.ToString().ToLower() })
            .ToListAsync();
        return Ok(periodes);
    }

    [HttpPost]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Create([FromBody] PeriodeCreate body)
    {
        if (!Enum.TryParse<PeriodeType>(body.Type, true, out var type))
            return BadRequest("Ongeldig type");

        var periode = new Periode
        {
            Startdatum = body.Startdatum,
            Einddatum = body.Einddatum,
            Type = type,
        };
        _db.Periodes.Add(periode);
        await _db.SaveChangesAsync();
        return Ok(periode.Id);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Update(int id, [FromBody] PeriodeCreate body)
    {
        var periode = await _db.Periodes.FindAsync(id);
        if (periode is null) return NotFound();
        if (!Enum.TryParse<PeriodeType>(body.Type, true, out var type))
            return BadRequest("Ongeldig type");

        periode.Startdatum = body.Startdatum;
        periode.Einddatum = body.Einddatum;
        periode.Type = type;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
