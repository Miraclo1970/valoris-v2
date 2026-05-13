namespace Valoris.Api.Data.Entities;

public enum PeriodeType { Maand, Kwartaal, Jaar }

public class Periode
{
    public int Id { get; set; }
    public DateTime Startdatum { get; set; }
    public DateTime Einddatum { get; set; }
    public PeriodeType Type { get; set; }

    public ICollection<Meting> Metingen { get; set; } = new List<Meting>();
    public ICollection<Veranderimpact> Veranderimpacten { get; set; } = new List<Veranderimpact>();
}
