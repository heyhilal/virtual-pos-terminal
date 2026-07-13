using Serilog.Core;
using Serilog.Events;
using System.Reflection;

namespace CorePay.API;

public class SecurityLogDestructuringPolicy : IDestructuringPolicy
{
    public bool TryDestructure(object value, ILogEventPropertyValueFactory propertyValueFactory, out LogEventPropertyValue result)
    {
        // Loglanan nesnenin içindeki tüm property'leri al
        var properties = value.GetType().GetProperties();
        var logProperties = new List<LogEventProperty>();

        foreach (var property in properties)
        {
            var propName = property.Name;
            var propValue = property.GetValue(value);

           
            // "CVV" ise bu alanı loga ekleme
            if (propName.Equals("CVV", StringComparison.OrdinalIgnoreCase))
            {
                continue; 
            }

           
            // "CardNumber" ise maskele
            if (propName.Equals("CardNumber", StringComparison.OrdinalIgnoreCase) && propValue is string cardNumberStr)
            {
                // İlk 4 ve son 4 haneyi koru,arayı yıldızla
                if (cardNumberStr.Length >= 8)
                {
                    var maskedCard = $"{cardNumberStr[..4]}{new string('*', cardNumberStr.Length - 8)}{cardNumberStr[^4..]}";
                    logProperties.Add(new LogEventProperty(propName, new ScalarValue(maskedCard)));
                }
                //Kart numarası kısaysa,tüm karakterleri yıldızla
                else
                {
                    logProperties.Add(new LogEventProperty(propName, new ScalarValue(new string('*', cardNumberStr.Length))));
                }
                continue;
            }

          
            // Hassas olmayan diğer tüm alanları Serilog formatına çevirerek logla
            if (propValue != null)
            {
                logProperties.Add(new LogEventProperty(propName, propertyValueFactory.CreatePropertyValue(propValue, true)));
            }
        }

        // Taranan ve güvenli hale getirilen yeni nesne şablonunu Serilog'a gönder
        result = new StructureValue(logProperties, value.GetType().Name);
        return true;
    }
}