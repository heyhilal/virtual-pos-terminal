using System.Net.Http.Json;
using MediatR;
using Polly.CircuitBreaker;
using CorePay.Domain.Entities;
using CorePay.Application;

namespace CorePay.Application.Features.Payments.Commands;

public static class GlobalBankState
{
    public static bool IsSystemBroken = false;
    public static DateTime? BreakEndTime = null;
}

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, object>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IApplicationDbContext _context;

    public ProcessPaymentCommandHandler(IHttpClientFactory httpClientFactory, IApplicationDbContext context)
    {
        _httpClientFactory = httpClientFactory;
        _context = context;
    }

    public async Task<object> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {
        if (GlobalBankState.IsSystemBroken)
        {
            if (GlobalBankState.BreakEndTime.HasValue && DateTime.Now >= GlobalBankState.BreakEndTime.Value)
            {
                GlobalBankState.IsSystemBroken = false;
                GlobalBankState.BreakEndTime = null;
            }
            else
            {
                throw new BrokenCircuitException("Banka genelinde kilitlenme var. 30 saniyelik ceza süresi henüz dolmadı!");
            }
        }

        var clientName = request.PaymentData.Amount > 1000 ? "DummyBankSlowClient" : "DummyBankClient";
        var httpClient = _httpClientFactory.CreateClient(clientName);

        var bankRequest = new
        {
            CardNumber = request.PaymentData.CardNumber.Replace(" ", ""),
            Amount = request.PaymentData.Amount,
            Cvv = request.PaymentData.Cvv
        };

        try
        {
            var response = await httpClient.PostAsJsonAsync(
                "bank/pay",
                bankRequest,
                cancellationToken
            );

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                
                var failedTransaction = new Transaction 
                {
                    Id = Guid.NewGuid(),
                    CardHolderName = request.PaymentData.CardholderName,
                    Amount = request.PaymentData.Amount,
                    Currency = "TRY",
                    Status = TransactionStatus.Failed,
                    CreatedData = DateTime.UtcNow
                };
                _context.AddTransaction(failedTransaction);
                await _context.SaveChangesAsync(cancellationToken);

                throw new Exception($"Banka servisi hata döndürdü. (HTTP {(int)response.StatusCode} - {response.StatusCode})");
            }

            var bankResponse = await response.Content.ReadFromJsonAsync<object>(cancellationToken);
           
            //POSTGRESQL KAYIT (SUCCESS) 
            var successTransaction = new Transaction 
            {
                Id = Guid.NewGuid(), // veritabanındaki gerçek ID
                CardHolderName = request.PaymentData.CardholderName,
                Amount = request.PaymentData.Amount,
                Currency = "TRY",
                Status = TransactionStatus.Success,
                CreatedData = DateTime.UtcNow
            };
            _context.AddTransaction(successTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            var updatedResponse = new
            {
                Success = true,
                TransactionId = successTransaction.Id.ToString(), 
                Message = "Ödeme Başarılı"
            };

            return updatedResponse;
        }
        catch (BrokenCircuitException)
        {
            var failedTransaction = new Transaction 
            {
                Id = Guid.NewGuid(),
                CardHolderName = request.PaymentData.CardholderName,
                Amount = request.PaymentData.Amount,
                Currency = "TRY",
                Status = TransactionStatus.Failed,
                CreatedData = DateTime.UtcNow
            };
            _context.AddTransaction(failedTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            throw new Exception("Banka servislerinde şu an kesinti yaşanıyor. Lütfen 30 saniye sonra tekrar deneyiniz.");
        }
        catch (Exception ex)
        {
            var failedTransaction = new Transaction 
            {
                Id = Guid.NewGuid(),
                CardHolderName = request.PaymentData.CardholderName,
                Amount = request.PaymentData.Amount,
                Currency = "TRY",
                Status = TransactionStatus.Failed,
                CreatedData = DateTime.UtcNow
            };
            _context.AddTransaction(failedTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            throw new Exception($"Ödeme işlemi gerçekleştirilemedi: {ex.Message}");
        }
    }
}