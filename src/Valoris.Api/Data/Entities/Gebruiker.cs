namespace Valoris.Api.Data.Entities;

public class Gebruiker
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Naam { get; set; } = string.Empty;
    public string WachtwoordHash { get; set; } = string.Empty;
    public bool Actief { get; set; } = true;

    public ICollection<GebruikerDomeinRol> DomeinRollen { get; set; } = new List<GebruikerDomeinRol>();
}
