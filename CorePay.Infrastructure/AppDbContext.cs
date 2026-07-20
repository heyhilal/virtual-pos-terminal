using CorePay.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using CorePay.Application;

namespace CorePay.Infrastructure.Persistence
{
    public class AppDbContext : DbContext, IApplicationDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Transaction> Transactions { get; set; }

        IQueryable<Transaction> IApplicationDbContext.Transactions => this.Transactions;

        public void AddTransaction(Transaction transaction)
        {
            this.Transactions.Add(transaction);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // EF Core'a Status alanını veritabanına doğrudan (string) olarak kaydetmesini söylüyoruz
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Status)
                .HasConversion<string>();
        }
    }
}