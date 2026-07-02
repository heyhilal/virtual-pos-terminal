using CorePay.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CorePay.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Transaction> Transactions { get; set; }
    }
}