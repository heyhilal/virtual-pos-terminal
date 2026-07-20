using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CorePay.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // Hata fırlatılırsa anında buraya düşsün
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/problem+json";
            
            // HTTP Durum Kodu 500 olsun
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            // RFC 7807 standardındaki JSON nesnesi
            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Bir Sistem Hatası Oluştu",
                Detail = exception.Message, // gerçek hata mesajı 
                Instance = context.Request.Path,
                Type = "https://tools.ietf.org/html/rfc7807"
            };

            // Frontend'e otomatik olarak JSON formatında gönderilsin
            await context.Response.WriteAsJsonAsync(problemDetails);
        }
    }
}