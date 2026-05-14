using Valoris.Api.Data.Entities;

namespace Valoris.Api.Helpers;

public static class AggHelper
{
    public static string ToString(Aggregatiewijze a) => a switch
    {
        Aggregatiewijze.LaatstWaarde      => "laatste_waarde",
        Aggregatiewijze.GewogenGemiddelde => "gewogen_gemiddelde",
        _                                 => a.ToString().ToLower(),
    };

    public static bool TryParse(string? s, out Aggregatiewijze result)
    {
        // Normalise: verwijder underscores zodat "laatste_waarde" → "LaatstWaarde" matcht
        var normalized = (s ?? "").Replace("_", "");
        return Enum.TryParse(normalized, ignoreCase: true, out result);
    }
}
