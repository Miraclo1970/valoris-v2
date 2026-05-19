using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/domeinen/{domeinId}/producten")]
[Authorize]
public class ProductenController : ControllerBase
{
    private readonly ValorisDbContext _db;
    public ProductenController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(int domeinId)
    {
        var producten = await _db.Producten
            .Where(p => p.DomeinId == domeinId && p.Actief)
            .OrderBy(p => p.Naam)
            .Select(p => new { p.Id, p.DomeinId, p.Naam, p.Omschrijving, p.Actief })
            .ToListAsync();
        return Ok(producten);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int domeinId, [FromBody] ProductBody body)
    {
        var product = new Product { DomeinId = domeinId, Naam = body.Naam, Omschrijving = body.Omschrijving ?? string.Empty };
        _db.Producten.Add(product);
        await _db.SaveChangesAsync();
        return Ok(product.Id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int domeinId, int id, [FromBody] ProductBody body)
    {
        var product = await _db.Producten.FirstOrDefaultAsync(p => p.Id == id && p.DomeinId == domeinId);
        if (product is null) return NotFound();
        product.Naam = body.Naam;
        product.Omschrijving = body.Omschrijving ?? string.Empty;
        product.Actief = body.Actief ?? product.Actief;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record ProductBody(string Naam, string? Omschrijving, bool? Actief);
}
