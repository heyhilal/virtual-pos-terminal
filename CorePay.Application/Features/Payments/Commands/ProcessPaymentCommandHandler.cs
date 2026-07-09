using System.Net.Http.Json;
using MediatR;
using Polly.CircuitBreaker;

namespace CorePay.Application.Features.Payments.Commands;

// MERKEZİ ŞALTER SINIFI
public static class GlobalBankState
{
    public static bool IsSystemBroken = false;
    public static DateTime? BreakEndTime = null;
}

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, object>
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ProcessPaymentCommandHandler(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

public async Task<object> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
{
    // zaman kontrolü
    if (GlobalBankState.IsSystemBroken)
    {
        if (GlobalBankState.BreakEndTime.HasValue && DateTime.Now >= GlobalBankState.BreakEndTime.Value)
        {
            //süre dolduysa izin ver
            GlobalBankState.IsSystemBroken = false;
            GlobalBankState.BreakEndTime = null;
        }
        else
        {
            //süre dolmadıysa engelle
            throw new BrokenCircuitException("Banka genelinde kilitlenme var. 30 saniyelik ceza süresi henüz dolmadı!");
        }
    }

    // Tutara göre client 
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
                throw new Exception($"Banka servisi hata döndürdü. (HTTP {(int)response.StatusCode} - {response.StatusCode})");
            }

            var bankResponse = await response.Content.ReadFromJsonAsync<object>(cancellationToken);
            return bankResponse!;
        }
        catch (BrokenCircuitException)
        {
            throw new Exception("Banka servislerinde şu an kesinti yaşanıyor.Lütfen 30 saniye sonra tekrar deneyiniz.");
        }
        catch (Exception ex)
        {
            throw new Exception($"Ödeme işlemi gerçekleştirilemedi: {ex.Message}");
        }
    }
}