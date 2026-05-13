namespace Valoris.Api.Models;

public record StrategieDto(
    int DomeinId,
    int? PeriodeId,
    double Interventiedrempel,
    IReadOnlyList<ZaaksoortStrategieDto> Zaaksoorten);

public record ZaaksoortStrategieDto(
    int ZaaksoortId,
    string ZaaksoortNaam,
    string? Icoon,
    string? Behandeling,
    int Volgorde,
    double IstScore,            // gewogen gemiddelde alle indicatoren, 0-100
    double SollScore,           // altijd 100
    double PrestatieScore,      // gewogen gem. prestatie-indicatoren (Y-as)
    double InrichtingScore,     // gewogen gem. inrichting-indicatoren (X-as)
    double VectorPrestatieScore,   // verwachte prestatieScore na veranderingen
    double VectorInrichtingScore,  // verwachte inrichtingScore na veranderingen
    bool HeeftMetingen,
    string? GekoppeldeVerandering,  // eerste gekoppelde verandering naam
    IReadOnlyList<MetingsdoelScoreDto> Metingsdoelen);

public record MetingsdoelScoreDto(
    int MetingsdoelId,
    string IndicatorNaam,
    string IndicatorType,       // "prestatie" | "inrichting"
    decimal? IstWaarde,
    decimal NormWaarde,
    string NormRichting,
    decimal Gewicht,
    double Score);
