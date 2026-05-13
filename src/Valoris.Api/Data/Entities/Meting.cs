namespace Valoris.Api.Data.Entities;

public class Meting
{
    public int Id { get; set; }
    public int MetingsdoelId { get; set; }
    public int PeriodeId { get; set; }
    public decimal Waarde { get; set; }
    public DateTime Datum { get; set; }
    public string Bron { get; set; } = string.Empty;
    public bool Gevalideerd { get; set; }

    public Metingsdoel Metingsdoel { get; set; } = null!;
    public Periode Periode { get; set; } = null!;
}
