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
  
  private readonly baseUrl = 'http://localhost:5042/api/payments'; 

  constructor(private readonly http: HttpClient) {}

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    console.log("Şimdi gerçekten Backend'e istek gidiyor!", request);
    
   
    return this.http.post<PaymentResponse>(this.baseUrl, request);
  }
}