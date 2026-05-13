namespace Valoris.Api.Data.Entities;

public class Domein
{
    public int Id { get; set; }
    public string Naam { get; set; } = string.Empty;
    public string Omschrijving { get; set; } = string.Empty;
    public PeriodeType Basisperiode { get; set; }
    public decimal Interventiedrempel { get; set; }
    public bool Actief { get; set; } = true;

    public ICollection<Zaaksoort> Zaaksoorten { get; set; } = new List<Zaaksoort>();
    public ICollection<DomeinIndicator> DomeinIndicatoren { get; set; } = new List<DomeinIndicator>();
    public ICollection<Verandering> Veranderingen { get; set; } = new List<Verandering>();
    public ICollection<GebruikerDomeinRol> GebruikerDomeinRollen { get; set; } = new List<GebruikerDomeinRol>();
}
