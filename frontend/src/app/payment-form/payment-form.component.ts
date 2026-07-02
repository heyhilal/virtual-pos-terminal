import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentRequest, PaymentService } from '../payment.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  isCvvFocused = false; 
  @ViewChild('cvvInput') cvvInputEl!: ElementRef;
  @ViewChild('cardNumberInput') cardNumberInputEl!: ElementRef;

  isModalOpen = false;
  secilenTutar = 0;
  isSuccess: boolean = false;


  aktifAdim: number = 1; 

  hedefIsimUzunlugu: number = 3;


  kuponKodu: string = '';
  indirimOrani: number = 0; 
  kuponHataMesaji: string = '';
  kuponBasariMesaji: string = '';

  readonly KUPON_VERITABANI = [
    { kod: 'BAHAR20', oran: 0.20, durum: 'gecerli', mesaj: 'Tebrikler! %20 bahar indirimi uygulandı.' },
    { kod: 'HILAL10', oran: 0.10, durum: 'gecerli', mesaj: 'Hilal\'e özel %10 indirim uygulandı! 🎉' },
    { kod: 'ESKI50', oran: 0.50, durum: 'suresi_doldu', mesaj: 'Bu kuponun süresi dolmuştur.' },
    { kod: 'KARACUMA', oran: 0.80, durum: 'gecersiz', mesaj: 'Bu kupon kodu artık geçersizdir.' }
  ];

  urunler = [
    { id: 1, isim: 'CorePay Entegrasyon Lisansı', fiyat: 2500, aciklama: 'Yıllık kurumsal sanal POS lisansı ve API erişim paketi.', adet: 1 },
    { id: 2, isim: 'Yeni Nesil Android POS Cihazı', fiyat: 7500, aciklama: 'Temassız ödeme destekli, PCI-DSS uyumlu fiziki el terminali.', adet: 1 },
    { id: 3, isim: 'AirPods Pro 2. Nesil Bluetooth Kulaklık', aciklama: 'Aktif gürültü engelleme ve adaptif şeffaf mod ile yüksek sadakatli ses deneyimi.', fiyat: 9500, adet: 1 },
    { id: 4, isim: 'Apple Watch Series 9 Akıllı Saat', aciklama: 'Her anınızda yanınızda, gelişmiş sağlık sensörleri ve her zaman açık ekran.', fiyat: 14500, adet: 1 }
  ];

  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly years = Array.from({ length: 13 }, (_, i) => new Date().getFullYear() + i);

  // --- ADRES VE KARGO DEĞİŞKENLERİ ---
  secilenKargoUcreti: number = 0; 
  
  kargoSecenekleri = [
    { id: 'standart', isim: 'Sürat Kargo (Standart)', ucret: 0, sure: '3-5 İş Günü' },
    { id: 'hizli', isim: 'Yurtiçi Kargo (Hızlı Teslimat)', ucret: 45, sure: '24 Saat İçinde' }
  ];

  adresAlanlari = {
    sehir: '',
    ilce: '',
    acikAdres: ''
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly paymentService: PaymentService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      cardholderName: ['', [Validators.required, Validators.minLength(2)]],
      cardNumber: ['', [Validators.required, Validators.minLength(19)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^([0-9]{2})\/[0-9]{2}$/)]],
      cvv: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0],
      saveCard: [false]
    });
  }

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const tutarParam = urlParams.get('tutar');
    if (tutarParam) {
      this.secilenTutar = Number(tutarParam);
      this.form.patchValue({ amount: this.secilenTutar });
    } else {
      this.secilenTutar = this.toplamTutarHesapla();
      this.form.patchValue({ amount: this.secilenTutar });
    }
  }

  onCardInput(event: any): void {
    const inputEl = event.target as HTMLInputElement;
    let rawValue = inputEl.value;
    
    let selectionStart = inputEl.selectionStart || 0;
    const oldLength = rawValue.length;

    let digits = rawValue.replace(/\D/g, '').substring(0, 16);
    const groups = digits.match(/.{1,4}/g) || [];
    const finalValue = groups.join(' ');

    this.form.get('cardNumber')?.setValue(finalValue, { emitEvent: false });

    const lengthDiff = finalValue.length - oldLength;
    let newCursorPosition = selectionStart + lengthDiff;

    if (newCursorPosition > 0 && finalValue[newCursorPosition - 1] === ' ') {
      if (lengthDiff < 0) {
        newCursorPosition--;
      }
    }

    setTimeout(() => {
      inputEl.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    this.dinamikIsimUzunluguGuncelle();
  }

  onCardClick(event: any): void {
    const inputEl = this.cardNumberInputEl?.nativeElement as HTMLInputElement;
    if (!inputEl) return;

    if (!inputEl.value || inputEl.value.trim() === '') {
      inputEl.setSelectionRange(0, 0);
    }
  }

  adetArtir(urunId: number): void {
    const urun = this.urunler.find(u => u.id === urunId);
    if (urun) {
      urun.adet++;
      this.anlikTutarGuncelle();
    }
  }

  adetAzalt(urunId: number): void {
    const index = this.urunler.findIndex(u => u.id === urunId);
    if (index !== -1) {
      const urun = this.urunler[index];
      if (urun.adet > 1) {
        urun.adet--;
      } else {
        this.urunler.splice(index, 1);
        this.snackBar.open(`${urun.isim} sepetten kaldırıldı.`, 'Kapat', { duration: 2000 });
      }
      this.anlikTutarGuncelle();
    }
  }

  private anlikTutarGuncelle(): void {
    const yeniTutar = this.toplamTutarHesapla();
    this.secilenTutar = yeniTutar;
    this.form.patchValue({ amount: yeniTutar });
  }

  dinamikIsimUzunluguGuncelle(): void {
    const otomatikGelenIsim = this.form.get('cardholderName')?.value || '';
    if (otomatikGelenIsim.trim().length >= 3) {
      this.hedefIsimUzunlugu = otomatikGelenIsim.trim().length;
    } else {
      this.hedefIsimUzunlugu = 3;
    }
  }

  kartDegisiminiKontrolEt(): void {
    const cardNumber = this.form.get('cardNumber')?.value || '';
    const cardholderName = this.form.get('cardholderName')?.value || '';
    const expiryDate = this.form.get('expiryDate')?.value || '';

    const cleanDigits = cardNumber.replace(/\D/g, '');
    const kartNoTamam = cleanDigits.length === 16;
    const sktTamam = expiryDate.length === 5;
    const isimTamam = cardholderName.trim().length >= this.hedefIsimUzunlugu;

    if (kartNoTamam && isimTamam && sktTamam && !this.isCvvFocused) {
      this.isCvvFocused = true;
      setTimeout(() => {
        this.cvvInputEl?.nativeElement?.focus();
      }, 200);
    }
  }


odemeAdiminaGec(tutar: number) {
  
  if (this.aktifAdim === 1) {
    this.aktifAdim = 2;
    return; 
  }

  if (this.aktifAdim === 2) {
    if (!this.adresAlanlari.sehir || !this.adresAlanlari.ilce || !this.adresAlanlari.acikAdres) {
      alert("Lütfen teslimat için şehir, ilçe ve açık adres bilgilerini eksiksiz doldurun!");
      return; // Adres eksikse durdur
    }
    
    // Adresler tamamsa artık ödeme modalını açabiliriz
    this.secilenTutar = tutar;
    this.isModalOpen = true; 
  }
}

  toplamTutarHesapla(): number {
    const urunlerToplami = this.urunler.reduce((toplam, urun) => toplam + (urun.fiyat * urun.adet), 0);
    const indirimMiktari = urunlerToplami * this.indirimOrani;
    return (urunlerToplami - indirimMiktari) + this.secilenKargoUcreti;
  }

  kargoDegistir(ucret: number): void {
    this.secilenKargoUcreti = ucret;
    this.anlikTutarGuncelle();
  }
  
  modalKapat(): void {
    this.isModalOpen = false;
    this.form.reset({ saveCard: false });
    this.isCvvFocused = false;
    this.hedefIsimUzunlugu = 3;
    this.aktifAdim = 1; 
    this.anlikTutarGuncelle();
  }

  onExpiryDateInput(event: any) {
    const inputEl = event.target as HTMLInputElement;
    let input = inputEl.value;
    let selectionStart = inputEl.selectionStart || 0;

    let clean = input.replace(/[^\d/ ]/g, '');

    if (clean.trim() === '') {
      this.form.get('expiryDate')?.setValue('', { emitEvent: false });
      return;
    }

    const previousValue = this.form.get('expiryDate')?.value || '';
    const isDeleting = input.length < previousValue.length;

    if (!isDeleting && clean.replace(/\D/g, '').length === 2 && !clean.includes('/')) {
      clean = clean.substring(0, 2) + '/';
      selectionStart++; 
    }

    if (clean.length > 5) {
      clean = clean.substring(0, 5);
    }

    this.form.get('expiryDate')?.setValue(clean, { emitEvent: false });
    
    setTimeout(() => {
      inputEl.setSelectionRange(selectionStart, selectionStart);
    }, 0);
  }

  onCardholderNameInput(event: any) {
    let input = event.target.value;
    input = input.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ ]/g, '');
    this.form.get('cardholderName')?.setValue(input, { emitEvent: false });
    this.dinamikIsimUzunluguGuncelle();
  }

  onCardBackspace(event: any) {
    const inputEl = this.cardNumberInputEl?.nativeElement as HTMLInputElement;
    if (!inputEl) return;

    let start = inputEl.selectionStart || 0;
    let end = inputEl.selectionEnd || 0;

    if (start === end && start > 0) {
      let currentValue = this.form.get('cardNumber')?.value || '';
      let valueArr = currentValue.split('');
      
      let targetIdx = start - 1;
      if (valueArr[targetIdx] === ' ') {
        targetIdx--;
      }
    }
  }

  getCardType(): string {
    const cardNumber = this.form.get('cardNumber')?.value || '';
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) {
      return 'visa';
    } else if (cleanNumber.startsWith('5')) {
      return 'mastercard';
    }
    return 'default'; 
  }

  // Orijinal Unsplash görsel tablon
  getUrunGorsel(urunIsim: string): string {
    const table = {
      'lisans': 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=150&q=80',
      'pos': 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=150&q=80',
      'airpods': 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=150&q=80',
      'watch': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80',
      'saat': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80'
    };
    const isim = (urunIsim || '').toLowerCase();
    for (const [key, value] of Object.entries(table)) {
      if (isim.includes(key)) return value;
    }
    return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80';
  }
  
  submit(): void {
    this.snackBar.open('Ödeme işleminiz gerçekleştiriliyor, lütfen bekleyin...', '', { duration: 2000 });

    const expiryParts = (this.form.value.expiryDate || '').split('/');
    const month = expiryParts[0] ? Number(expiryParts[0]) : 0;
    const year = expiryParts[1] ? Number('20' + expiryParts[1]) : 0; 

    const request: PaymentRequest = {
      cardholderName: this.form.value.cardholderName,
      cardNumber: (this.form.value.cardNumber || '').replace(/\D/g, ''),
      expMonth: month,  
      expYear: year,  
      cvv: this.form.value.cvv,
      amount: Number(this.secilenTutar), 
      saveCard: !!this.form.value.saveCard
    };

    this.isSubmitting = true;
    this.form.disable({ emitEvent: false });

    this.paymentService.processPayment(request).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.form.enable({ emitEvent: false });
        this.isSuccess = true; 
        this.snackBar.dismiss();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.form.enable({ emitEvent: false });
        const message = err?.message || 'Ödeme sırasında bir hata oluştu.';
        this.snackBar.open(message, 'Kapat', { duration: 4000 });
      }
    });
  }

  kuponUygula(kod: string): void {
    this.kuponHataMesaji = '';
    this.kuponBasariMesaji = '';
    this.indirimOrani = 0;

    const arananKupon = this.KUPON_VERITABANI.find(k => k.kod === kod.trim().toUpperCase());

    if (!arananKupon) {
      this.kuponHataMesaji = 'Geçersiz kupon kodu girdiniz.';
      this.anlikTutarGuncelle();
      return;
    }

    if (arananKupon.durum === 'suresi_doldu' || arananKupon.durum === 'gecersiz') {
      this.kuponHataMesaji = arananKupon.mesaj;
      this.anlikTutarGuncelle();
      return;
    }

    this.indirimOrani = arananKupon.oran;
    this.kuponBasariMesaji = arananKupon.mesaj;
    this.anlikTutarGuncelle();
  }

  // BURADAKİ CROPLAND HATASI DÜZELTİLDİ
  indirimTutariniHesapla(): number {
    const urunlerToplami = this.urunler.reduce((toplam, urun) => toplam + (urun.fiyat * urun.adet), 0);
    return urunlerToplami * this.indirimOrani;
  }

  urunlerToplaminiHesapla(): number {
    return this.urunler.reduce((toplam, urun) => toplam + (urun.fiyat * urun.adet), 0);
  }
}