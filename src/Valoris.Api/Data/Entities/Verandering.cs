namespace Valoris.Api.Data.Entities;

public enum VeranderingType { Structureel, Procesmatig, Technisch, Overig }
public enum VeranderingStatus { Gepland, Actief, Afgerond, Geannuleerd }

public class Verandering
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public string Naam { get; set; } = string.Empty;
    public string Omschrijving { get; set; } = string.Empty;
    public VeranderingType Type { get; set; }
    public VeranderingStatus Status { get; set; }
    public int Prioriteit { get; set; }
    public decimal Kosten { get; set; }
    public DateTime Startdatum { get; set; }
    public DateTime Einddatum { get; set; }

    public Domein Domein { get; set; } = null!;
    public ICollection<Veranderimpact> Veranderimpacten { get; set; } = new List<Veranderimpact>();
}
