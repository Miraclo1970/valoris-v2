using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Valoris.Api.Data;
using Valoris.Api.Services;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ValorisDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(ValorisDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

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

        // JWT token aanmaken
        var secret = _config["Jwt:Secret"] ?? "valoris-jwt-dev-secret-key-min32chars!!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, gebruiker.Id.ToString()),
            new(ClaimTypes.Name, gebruiker.Email),
        };

        // Voeg alle unieke rollen toe als claims (over alle domeinen heen)
        foreach (var rol in rollen.Select(r => r.rol).Distinct())
            claims.Add(new Claim(ClaimTypes.Role, rol));

        var token = new JwtSecurityToken(
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds,
            claims: claims
        );
        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            id = gebruiker.Id,
            naam = gebruiker.Naam,
            email = gebruiker.Email,
            rollen,
            token = tokenStr,
        });
    }

    [HttpPut("wachtwoord")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> WijzigEigenWachtwoord([FromBody] EigenWachtwoordWijzig body)
    {
        var gebruikerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var gebruiker = await _db.Gebruikers.FindAsync(gebruikerId);
        if (gebruiker is null) return NotFound();

        if (!PasswordHasher.Verify(body.HuidigWachtwoord, gebruiker.WachtwoordHash))
            return BadRequest(new { fout = "Huidig wachtwoord is onjuist." });

        if (body.NieuwWachtwoord.Length < 8)
            return BadRequest(new { fout = "Nieuw wachtwoord moet minimaal 8 tekens bevatten." });

        gebruiker.WachtwoordHash = PasswordHasher.Hash(body.NieuwWachtwoord);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record LoginRequest(string Email, string Wachtwoord);
public record EigenWachtwoordWijzig(string HuidigWachtwoord, string NieuwWachtwoord);
