using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data;
using Valoris.Api.Data.Entities;
using Valoris.Api.Models;

namespace Valoris.Api.Controllers;

[ApiController]
[Route("api/domeinen/{domeinId}/strategie")]
public class StrategieController : ControllerBase
{
    private readonly ValorisDbContext _db;

    public StrategieController(ValorisDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(int domeinId, [FromQuery] int? periodeId)
    {
        var domein = await _db.Domeinen.FindAsync(domeinId);
        if (domein is null) return NotFound();

        Periode? periode;
        if (periodeId.HasValue)
        {
            periode = await _db.Periodes.FindAsync(periodeId.Value);
            if (periode is null) return NotFound();
        }
        else
        {
            periode = await HuidigePeriode(domein);
        }

        var zaaksoorten = await _db.Zaaksoorten
            .Where(z => z.DomeinId == domeinId && z.Actief)
            .OrderBy(z => z.Volgorde)
            .ToListAsync();

        var metingsdoelen = await _db.Metingsdoelen
            .Where(m => m.DomeinIndicator.DomeinId == domeinId && m.Actief)
            .Include(m => m.DomeinIndicator).ThenInclude(di => di.Indicator)
            .ToListAsync();

        var metingen = periode is not null
            ? await _db.Metingen
                .Where(m => m.PeriodeId == periode.Id &&
                            m.Metingsdoel.DomeinIndicator.DomeinId == domeinId)
                .ToListAsync()
            : new List<Meting>();

        // Veranderimpacten voor huidige periode
        var impacts = periode is not null
            ? await _db.Veranderimpacten
                .Where(vi => vi.PeriodeId == periode.Id &&
                             vi.Metingsdoel.DomeinIndicator.DomeinId == domeinId)
                .Include(vi => vi.Verandering)
                .ToListAsync()
            : new List<Veranderimpact>();

        var zaaksoortScores = zaaksoorten.Select(z =>
        {
            var doelen = metingsdoelen.Where(m => m.ZaaksoortId == z.Id).ToList();

            var scores = doelen.Select(m =>
            {
                var ist = BerekenIst(m, metingen);
                var score = ist.HasValue ? Normaliseer(ist.Value, m.NormWaarde, m.NormRichting) : 0.0;
                return new MetingsdoelScoreDto(
                    m.Id,
                    m.DomeinIndicator.Indicator.Naam,
                    m.DomeinIndicator.Indicator.Type.ToString().ToLower(),
                    ist, m.NormWaarde,
                    m.NormRichting.ToString().ToLower(),
                    m.Gewicht, score);
            }).ToList();

            double ComputeComposite(IEnumerable<MetingsdoelScoreDto> subset)
            {
                var list = subset.ToList();
                var totalGewicht = list.Sum(s => (double)s.Gewicht);
                return totalGewicht > 0
                    ? list.Sum(s => s.Score * (double)s.Gewicht) / totalGewicht
                    : 0.0;
            }

            var prestatieScores  = scores.Where(s => s.IndicatorType == "prestatie").ToList();
            var inrichtingScores = scores.Where(s => s.IndicatorType == "inrichting").ToList();

            double prestatieScore  = Math.Round(ComputeComposite(prestatieScores), 1);
            double inrichtingScore = Math.Round(ComputeComposite(inrichtingScores), 1);
            double istScore        = Math.Round(ComputeComposite(scores), 1);

            // Vector: herbereken scores met impacts opgeteld
            double vectorPrestatie  = prestatieScore;
            double vectorInrichting = inrichtingScore;
            if (impacts.Any(vi => doelen.Any(d => d.Id == vi.MetingsdoelId)))
            {
                var vectorScores = doelen.Select(m =>
                {
                    var ist = BerekenIst(m, metingen);
                    var impact = impacts.Where(vi => vi.MetingsdoelId == m.Id)
                                       .Sum(vi => vi.Waarde);
                    var istMet = ist.HasValue ? ist.Value + impact : (decimal?)null;
                    var score = istMet.HasValue ? Normaliseer(istMet.Value, m.NormWaarde, m.NormRichting) : 0.0;
                    return (Type: m.DomeinIndicator.Indicator.Type, Gewicht: m.Gewicht, Score: score);
                }).ToList();

                double ComputeRaw(IndicatorType type)
                {
                    var sub = vectorScores.Where(s => s.Type == type).ToList();
                    var tw = sub.Sum(s => (double)s.Gewicht);
                    return tw > 0 ? sub.Sum(s => s.Score * (double)s.Gewicht) / tw : 0.0;
                }

                vectorPrestatie  = Math.Round(ComputeRaw(IndicatorType.Prestatie), 1);
                vectorInrichting = Math.Round(ComputeRaw(IndicatorType.Inrichting), 1);
            }

            bool heeftMetingen = scores.Any(s => s.IstWaarde.HasValue);

            // Eerste gekoppelde verandering naam
            var doelIds = doelen.Select(d => d.Id).ToHashSet();
            var verandering = impacts
                .Where(vi => doelIds.Contains(vi.MetingsdoelId))
                .Select(vi => vi.Verandering.Naam)
                .FirstOrDefault();

            return new ZaaksoortStrategieDto(
                z.Id, z.Naam, z.Icoon, z.Behandeling, z.Volgorde,
                istScore, 100.0,
                prestatieScore, inrichtingScore,
                vectorPrestatie, vectorInrichting,
                heeftMetingen, verandering,
                scores);
        }).ToList();

        return Ok(new StrategieDto(domeinId, periode?.Id, (double)domein.Interventiedrempel, zaaksoortScores));
    }

    private async Task<Periode?> HuidigePeriode(Domein domein)
    {
        return await _db.Periodes
            .Where(p => p.Startdatum <= DateTime.Today
                     && p.Einddatum >= DateTime.Today
                     && p.Type == domein.Basisperiode)
            .OrderByDescending(p => p.Startdatum)
            .FirstOrDefaultAsync()
          ?? await _db.Periodes
            .OrderByDescending(p => p.Einddatum)
            .FirstOrDefaultAsync();
    }

    private static decimal? BerekenIst(Metingsdoel doel, List<Meting> metingen)
    {
        var relevant = metingen.Where(m => m.MetingsdoelId == doel.Id).ToList();
        if (!relevant.Any()) return null;
        return doel.DomeinIndicator.Indicator.Aggregatiewijze switch
        {
            Aggregatiewijze.Som          => relevant.Sum(m => m.Waarde),
            Aggregatiewijze.LaatstWaarde => relevant.OrderByDescending(m => m.Datum).First().Waarde,
            _                            => relevant.Average(m => m.Waarde)
        };
    }

    private static double Normaliseer(decimal ist, decimal soll, NormRichting richting)
    {
        if (ist == 0) return 0;
        double score = richting == NormRichting.LagerIsBeter
            ? (double)soll / (double)ist * 100.0
            : (double)ist / (double)soll * 100.0;
        return Math.Clamp(score, 0, 100);
    }
}
