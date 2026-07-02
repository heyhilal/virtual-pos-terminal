var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// POST /bank/pay endpoint'i
app.MapPost("/bank/pay", async (PaymentRequest request) =>
{
    
    if (request.Amount == 1000)
    {
        return Results.Problem(detail: "Bankada sistemsel bir hata oluştu.", statusCode: 500);
    }

    if (request.Amount > 1000)
    {
        await Task.Delay(5000); 
        return Results.Ok(new { Success = true, Message = "Gecikmeli Ödeme Başarılı", TransactionId = Guid.NewGuid() });
    }

    return Results.Ok(new { Success = true, Message = "Ödeme Başarılı", TransactionId = Guid.NewGuid() });
});

app.Run("http://localhost:5100");

//Kart No,Tutar,Cvv
record PaymentRequest(string CardNumber,decimal Amount,string Cvv);