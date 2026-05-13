namespace Valoris.Api.Data.Entities;

public class GebruikerDomeinRol
{
    public int Id { get; set; }
    public int GebruikerId { get; set; }
    public int DomeinId { get; set; }
    public int RolId { get; set; }

    public Gebruiker Gebruiker { get; set; } = null!;
    public Domein Domein { get; set; } = null!;
    public Rol Rol { get; set; } = null!;
}
