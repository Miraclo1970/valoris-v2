namespace Valoris.Api.Data.Entities;

public class Product
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public string Naam { get; set; } = string.Empty;
    public string Omschrijving { get; set; } = string.Empty;
    public bool Actief { get; set; } = true;

    public Domein Domein { get; set; } = null!;
    public ICollection<ZaaksoortScope> ZaaksoortScopes { get; set; } = new List<ZaaksoortScope>();
}
