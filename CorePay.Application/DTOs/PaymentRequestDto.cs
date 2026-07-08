using System.ComponentModel.DataAnnotations;
using CorePay.Application.Validation;

namespace CorePay.Application.DTOs;

public class PaymentRequestDto : IValidatableObject
{
    [Required(ErrorMessage = "Kart sahibi adı zorunludur.")]
    public string CardholderName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Kart numarası zorunludur.")]
    public string CardNumber { get; set; } = string.Empty;

    [Required]
    [Range(1, 12, ErrorMessage = "Geçerli bir ay giriniz (1-12).")]
    public int ExpMonth { get; set; }

    [Required]
    public int ExpYear { get; set; }

    [Required(ErrorMessage = "CVV zorunludur.")]
    public string Cvv { get; set; } = string.Empty;

    [Required]
    public decimal Amount { get; set; }

    public bool SaveCard { get; set; }
public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
{
    var luhnChecker = new LuhnCheckAttribute();
    
  
    var result = luhnChecker.GetValidationResult(CardNumber, new ValidationContext(this) { MemberName = nameof(CardNumber) });

    if (result != ValidationResult.Success && result != null)
    {
        yield return result;
    }
}
}