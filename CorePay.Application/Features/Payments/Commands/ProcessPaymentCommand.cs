using MediatR;
using CorePay.Application.DTOs;

namespace CorePay.Application.Features.Payments.Commands;


public class ProcessPaymentCommand : IRequest<object>
{
    public PaymentRequestDto PaymentData { get; set; }

    public ProcessPaymentCommand(PaymentRequestDto paymentData)
    {
        PaymentData = paymentData;
    }
}