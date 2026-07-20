using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using CorePay.Application;
using CorePay.Domain.Entities;

namespace CorePay.Application.Features.Payments.Commands
{
    public class CancelPaymentCommandHandler : IRequestHandler<CancelPaymentCommand, CancelPaymentResult>
    {
        private readonly IApplicationDbContext _context;

        public CancelPaymentCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CancelPaymentResult> Handle(CancelPaymentCommand request, CancellationToken cancellationToken)
        {
            // Guid.Parse kullanarak string'i Guid tipine dönüştürüp kaydı çekiyoruz
            var transaction = await _context.Transactions.FirstOrDefaultAsync(p => p.Id == Guid.Parse(request.TransactionId), cancellationToken);

            if (transaction == null)
            {
                return new CancelPaymentResult(false, "İşlem bulunamadı.");
            }

            //  MÜKERRER İPTAL KONTROLÜ
            if (transaction.Status == TransactionStatus.Failed) 
            {
                return new CancelPaymentResult(false, "Bu ödeme işlemi daha önce zaten iptal edilmiş.");
            }

            // TARİH KONTROLÜ
          var today = DateTime.UtcNow.Date;
             var transactionDate = transaction.CreatedData.Date;

              if (transactionDate != today)
              {
            return new CancelPaymentResult(false, "Yalnızca aynı gün içinde yapılan işlemler iptal edilebilir.");
              } 


            //  Durumu "Failed" yapıp kaydediyoruz
            transaction.Status = TransactionStatus.Failed;
            await _context.SaveChangesAsync(cancellationToken);

            // Test gecikmesi
            Console.WriteLine("[Handler] Durum 'Failed' (İptal) olarak kaydedildi. 4 saniyelik yapay gecikme başladı...");
            await Task.Delay(4000, cancellationToken); 

            return new CancelPaymentResult(true, "Ödeme başarıyla iptal edildi.");
        }
    }
}