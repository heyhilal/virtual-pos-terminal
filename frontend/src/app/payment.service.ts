import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  
  private readonly baseUrl = 'http://localhost:5042/api/payments'; 

  constructor(private readonly http: HttpClient) {}

  //Dışarıdan idempotencyKey al
  processPayment(request: PaymentRequest, idempotencyKey: string): Observable<PaymentResponse> {
    console.log(`[Idempotency] Servise Gelen Sabit Anahtar: ${idempotencyKey}`);

    const headers = new HttpHeaders({
      'X-Idempotency-Key': idempotencyKey // Her seferinde değişmiyor
    });
    
    return this.http.post<PaymentResponse>(this.baseUrl, request, { headers });
  }


  cancelPayment(transactionId: string): Observable<any> {
    console.log(`[İptal İsteği] Servis tetiklendi. İşlem ID: ${transactionId}`);
    
    // İstek atılacak tam URL: http://localhost:5042/api/payments/{transactionId}/cancel
    const url = `${this.baseUrl}/${transactionId}/cancel`;
    
    // POST isteği fırlatıyoruz
    return this.http.post<any>(url, {});

    
  }
}

