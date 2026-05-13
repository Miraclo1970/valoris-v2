namespace Valoris.Api.Models;

public record VeranderingDto(
    int Id,
    int DomeinId,
    string Naam,
    string Omschrijving,
    string Type,
    string Status,
    int Prioriteit,
    decimal Kosten,
    DateTime Startdatum,
    DateTime Einddatum);

public record VeranderingCreateDto(
    int DomeinId,
    string Naam,
    string Omschrijving,
    string Type,
    string Status,
    int Prioriteit,
    decimal Kosten,
    DateTime Startdatum,
    DateTime Einddatum);

public record VeranderingUpdateDto(
    string Naam,
    string Omschrijving,
    string Type,
    string Status,
    int Prioriteit,
    decimal Kosten,
    DateTime Startdatum,
    DateTime Einddatum);
