using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Services;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public AuthController(ValorisDbContext db) => _db = db;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest body)
    {
        var gebruiker = await _db.Gebruikers
            .Where(g => g.Email == body.Email && g.Actief)
            .Include(g => g.DomeinRollen).ThenInclude(r => r.Rol)
            .FirstOrDefaultAsync();

        if (gebruiker is null || !PasswordHasher.Verify(body.Wachtwoord, gebruiker.WachtwoordHash))
            return Unauthorized(new { fout = "Onbekend e-mailadres of wachtwoord." });

        var rollen = gebruiker.DomeinRollen.Select(r => new
        {
            domeinId = r.DomeinId,
            rol = r.Rol.Naam,
        }).ToList();

        return Ok(new
        {
            id = gebruiker.Id,
            naam = gebruiker.Naam,
            email = gebruiker.Email,
            rollen,
        });
    }
}

public record LoginRequest(string Email, string Wachtwoord);
