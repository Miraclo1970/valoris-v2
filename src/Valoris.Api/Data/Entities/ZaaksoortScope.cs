namespace Valoris.Api.Data.Entities;

public enum ScopeType { Verplicht, Optioneel }
public enum FrequentiePeriode { Maand, Kwartaal, Tertiaal, Jaar }

public class ZaaksoortScope
{
    public int Id { get; set; }
    public int DomeinId { get; set; }
    public int ZaaksoortId { get; set; }
    public int ProductId { get; set; }
    public int ProcesId { get; set; }
    public ScopeType Type { get; set; } = ScopeType.Verplicht;
    public FrequentiePeriode? FrequentiePeriode { get; set; }
    public decimal? Frequentie { get; set; }

    public Domein Domein { get; set; } = null!;
    public Zaaksoort Zaaksoort { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public Proces Proces { get; set; } = null!;
}
