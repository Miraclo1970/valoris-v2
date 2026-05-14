using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Valoris.Api.Controllers;

/// <summary>
/// Basisklasse voor controllers — biedt toegang tot de ingelogde gebruiker-ID.
/// </summary>
public abstract class ValorisController : ControllerBase
{
    protected int GebruikerId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
