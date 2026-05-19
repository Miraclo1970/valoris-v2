using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/domeinen/{domeinId}/processen")]
[Authorize]
public class ProcessenController : ControllerBase
{
    private readonly ValorisDbContext _db;
    public ProcessenController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(int domeinId)
    {
        var processen = await _db.Processen
            .Where(p => p.DomeinId == domeinId && p.Actief)
            .OrderBy(p => p.Volgorde)
            .Select(p => new { p.Id, p.DomeinId, p.Naam, p.Omschrijving, p.Volgorde, p.Actief })
            .ToListAsync();
        return Ok(processen);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int domeinId, [FromBody] ProcesBody body)
    {
        var maxVolgorde = await _db.Processen
            .Where(p => p.DomeinId == domeinId)
            .MaxAsync(p => (int?)p.Volgorde) ?? 0;

        var proces = new Proces
        {
            DomeinId = domeinId,
            Naam = body.Naam,
            Omschrijving = body.Omschrijving ?? string.Empty,
            Volgorde = body.Volgorde ?? maxVolgorde + 1
        };
        _db.Processen.Add(proces);
        await _db.SaveChangesAsync();
        return Ok(proces.Id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int domeinId, int id, [FromBody] ProcesBody body)
    {
        var proces = await _db.Processen.FirstOrDefaultAsync(p => p.Id == id && p.DomeinId == domeinId);
        if (proces is null) return NotFound();
        proces.Naam = body.Naam;
        proces.Omschrijving = body.Omschrijving ?? string.Empty;
        if (body.Volgorde.HasValue) proces.Volgorde = body.Volgorde.Value;
        if (body.Actief.HasValue) proces.Actief = body.Actief.Value;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record ProcesBody(string Naam, string? Omschrijving, int? Volgorde, bool? Actief);
}
