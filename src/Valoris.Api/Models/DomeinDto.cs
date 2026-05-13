namespace Valoris.Api.Models;

public record DomeinDto(
    int Id,
    string Naam,
    string Omschrijving,
    string Basisperiode,
    decimal Interventiedrempel,
    bool Actief);

public record ZaaksoortDto(
    int Id,
    int DomeinId,
    string Naam,
    string Omschrijving,
    string? Icoon,
    string? Behandeling,
    int Volgorde,
    bool Actief);

public record IndicatorDto(
    int Id,
    string Naam,
    string Type,
    string Eenheid,
    string Aggregatiewijze,
    bool Actief);

public record DomeinIndicatorDto(
    int Id,
    int DomeinId,
    int IndicatorId,
    string IndicatorNaam,
    string Type,
    string Eenheid,
    string Aggregatiewijze,
    bool Actief);

// --- Create/Update request bodies ---
public record DomeinCreate(string Naam, string Omschrijving, string Basisperiode, decimal Interventiedrempel);
public record ZaaksoortCreate(string Naam, string Omschrijving, string? Icoon, string? Behandeling);
public record IndicatorCreate(string Naam, string Type, string Eenheid, string Aggregatiewijze);
public record DomeinIndicatorCreate(int IndicatorId);
public record PeriodeCreate(DateTime Startdatum, DateTime Einddatum, string Type);
