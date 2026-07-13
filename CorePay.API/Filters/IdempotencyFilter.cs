using Microsoft.AspNetCore.Http;
using StackExchange.Redis;

namespace CorePay.API.Filters;

public class IdempotencyFilter : IEndpointFilter 
{
   private readonly IDatabase _redisDb;

   public IdempotencyFilter(IConnectionMultiplexer redisConnection)
   {
       _redisDb = redisConnection.GetDatabase();
   }

   public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
   {
      //  Header var mı(checkbox)
      if (!context.HttpContext.Request.Headers.TryGetValue("X-Idempotency-Key", out var headerValue))
      {
         return Results.BadRequest("Hata: 'X-Idempotency-Key' HTTP başlığı (header) eksik!");
      }

      string idempotencyKey = headerValue.ToString().Trim();
      
      // Header boş mu
      if (string.IsNullOrWhiteSpace(idempotencyKey))
      {
          return Results.BadRequest("Hata: 'X-Idempotency-Key' boş olamaz!");
      }

      string redisKey = $"idempotency:{idempotencyKey}";
      TimeSpan ttl = TimeSpan.FromMinutes(5);
      

      try
      {
          // Redis SETNX kontrolü 
          bool isUnique = await _redisDb.StringSetAsync(redisKey, "PROCESSING", ttl, When.NotExists);

          if (!isUnique)
          {
              Console.WriteLine($"[Idempotency] MÜKERRER İSTEK YAKALANDI! 409 DÖNÜLÜYOR: {redisKey}");
              return Results.Conflict(new { message = "Hata: Bu işlem zaten gerçekleştiriliyor. Lütfen bekleyiniz..." });  }
     
     //İstek bankaya gitmeden önce 4 sn bekle
              Console.WriteLine($"[Idempotency] İlk istek kilidi aldı. 4 saniyelik mükerrer istek penceresi başlatıldı: {redisKey}");
              await Task.Delay(4000); 
              Console.WriteLine($"[Idempotency] 4 saniyelik süre doldu, artık gerçek banka işlemine geçiliyor.");

      }
      catch (Exception ex)
      {
     //Redis çökese logla sistemi kilitleme(500)
          Console.WriteLine($"[Redis Hatası] Idempotency kontrolü atlandı: {ex.Message}");
      }

      // Her şey yolundaysa veya Redis çöktüyse 
      return await next(context);
    }
}