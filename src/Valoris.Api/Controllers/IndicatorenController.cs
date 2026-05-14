using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Helpers;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/indicatoren")]
[Authorize]
public class IndicatorenController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public IndicatorenController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var indicatoren = await _db.Indicatoren
            .Where(i => i.Actief)
            .OrderBy(i => i.Type).ThenBy(i => i.Naam)
            .ToListAsync();

        return Ok(indicatoren.Select(i => new IndicatorDto(
            i.Id, i.Naam,
            i.Type.ToString().ToLower(),
            i.Eenheid,
            AggHelper.ToString(i.Aggregatiewijze),
            i.Actief)));
    }

    [HttpPost]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Create([FromBody] IndicatorCreate body)
    {
        if (!Enum.TryParse<IndicatorType>(body.Type, true, out var type))
            return BadRequest("Ongeldig type");
        if (!AggHelper.TryParse(body.Aggregatiewijze, out var agg))
            return BadRequest("Ongeldige aggregatiewijze");

        var indicator = new Indicator
        {
            Naam = body.Naam,
            Type = type,
            Eenheid = body.Eenheid,
            Aggregatiewijze = agg,
            Actief = true,
        };
        _db.Indicatoren.Add(indicator);
        await _db.SaveChangesAsync();
        return Ok(indicator.Id);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "beheerder")]
    public async Task<IActionResult> Update(int id, [FromBody] IndicatorCreate body)
    {
        var indicator = await _db.Indicatoren.FindAsync(id);
        if (indicator is null) return NotFound();
        if (!Enum.TryParse<IndicatorType>(body.Type, true, out var type))
            return BadRequest("Ongeldig type");
        if (!AggHelper.TryParse(body.Aggregatiewijze, out var agg))
            return BadRequest("Ongeldige aggregatiewijze");

        indicator.Naam = body.Naam;
        indicator.Type = type;
        indicator.Eenheid = body.Eenheid;
        indicator.Aggregatiewijze = agg;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
