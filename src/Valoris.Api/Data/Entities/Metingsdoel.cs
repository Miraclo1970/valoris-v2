namespace Valoris.Api.Data.Entities;

public enum NormRichting { LagerIsBeter, HogerIsBeter }

public class Metingsdoel
{
    public int Id { get; set; }
    public int DomeinIndicatorId { get; set; }
    public int ZaaksoortId { get; set; }
    public decimal NormWaarde { get; set; }
    public NormRichting NormRichting { get; set; }
    public decimal Gewicht { get; set; }
    public bool Actief { get; set; } = true;

    public DomeinIndicator DomeinIndicator { get; set; } = null!;
    public Zaaksoort Zaaksoort { get; set; } = null!;
    public ICollection<Meting> Metingen { get; set; } = new List<Meting>();
    public ICollection<Veranderimpact> Veranderimpacten { get; set; } = new List<Veranderimpact>();
}
