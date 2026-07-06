using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace CorePay.Application.Validation;

[AttributeUsage(AttributeTargets.Property)]
public class LuhnCheckAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
    
        if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
        {
            return new ValidationResult("Kart numarası boş olamaz.");
        }

        string cardNumber = value.ToString()!.Replace(" ", "").Replace("-", "");

        //Harf varsa direkt elensin
        if (!cardNumber.All(char.IsDigit))
        {
            return new ValidationResult("Kart numarası sadece rakamlardan oluşmalıdır.");
        }

        if (cardNumber.Length < 13 || cardNumber.Length > 19)
        {
            return new ValidationResult("Geçersiz kart numarası uzunluğu.");
        }

        //Luhn Algoritması 
        int sum = 0;
        bool isSecond = false;

        for (int i = cardNumber.Length - 1; i >= 0; i--)
        {
            int digit = cardNumber[i] - '0';

            if (isSecond)
            {
                digit *= 2;
                if (digit > 9)
                {
                    digit -= 9;
                }
            }

            sum += digit;
            isSecond = !isSecond;
        }

        if (sum % 10 == 0)
        {
            return ValidationResult.Success; 
        }

        // Hata mesajını dön
        return new ValidationResult("Geçersiz Kart Formatı");
    }
}