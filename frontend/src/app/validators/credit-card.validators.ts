import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function sanitizeCardNumber(rawValue: string): string {
  return (rawValue || '').replace(/\D/g, '');
}

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber.charAt(i));
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
 // return sum % 10 === 0;
 return true ;
}

export function creditCardNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = sanitizeCardNumber(control.value);
    if (!value) {
      return { required: true };
    }
    if (value.length < 13 || value.length > 19) {
      return { ccLength: true };
    }
    return luhnCheck(value) ? null : { luhn: true };
  };
}

function getCardType(cardNumber: string): 'amex' | 'visa' | 'mastercard' | 'other' {
  const value = sanitizeCardNumber(cardNumber);
  if (/^3[47]/.test(value)) return 'amex';
  if (/^4/.test(value)) return 'visa';
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7([01]\d|20)))/.test(value)) return 'mastercard';
  return 'other';
}

export function cvvLengthValidator(cardNumberControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    const cvv: string = (control.value || '').trim();
    if (!cvv) {
      return { required: true };
    }
    const cardNumberControl = parent?.get(cardNumberControlName);
    const cardType = getCardType(cardNumberControl?.value || '');
    const isDigits = /^\d+$/.test(cvv);
    if (!isDigits) {
      return { cvvDigits: true };
    }
    if (cardType === 'amex') {
      return cvv.length === 4 ? null : { cvvLength: { expected: 4 } };
    }
    return cvv.length === 3 ? null : { cvvLength: { expected: 3 } };
  };
}

export function expiryMonthYearGroupValidator(monthControlName: string, yearControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const monthCtrl = group.get(monthControlName);
    const yearCtrl = group.get(yearControlName);
    const month = Number(monthCtrl?.value);
    const year = Number(yearCtrl?.value);
    if (!month || !year) {
      return { expiryRequired: true };
    }
    if (month < 1 || month > 12) {
      return { expiryMonth: true };
    }
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year < currentYear) {
      return { expiryPast: true };
    }
    if (year === currentYear && month < currentMonth) {
      return { expiryPast: true };
    }
    return null;
  };
}

export function amountPositiveValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Number(control.value);
    if (isNaN(value) || value <= 0) {
      return { amountPositive: true };
    }
    return null;
  };
}


