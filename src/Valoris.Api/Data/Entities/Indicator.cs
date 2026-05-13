namespace Valoris.Api.Data.Entities;

public enum IndicatorType { Prestatie, Inrichting }
public enum Aggregatiewijze { Som, Gemiddelde, LaatstWaarde, GewogenGemiddelde }

public class Indicator
{
    public int Id { get; set; }
    public string Naam { get; set; } = string.Empty;
    public IndicatorType Type { get; set; }
    public string Eenheid { get; set; } = string.Empty;
    public Aggregatiewijze Aggregatiewijze { get; set; }
    public bool Actief { get; set; } = true;

    public ICollection<DomeinIndicator> DomeinIndicatoren { get; set; } = new List<DomeinIndicator>();
}
