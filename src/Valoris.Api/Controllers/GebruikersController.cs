using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Services;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/gebruikers")]
[Authorize(Roles = "beheerder")]
public class GebruikersController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public GebruikersController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var gebruikers = await _db.Gebruikers
            .Where(g => g.Actief)
            .Include(g => g.DomeinRollen).ThenInclude(r => r.Rol)
            .Include(g => g.DomeinRollen).ThenInclude(r => r.Domein)
            .OrderBy(g => g.Naam)
            .ToListAsync();

        return Ok(gebruikers.Select(g => new
        {
            g.Id, g.Naam, g.Email, g.Actief,
            rollen = g.DomeinRollen.Select(r => new
            {
                id = r.Id,
                domeinId = r.DomeinId,
                domeinNaam = r.Domein.Naam,
                rol = r.Rol.Naam,
            }),
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GebruikerCreate body)
    {
        if (await _db.Gebruikers.AnyAsync(g => g.Email == body.Email))
            return Conflict(new { fout = "E-mailadres al in gebruik." });

        var gebruiker = new Gebruiker
        {
            Email = body.Email,
            Naam = body.Naam,
            WachtwoordHash = PasswordHasher.Hash(body.Wachtwoord),
            Actief = true,
        };
        _db.Gebruikers.Add(gebruiker);
        await _db.SaveChangesAsync();
        return Ok(gebruiker.Id);
    }

    [HttpPut("{id}/wachtwoord")]
    public async Task<IActionResult> WijzigWachtwoord(int id, [FromBody] WachtwoordWijzig body)
    {
        var gebruiker = await _db.Gebruikers.FindAsync(id);
        if (gebruiker is null) return NotFound();
        gebruiker.WachtwoordHash = PasswordHasher.Hash(body.NieuwWachtwoord);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/rollen")]
    [Authorize]  // alle ingelogde gebruikers mogen eigen rollen ophalen
    public async Task<IActionResult> GetRollen(int id)
    {
        var rollen = await _db.GebruikerDomeinRollen
            .Where(r => r.GebruikerId == id)
            .Include(r => r.Rol)
            .Select(r => new { domeinId = r.DomeinId, rol = r.Rol.Naam })
            .ToListAsync();
        return Ok(rollen);
    }

    [HttpPost("{id}/rollen")]
    public async Task<IActionResult> KoppelRol(int id, [FromBody] RolKoppeling body)
    {
        if (!await _db.Gebruikers.AnyAsync(g => g.Id == id)) return NotFound();

        var rol = await _db.Rollen.FirstOrDefaultAsync(r => r.Naam == body.Rol);
        if (rol is null) return BadRequest(new { fout = "Onbekende rol." });

        var bestaand = await _db.GebruikerDomeinRollen
            .FirstOrDefaultAsync(r => r.GebruikerId == id && r.DomeinId == body.DomeinId);

        if (bestaand is not null)
            bestaand.RolId = rol.Id;
        else
            _db.GebruikerDomeinRollen.Add(new GebruikerDomeinRol { GebruikerId = id, DomeinId = body.DomeinId, RolId = rol.Id });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}/rollen/{rolId}")]
    public async Task<IActionResult> OntkoppelRol(int id, int rolId)
    {
        var koppeling = await _db.GebruikerDomeinRollen
            .FirstOrDefaultAsync(r => r.Id == rolId && r.GebruikerId == id);
        if (koppeling is null) return NotFound();
        _db.GebruikerDomeinRollen.Remove(koppeling);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record GebruikerCreate(string Naam, string Email, string Wachtwoord);
public record WachtwoordWijzig(string NieuwWachtwoord);
public record RolKoppeling(int DomeinId, string Rol);
