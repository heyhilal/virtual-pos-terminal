import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface PaymentRequest {
  cardholderName: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  amount: number;
  saveCard: boolean;
}

export interface PaymentResponse {
  success: boolean;
  authorizationCode?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // 🎯 BURAYI TAMAMEN BOŞALTTIK: Artık projede "5214" diye bir şey ASLA kalmadı!
  private readonly baseUrl = '';

  constructor(private readonly http: HttpClient) {}

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    console.log("ALOOO BEN ÇALIŞIYORUM!");
    // 🎯 DOĞRUDAN SAHTE CEVAP DÖNÜYORUZ: 
    // Altındaki gizli HTTP kodunu tamamen sildik ki hiçbir yere istek atamasın.
    return of({
      success: true,
      authorizationCode: 'AUTH-' + Math.floor(100000 + Math.random() * 900000),
      message: 'Ödeme işlemi başarıyla simüle edildi.'
    }).pipe(
      delay(1000)
    );
  }
}