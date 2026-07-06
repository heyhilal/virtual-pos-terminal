using MediatR;

namespace CorePay.Application.Features.Payments.Commands;

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, object>
{
    public async Task<object> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {

        return await Task.FromResult(new
        {
            Success = true,
            Message = "MediatR başarıyla tetiklendi! Ödeme kurumsal mimari üzerinden işlendi.",
            TransactionId = Guid.NewGuid().ToString()
        });
    }
}