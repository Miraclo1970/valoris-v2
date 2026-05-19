namespace Valoris.Api.Data.Entities;

public class Proces
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public string Naam { get; set; } = string.Empty;
    public string Omschrijving { get; set; } = string.Empty;
    public int Volgorde { get; set; }
    public bool Actief { get; set; } = true;

    public Domein Domein { get; set; } = null!;
    public ICollection<ZaaksoortScope> ZaaksoortScopes { get; set; } = new List<ZaaksoortScope>();
    public ICollection<Zaaksoort> HoofdZaaksoorten { get; set; } = new List<Zaaksoort>();
}
