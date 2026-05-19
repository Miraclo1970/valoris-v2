using Microsoft.EntityFrameworkCore;
using Valoris.Api.Data.Entities;

namespace Valoris.Api.Data;

public class ValorisDbContext : DbContext
{
    public ValorisDbContext(DbContextOptions<ValorisDbContext> options) : base(options) { }

    public DbSet<Gebruiker> Gebruikers => Set<Gebruiker>();
    public DbSet<Rol> Rollen => Set<Rol>();
    public DbSet<GebruikerDomeinRol> GebruikerDomeinRollen => Set<GebruikerDomeinRol>();
    public DbSet<Periode> Periodes => Set<Periode>();
    public DbSet<Domein> Domeinen => Set<Domein>();
    public DbSet<Zaaksoort> Zaaksoorten => Set<Zaaksoort>();
    public DbSet<Indicator> Indicatoren => Set<Indicator>();
    public DbSet<DomeinIndicator> DomeinIndicatoren => Set<DomeinIndicator>();
    public DbSet<Metingsdoel> Metingsdoelen => Set<Metingsdoel>();
    public DbSet<Meting> Metingen => Set<Meting>();
    public DbSet<Verandering> Veranderingen => Set<Verandering>();
    public DbSet<Veranderimpact> Veranderimpacten => Set<Veranderimpact>();
    public DbSet<Product> Producten => Set<Product>();
    public DbSet<Proces> Processen => Set<Proces>();
    public DbSet<ZaaksoortScope> ZaaksoortScopes => Set<ZaaksoortScope>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Zaaksoort: unique index on (DomeinId, Volgorde)
        modelBuilder.Entity<Zaaksoort>()
            .HasIndex(z => new { z.DomeinId, z.Volgorde })
            .IsUnique();

        modelBuilder.Entity<Zaaksoort>()
            .HasOne(z => z.Domein)
            .WithMany(d => d.Zaaksoorten)
            .HasForeignKey(z => z.DomeinId);

        // GebruikerDomeinRol FK's
        modelBuilder.Entity<GebruikerDomeinRol>()
            .HasOne(g => g.Gebruiker)
            .WithMany(u => u.DomeinRollen)
            .HasForeignKey(g => g.GebruikerId);

        modelBuilder.Entity<GebruikerDomeinRol>()
            .HasOne(g => g.Domein)
            .WithMany(d => d.GebruikerDomeinRollen)
            .HasForeignKey(g => g.DomeinId);

        modelBuilder.Entity<GebruikerDomeinRol>()
            .HasOne(g => g.Rol)
            .WithMany(r => r.GebruikerDomeinRollen)
            .HasForeignKey(g => g.RolId);

        // DomeinIndicator FK's
        modelBuilder.Entity<DomeinIndicator>()
            .HasOne(di => di.Domein)
            .WithMany(d => d.DomeinIndicatoren)
            .HasForeignKey(di => di.DomeinId);

        modelBuilder.Entity<DomeinIndicator>()
            .HasOne(di => di.Indicator)
            .WithMany(i => i.DomeinIndicatoren)
            .HasForeignKey(di => di.IndicatorId);

        // Metingsdoel FK's — Zaaksoort is restricted to avoid multiple cascade paths from Domein
        modelBuilder.Entity<Metingsdoel>()
            .HasOne(m => m.DomeinIndicator)
            .WithMany(di => di.Metingsdoelen)
            .HasForeignKey(m => m.DomeinIndicatorId);

        modelBuilder.Entity<Metingsdoel>()
            .HasOne(m => m.Zaaksoort)
            .WithMany(z => z.Metingsdoelen)
            .HasForeignKey(m => m.ZaaksoortId)
            .OnDelete(DeleteBehavior.Restrict);

        // Meting FK's — Periode is restricted to avoid multiple cascade paths via Metingsdoel
        modelBuilder.Entity<Meting>()
            .HasOne(m => m.Metingsdoel)
            .WithMany(md => md.Metingen)
            .HasForeignKey(m => m.MetingsdoelId);

        modelBuilder.Entity<Meting>()
            .HasOne(m => m.Periode)
            .WithMany(p => p.Metingen)
            .HasForeignKey(m => m.PeriodeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Verandering FK
        modelBuilder.Entity<Verandering>()
            .HasOne(v => v.Domein)
            .WithMany(d => d.Veranderingen)
            .HasForeignKey(v => v.DomeinId);

        // Veranderimpact FK's
        modelBuilder.Entity<Veranderimpact>()
            .HasOne(vi => vi.Verandering)
            .WithMany(v => v.Veranderimpacten)
            .HasForeignKey(vi => vi.VeranderingId);

        // Restrict to avoid multiple cascade paths (Veranderimpact reachable via Verandering and via Metingsdoel)
        modelBuilder.Entity<Veranderimpact>()
            .HasOne(vi => vi.Metingsdoel)
            .WithMany(md => md.Veranderimpacten)
            .HasForeignKey(vi => vi.MetingsdoelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Veranderimpact>()
            .HasOne(vi => vi.Periode)
            .WithMany(p => p.Veranderimpacten)
            .HasForeignKey(vi => vi.PeriodeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product FK
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Domein)
            .WithMany(d => d.Producten)
            .HasForeignKey(p => p.DomeinId);

        // Proces FK
        modelBuilder.Entity<Proces>()
            .HasOne(p => p.Domein)
            .WithMany(d => d.Processen)
            .HasForeignKey(p => p.DomeinId);

        // Zaaksoort.Hoofdproces FK — NoAction to avoid multiple cascade paths (SQL Server restriction)
        modelBuilder.Entity<Zaaksoort>()
            .HasOne(z => z.Hoofdproces)
            .WithMany(p => p.HoofdZaaksoorten)
            .HasForeignKey(z => z.HoofdprocesId)
            .OnDelete(DeleteBehavior.NoAction);

        // ZaaksoortScope FK's
        modelBuilder.Entity<ZaaksoortScope>()
            .HasOne(s => s.Domein)
            .WithMany(d => d.ZaaksoortScopes)
            .HasForeignKey(s => s.DomeinId);

        modelBuilder.Entity<ZaaksoortScope>()
            .HasOne(s => s.Zaaksoort)
            .WithMany(z => z.Scopes)
            .HasForeignKey(s => s.ZaaksoortId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ZaaksoortScope>()
            .HasOne(s => s.Product)
            .WithMany(p => p.ZaaksoortScopes)
            .HasForeignKey(s => s.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ZaaksoortScope>()
            .HasOne(s => s.Proces)
            .WithMany(p => p.ZaaksoortScopes)
            .HasForeignKey(s => s.ProcesId)
            .OnDelete(DeleteBehavior.Restrict);

        // ZaaksoortScope unique: per domein mag product×proces slechts aan één zaaksoort gekoppeld zijn
        modelBuilder.Entity<ZaaksoortScope>()
            .HasIndex(s => new { s.DomeinId, s.ProductId, s.ProcesId })
            .IsUnique();

        // Decimal precision (18, 4) for all decimal columns
        modelBuilder.Entity<Domein>()
            .Property(d => d.Interventiedrempel).HasPrecision(18, 4);

        modelBuilder.Entity<Metingsdoel>()
            .Property(m => m.NormWaarde).HasPrecision(18, 4);
        modelBuilder.Entity<Metingsdoel>()
            .Property(m => m.Gewicht).HasPrecision(18, 4);

        modelBuilder.Entity<Meting>()
            .Property(m => m.Waarde).HasPrecision(18, 4);

        modelBuilder.Entity<Verandering>()
            .Property(v => v.Kosten).HasPrecision(18, 4);

        modelBuilder.Entity<Veranderimpact>()
            .Property(vi => vi.Waarde).HasPrecision(18, 4);

        modelBuilder.Entity<ZaaksoortScope>()
            .Property(s => s.Frequentie).HasPrecision(18, 4);
    }
}
