import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 'withInterceptors' ekledik
import { idempotencyInterceptor } from './interceptors/idempotency.interceptor'; // interceptor yolunu ekledik

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    // provideHttpClient fonksiyonuna interceptor'ımızı parametre olarak geçiyoruz
    provideHttpClient(
      withInterceptors([idempotencyInterceptor])
    )
  ]
};