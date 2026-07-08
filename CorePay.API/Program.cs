using Microsoft.EntityFrameworkCore;
using CorePay.Infrastructure.Persistence;
using CorePay.API.Middlewares;
using CorePay.Application.DTOs;
using CorePay.Application.Features.Payments.Commands;
using MediatR;
using System.ComponentModel.DataAnnotations;
using Polly;
using Polly.Extensions.Http;
using Polly.Timeout;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


// Db bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(ProcessPaymentCommand).Assembly));



// Retry Policy
var retryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
 .Or<TaskCanceledException>()
    .Or<TimeoutException>()
    .Or<TimeoutRejectedException>()
    .WaitAndRetryAsync(
        3,
        retryAttempt => TimeSpan.FromSeconds(2),
        onRetry: (outcome, timespan, retryCount, context) =>
        {
            Console.ForegroundColor = ConsoleColor.Yellow;

            Console.WriteLine(
                $"[Polly - Retry] Banka hata verdi. {retryCount}. deneme yapılıyor. Bekleme süresi: {timespan.TotalSeconds}sn"
            );

            Console.ResetColor();
        });

        // Retry Policy (Amount > 1000)
var slowRetryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .Or<TaskCanceledException>()
    .Or<TimeoutException>()
    .Or<TimeoutRejectedException>()
    .WaitAndRetryAsync(
        5,
        retryAttempt => TimeSpan.FromSeconds(2),
        onRetry: (outcome, timespan, retryCount, context) =>
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine(
                $"[Polly - Retry (Slow)] Banka hata verdi. {retryCount}. deneme yapılıyor. Bekleme süresi: {timespan.TotalSeconds}sn"
            );
            Console.ResetColor();
        });



// Circuit Breaker Policy
var circuitBreakerPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .Or<TaskCanceledException>()
    .Or<TimeoutException>()
    .Or<TimeoutRejectedException>()
    .CircuitBreakerAsync(
        handledEventsAllowedBeforeBreaking: 1,
        durationOfBreak: TimeSpan.FromSeconds(30),

        onBreak: (outcome, timespan) =>
        {
            Console.ForegroundColor = ConsoleColor.Red;

            Console.WriteLine(
                "[Polly - Circuit Breaker] SİGORTA ATTI! Banka tamamen çöktü. Devre 30 saniye boyunca AÇIK (Open). İstekler engellenecek."
            );

            Console.ResetColor();
        },

        onReset: () =>
        {
            Console.ForegroundColor = ConsoleColor.Green;

            Console.WriteLine(
                "[Polly - Circuit Breaker] SİGORTA DÜZELDİ! Devre tekrar KAPALI (Closed)."
            );

            Console.ResetColor();
        });

// Circuit Breaker (Amount > 1000)
var slowCircuitBreakerPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .Or<TaskCanceledException>()
    .Or<TimeoutException>()
    .Or<TimeoutRejectedException>()
    .CircuitBreakerAsync(
        handledEventsAllowedBeforeBreaking: 1,
        durationOfBreak: TimeSpan.FromSeconds(30),
        onBreak: (outcome, timespan) =>
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine(
                "[Polly - Circuit Breaker (Slow)] SİGORTA ATTI! Devre 30 saniye boyunca AÇIK (Open)."
            );
            Console.ResetColor();
        },
        onReset: () =>
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine(
                "[Polly - Circuit Breaker (Slow)] SİGORTA DÜZELDİ! Devre tekrar KAPALI (Closed)."
            );
            Console.ResetColor();
        });


// Timeout Policy
var timeoutPolicy = Policy
    .TimeoutAsync<HttpResponseMessage>(
        TimeSpan.FromSeconds(5),
        TimeoutStrategy.Optimistic
    );



// DummyBank Client
builder.Services.AddHttpClient("DummyBankClient", client =>
{
    client.BaseAddress = new Uri("http://localhost:5100/");
})


.AddPolicyHandler(circuitBreakerPolicy)
.AddPolicyHandler(retryPolicy)
.AddPolicyHandler(timeoutPolicy);


// DummyBank Client (Amount > 1000)
builder.Services.AddHttpClient("DummyBankSlowClient", client =>
{
    client.BaseAddress = new Uri("http://localhost:5100/");
})

.AddPolicyHandler(slowCircuitBreakerPolicy)
.AddPolicyHandler(slowRetryPolicy)
.AddPolicyHandler(timeoutPolicy);


var app = builder.Build();
app.UseCors();


// Global Exception Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();



app.MapPost("/api/payments", async (
    PaymentRequestDto dto,
    IMediator mediator) =>
{
    var validationContext = new ValidationContext(dto);

    var validationResults = new List<ValidationResult>();

    bool isValid = Validator.TryValidateObject(
        dto,
        validationContext,
        validationResults,
        true
    );


    if (!isValid)
    {
        var firstError = validationResults.First().ErrorMessage;

        return Results.BadRequest(new
        {
            message = firstError
        });
    }


    var command = new ProcessPaymentCommand(dto);

    var result = await mediator.Send(command);

    return Results.Ok(result);
});


app.Run();