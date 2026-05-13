namespace Valoris.Api.Models;

public record MetingDto(
    int Id,
    int MetingsdoelId,
    int PeriodeId,
    decimal Waarde,
    DateTime Datum,
    string Bron,
    bool Gevalideerd);

public record MetingCreateDto(
    int MetingsdoelId,
    int PeriodeId,
    decimal Waarde,
    DateTime Datum,
    string Bron);

public record MetingUpdateDto(
    decimal Waarde,
    DateTime Datum,
    string Bron,
    bool Gevalideerd);
