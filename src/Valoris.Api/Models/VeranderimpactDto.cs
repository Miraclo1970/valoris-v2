namespace Valoris.Api.Models;

public record VeranderimpactDto(
    int Id,
    int VeranderingId,
    int MetingsdoelId,
    int PeriodeId,
    decimal Waarde,
    string Type);

public record VeranderimpactCreateDto(
    int VeranderingId,
    int MetingsdoelId,
    int PeriodeId,
    decimal Waarde,
    string Type);

public record VeranderimpactUpdateDto(
    decimal Waarde,
    string Type);
