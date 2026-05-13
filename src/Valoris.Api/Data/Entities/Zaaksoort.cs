namespace Valoris.Api.Data.Entities;

public class Zaaksoort
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public string Naam { get; set; } = string.Empty;
    public string Omschrijving { get; set; } = string.Empty;
    public string? Icoon { get; set; }
    public string? Behandeling { get; set; }
    public int Volgorde { get; set; }
    public bool Actief { get; set; } = true;

    public Domein Domein { get; set; } = null!;
    public ICollection<Metingsdoel> Metingsdoelen { get; set; } = new List<Metingsdoel>();
}
