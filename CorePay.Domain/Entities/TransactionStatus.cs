namespace CorePay.Domain.Entities;
 
    public enum TransactionStatus
    {
       Pending,
       Authorized,
       Failed,
       Voided,
       Refunded
    }

