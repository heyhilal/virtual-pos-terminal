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
      // cancel istekleri filtre dışı 
      var path = context.HttpContext.Request.Path.Value ?? "";
      if (path.Contains("/cancel", StringComparison.OrdinalIgnoreCase))
      {
          Console.WriteLine($"[Idempotency] İptal isteği algılandı, filtre bypass ediliyor: {path}");
          return await next(context);
      }

      //  Header var mı(checkbox)
      if (!context.HttpContext.Request.Headers.TryGetValue("X-Idempotency-Key", out var headerValue))
      {
         return Results.BadRequest("Hata: 'X-Idempotency-Key' HTTP başlığı (header) eksik!");
      }

      string idempotencyKey = headerValue.ToString().Trim();
      
      if (string.IsNullOrWhiteSpace(idempotencyKey))
      {
          return Results.BadRequest("Hata: 'X-Idempotency-Key' boş olamaz!");
      }

      string redisKey = $"idempotency:{idempotencyKey}";
      TimeSpan ttl = TimeSpan.FromMinutes(1);
      
      try
      {
          bool isUnique = await _redisDb.StringSetAsync(redisKey, "PROCESSING", ttl, When.NotExists);

          if (!isUnique)
          {
              Console.WriteLine($"[Idempotency] MÜKERRER İSTEK YAKALANDI! 409 DÖNÜLÜYOR: {redisKey}");
              return Results.Conflict(new { message = "Hata: Bu işlem zaten gerçekleştiriliyor. Lütfen bekleyiniz..." });  
          }
     
          Console.WriteLine($"[Idempotency] İlk istek kilidi aldı. 4 saniyelik mükerrer istek penceresi başlatıldı: {redisKey}");
          await Task.Delay(4000); 
          Console.WriteLine($"[Idempotency] 4 saniyelik süre doldu, artık gerçek banka işlemine geçiliyor.");
      }
      catch (Exception ex)
      {
          Console.WriteLine($"[Redis Hatası] Idempotency kontrolü atlandı: {ex.Message}");
      }

      return await next(context);
    }
}