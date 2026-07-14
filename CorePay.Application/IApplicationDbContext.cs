using CorePay.Domain.Entities;

namespace CorePay.Application;

public interface IApplicationDbContext
{
    // IQueryable
    IQueryable<Transaction> Transactions { get; }
   
    void AddTransaction(Transaction transaction);
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}