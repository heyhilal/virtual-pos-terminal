using System;

namespace CorePay.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CardHolderName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "TRY";
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public DateTime CreatedData { get; set; } = DateTime.UtcNow;
}