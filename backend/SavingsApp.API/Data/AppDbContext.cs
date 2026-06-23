using Microsoft.EntityFrameworkCore;
using SavingsApp.API.Models;

namespace SavingsApp.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<SavingsGoal> Goals => Set<SavingsGoal>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.Property(u => u.PasswordHash).IsRequired();

            e.HasMany(u => u.Goals)
                .WithOne(g => g.User!)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(u => u.Transactions)
                .WithOne(t => t.User!)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<SavingsGoal>(e =>
        {
            e.HasKey(g => g.Id);
            e.Property(g => g.Name).IsRequired().HasMaxLength(200);
            // Money: decimal(18,2). Never float/double.
            e.Property(g => g.TargetAmount).HasColumnType("numeric(18,2)");
            e.Property(g => g.DebitAmount).HasColumnType("numeric(18,2)");
            e.Property(g => g.Status).HasConversion<int>();

            e.HasMany(g => g.Transactions)
                .WithOne(t => t.Goal!)
                .HasForeignKey(t => t.GoalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Transaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Amount).HasColumnType("numeric(18,2)");
            e.Property(t => t.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("EUR");
            e.Property(t => t.Status).HasConversion<int>();
            e.HasIndex(t => t.GoalId);
        });
    }

    /// <summary>
    /// Idempotently seeds a test user with a confirmed mandate and one active savings goal.
    /// Called at startup in Development. The Hangfire job for the seeded goal is scheduled
    /// separately by the scheduler so this method has no infrastructure dependencies.
    /// </summary>
    public async Task SeedAsync()
    {
        const string testEmail = "test@savingsapp.dev";
        if (await Users.AnyAsync(u => u.Email == testEmail))
            return;

        var user = new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Email = testEmail,
            // password: "Password123!"
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            SwanAccountId = "seed-swan-account-0001",
            GoCardlessMandateId = "MD0SEEDMANDATE001",
            CreatedAt = DateTime.UtcNow
        };

        var goal = new SavingsGoal
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            UserId = user.Id,
            Name = "Trip to France",
            TargetAmount = 600.00m,
            DebitAmount = 5.00m,
            DebitDay = 11,
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddYears(1),
            Status = GoalStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Users.Add(user);
        Goals.Add(goal);
        await SaveChangesAsync();
    }
}
