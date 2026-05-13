namespace Valoris.Api.Data.Entities;

public enum ImpactType { Verwacht, Gerealiseerd }

public class Veranderimpact
{
    public int Id { get; set; }
    public int VeranderingId { get; set; }
    public int MetingsdoelId { get; set; }
    public int PeriodeId { get; set; }
    public decimal Waarde { get; set; }
    public ImpactType Type { get; set; }

    public Verandering Verandering { get; set; } = null!;
    public Metingsdoel Metingsdoel { get; set; } = null!;
    public Periode Periode { get; set; } = null!;
}
