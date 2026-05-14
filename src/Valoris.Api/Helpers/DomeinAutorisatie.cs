using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;

namespace Valoris.Api.Helpers;

/// <summary>
/// Controleert of een gebruiker de vereiste rol heeft voor een specifiek domein
/// op basis van GebruikerDomeinRol — onafhankelijk van de globale JWT-rolclaim.
/// </summary>
public static class DomeinAutorisatie
{
    private static readonly Dictionary<string, int> Rang = new(StringComparer.OrdinalIgnoreCase)
    {
        ["lezer"]     = 1,
        ["redacteur"] = 2,
        ["beheerder"] = 3,
    };

    /// <summary>
    /// Retourneert true als de gebruiker minimaal <paramref name="minimaleRol"/> heeft
    /// voor het opgegeven domein.
    /// </summary>
    public static async Task<bool> HeeftRolAsync(
        ValorisDbContext db,
        int gebruikerId,
        int domeinId,
        string minimaleRol)
    {
        var rolNaam = await db.GebruikerDomeinRollen
            .Where(r => r.GebruikerId == gebruikerId && r.DomeinId == domeinId)
            .Select(r => r.Rol.Naam)
            .FirstOrDefaultAsync();

        if (rolNaam is null) return false;
        return Rang.GetValueOrDefault(rolNaam, 0) >= Rang.GetValueOrDefault(minimaleRol, 99);
    }
}
