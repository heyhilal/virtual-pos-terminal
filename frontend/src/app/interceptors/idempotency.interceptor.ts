import { HttpInterceptorFn } from '@angular/common/http';

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Eğer component veya servis zaten bir 'X-Idempotency-Key' eklemişse, ona dokunmuyoruz!
  if (req.headers.has('X-Idempotency-Key')) {
    const existingKey = req.headers.get('X-Idempotency-Key');
    console.log(`[Idempotency Interceptor] Bileşenden gelen mevcut anahtar korundu: ${existingKey}`);
    return next(req); // İsteği klonlamadan, olduğu gibi gönderiyoruz
  }

  // 2. Eğer istekte bu header hiç yoksa (örneğin normal bir get isteği vb.), o zaman yeni bir tane üretiyoruz
  const idempotencyKey = 'idempotency:' + generateUUID();

  const clonedRequest = req.clone({
    headers: req.headers.set('X-Idempotency-Key', idempotencyKey)
  });

  console.log(`[Idempotency Interceptor] Yeni anahtar üretildi ve eklendi: ${idempotencyKey}`);

  return next(clonedRequest);
};

// Benzersiz UUID v4 üreten yardımcı fonksiyon (aynen kalıyor)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}