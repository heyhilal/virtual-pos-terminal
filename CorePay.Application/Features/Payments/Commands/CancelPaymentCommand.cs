using MediatR;

namespace CorePay.Application.Features.Payments.Commands
{
    // MediatR Command yapısı
    public record CancelPaymentCommand(string TransactionId) : IRequest<CancelPaymentResult>;

    // Komut sonucunda döneceğimiz veri yapısı (DTO)
    public record CancelPaymentResult(bool Success, string Message);
}