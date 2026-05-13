namespace Valoris.Api.Models;

public record MetingsdoelDto(
    int Id,
    int DomeinIndicatorId,
    int ZaaksoortId,
    string ZaaksoortNaam,
    string IndicatorNaam,
    decimal NormWaarde,
    string NormRichting,
    decimal Gewicht,
    bool Actief);

public record MetingsdoelCreateDto(
    int DomeinIndicatorId,
    int ZaaksoortId,
    decimal NormWaarde,
    string NormRichting,
    decimal Gewicht);

public record MetingsdoelUpdateDto(
    decimal NormWaarde,
    string NormRichting,
    decimal Gewicht,
    bool Actief);
