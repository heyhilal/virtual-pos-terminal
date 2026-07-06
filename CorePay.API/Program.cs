using Microsoft.EntityFrameworkCore;
using CorePay.Infrastructure.Persistence;
using CorePay.API.Middlewares;
using CorePay.Application.DTOs;
using CorePay.Application.Features.Payments.Commands; 
using MediatR; 
using System.ComponentModel.DataAnnotations; 

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

// MediatR eklendi
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ProcessPaymentCommand).Assembly));

var app = builder.Build();
app.UseCors(); 
// GLOBAL EXCEPTION MIDDLEWARE 
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

app.MapPost("/api/payments", async (PaymentRequestDto requestDto, IMediator mediator) =>
{
    //Validasyon Kontrolü
    var validationContext = new ValidationContext(requestDto);
    var validationResults = new List<ValidationResult>();

    if (!Validator.TryValidateObject(requestDto, validationContext, validationResults, validateAllProperties: true))
    {
        var firstError = validationResults.First().ErrorMessage;
        return Results.BadRequest(new { Message = firstError });
    }

    // MediatR Kontrolü (İsteği paketleyip Handler'a fırlatıyoruz)
    var command = new ProcessPaymentCommand(requestDto);
    var result = await mediator.Send(command);

    return Results.Ok(result);
});


app.Run();