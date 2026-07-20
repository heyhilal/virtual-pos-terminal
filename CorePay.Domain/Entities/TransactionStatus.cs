namespace CorePay.Domain.Entities;
 
    public enum TransactionStatus
    {
       Pending=0,
       Success=1,
       Failed=2,
       Voided=3,
       Refunded=4
    }

