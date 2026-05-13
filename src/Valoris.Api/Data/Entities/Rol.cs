namespace Valoris.Api.Data.Entities;

public class Rol
{
    public int Id { get; set; }
    public string Naam { get; set; } = string.Empty; // beheerder | redacteur | lezer

    public ICollection<GebruikerDomeinRol> GebruikerDomeinRollen { get; set; } = new List<GebruikerDomeinRol>();
}
