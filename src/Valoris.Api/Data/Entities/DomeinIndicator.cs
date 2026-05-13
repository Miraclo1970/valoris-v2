namespace Valoris.Api.Data.Entities;

public class DomeinIndicator
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public int IndicatorId { get; set; }
    public bool Actief { get; set; } = true;

    public Domein Domein { get; set; } = null!;
    public Indicator Indicator { get; set; } = null!;
    public ICollection<Metingsdoel> Metingsdoelen { get; set; } = new List<Metingsdoel>();
}
