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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss'
})
export class PaymentFormComponent implements OnInit {

  form: FormGroup;
  isSubmitting = false;
  isCvvFocused = false;
  idempotencyKey: string = '';
  @ViewChild('cvvInput') cvvInputEl!: ElementRef;
  @ViewChild('cardNumberInput') cardNumberInputEl!: ElementRef;

  isModalOpen = false;
  secilenTutar = 0;
  isSuccess: boolean = false;
  otomatikDonduMu: boolean = false;

  isLoading = false;
  loadingMessage = '';
  validationError: string | null = null;
  errorMessage: string | null = null;
  successAmount = 0;
  maskedCardNumber = '';

  aktifAdim: number = 1;
  hedefIsimUzunlugu: number = 3;

  kuponKodu: string = '';
  indirimOrani: number = 0;
  kuponHataMesaji: string = '';
  kuponBasariMesaji: string = '';

  successTransactionId: string | null = null; 
  isCancelled: boolean = false;               
  isCancelLoading: boolean = false; // İptal süreci başladı mı kontrolü 

  isErrorColor: boolean = false;
  cancelErrorMessage: string | null = null;
  isCancelErrorColor: boolean = false;


   isCardFlipped: boolean = false;


kartCevir(): void {
  this.isCardFlipped = !this.isCardFlipped;
}

  kayitliAdresler: any[] = [
    { id: 1, baslik: 'Ofis', sehir: 'İstanbul', ilce: 'Esenler', acikAdres: 'Çifte Havuzlar Mah. Eski Londra Asfaltı Cad. YTÜ Teknopark Teknoloji Geliştirme Bölgesi C2 Blok' }
  ];

  secilenAdres: any = null;
  adresBasligi: string = '';

  readonly KUPON_VERITABANI = [
    { kod: 'BAHAR20', oran: 0.20, durum: 'gecerli', mesaj: 'Tebrikler! %20 bahar indirimi uygulandı.' },
    { kod: 'HILAL10', oran: 0.10, durum: 'gecerli', mesaj: 'Hilal\'e özel %10 indirim uygulandı! 🎉' },
    { kod: 'ESKI50', oran: 0.50, durum: 'suresi_doldu', mesaj: 'Bu kuponun süresi dolmuştur.' },
    { kod: 'KARACUMA', oran: 0.80, durum: 'gecersiz', mesaj: 'Bu kupon kodu artık geçersizdir.' }
  ];

  urunler: Array<{ id: number; isim: string; fiyat: number; aciklama?: string; adet: number; emoji?: string }> = [
    { id: 1, isim: 'CorePay Entegrasyon Lisansı', fiyat: 900, aciklama: 'Yıllık kurumsal sanal POS lisansı ve API erişim paketi.', adet: 1 },
    { id: 2, isim: 'Yeni Nesil Android POS Cihazı', fiyat: 1000, aciklama: 'Temassız ödeme destekli, PCI-DSS uyumlu fiziki el terminali.', adet: 1 },
    { id: 3, isim: 'AirPods Pro 2. Nesil Bluetooth Kulaklık', aciklama: 'Aktif gürültü engelleme ve adaptif şeffaf mod ile yüksek sadakatli ses deneyimi.', fiyat: 1500, adet: 1 },
    { id: 4, isim: 'Apple Watch Series 9 Akıllı Saat', aciklama: 'Her anınızda yanınızda, gelişmiş sağlık sensörleri ve her zaman açık ekran.', fiyat: 14500, adet: 1 }
  ];

  urunlerSayfasiAktif: boolean = false;

  kategoriler = [
    {
      id: 'elektronik',
      isim: 'Elektronik & Teknoloji',
      emoji: '💻',
      urunler: [
        { id: 201, isim: 'Kablosuz Mekanik Klavye', fiyat: 1899, aciklama: 'RGB aydınlatmalı, hızlı tepki süreli oyuncu klavyesi.', emoji: '⌨️' },
        { id: 202, isim: '27" 4K Monitör', fiyat: 8999, aciklama: 'Canlı renkler ve yüksek yenileme hızıyla üretkenlik ve oyun için ideal.', emoji: '🖥️' },
        { id: 203, isim: 'Taşınabilir SSD 1TB', fiyat: 1499, aciklama: 'Yüksek hızlı veri aktarımı, cebe sığan tasarım.', emoji: '💾' }
      ]
    },
    {
      id: 'moda',
      isim: 'Moda & Giyim',
      emoji: '👚',
      urunler: [
        { id: 301, isim: 'Unisex Oversize Hoodie', fiyat: 699, aciklama: 'Yumuşak dokulu, günlük kullanım için rahat kesim.', emoji: '🧥' },
        { id: 302, isim: 'Deri Cüzdan', fiyat: 449, aciklama: 'Hakiki deri, çok gözlü kart bölmeli klasik tasarım.', emoji: '👛' },
        { id: 303, isim: 'Spor Ayakkabı', fiyat: 1299, aciklama: 'Nefes alabilir kumaş, günlük ve spor kullanıma uygun.', emoji: '👟' }
      ]
    },
    {
      id: 'ev',
      isim: 'Ev & Yaşam',
      emoji: '🏡',
      urunler: [
        { id: 401, isim: 'Aromaterapi Difüzör', fiyat: 549, aciklama: 'LED ışıklı, sessiz çalışan ultrasonik nem makinesi.', emoji: '🕯️' },
        { id: 402, isim: 'Pamuklu Nevresim Takımı', fiyat: 899, aciklama: '%100 pamuk, çift kişilik yumuşak dokulu set.', emoji: '🛏️' }, // 🌟 DÜZELTİLDİ: 'mt' yazan yer 'isim' yapıldı
        { id: 403, isim: 'Akıllı LED Ampul', fiyat: 299, aciklama: 'Uygulama üzerinden renk ve parlaklık kontrolü.', emoji: '💡' }
      ]
    },
    {
      id: 'kitap',
      isim: 'Kitap & Kırtasiye',
      emoji: '📚',
      urunler: [
        { id: 501, isim: 'Deri Kapaklı Defter', fiyat: 249, aciklama: 'El yapımı kapak, kalın dokulu 200 sayfa.', emoji: '📓' },
        { id: 502, isim: 'Kaligrafi Kalem Seti', fiyat: 179, aciklama: 'Farklı uç kalınlıklarında 6 parça set.', emoji: '🖋️' },
        { id: 503, isim: 'Yılın En Çok Satan Romanı', fiyat: 129, aciklama: 'Okuyucuların beğenisini kazanan güncel roman.', emoji: '📖' }
      ]
    }
  ];

  secilenKategoriId: string | null = null;

  readonly months = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly years = Array.from({ length: 13 }, (_, i) => new Date().getFullYear() + i);

  secilenKargoUcreti: number = 0;
  kargoSecenekleri = [
    { id: 'standart', isim: 'Sürat Kargo (Standart)', ucret: 0, sure: '3-5 İş Günü' },
    { id: 'hizli', isim: 'Yurtiçi Kargo (Hızlı Teslimat)', ucret: 45, sure: '24 Saat İçinde' }
  ];

  adresAlanlari: { sehir: string; ilce: string; acikAdres: string } = {
    sehir: '',
    ilce: '',
    acikAdres: ''
  };

  kayitliKartlar: any[] = [];

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
    this.idempotencyKey = crypto.randomUUID();
    console.log(`[Idempotency] Form için üretilen ve sabitlenen anahtar: ${this.idempotencyKey}`);

    const localAdresler = localStorage.getItem('kullaniciAdresDefteri');
    if (localAdresler) {
      this.kayitliAdresler = JSON.parse(localAdresler);
    }
    const localKartlar = localStorage.getItem('kullaniciKartDefteri');
    if (localKartlar) {
      this.kayitliKartlar = JSON.parse(localKartlar);
    }
 
    this.secilenTutar = this.toplamTutarHesapla();
    this.form.patchValue({ amount: this.secilenTutar });
  }

  kategoriSec(kategoriId: string): void {
    this.secilenKategoriId = this.secilenKategoriId === kategoriId ? null : kategoriId;
  }

  get secilenKategori() {
    return this.kategoriler.find(k => k.id === this.secilenKategoriId) || null;
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
    if (this.otomatikDonduMu) return;

    const cardNumber = this.form.get('cardNumber')?.value || '';
    const cardholderName = this.form.get('cardholderName')?.value || '';
    const expiryDate = this.form.get('expiryDate')?.value || '';

    const cleanDigits = cardNumber.replace(/\D/g, '');
    const kartNoTamam = cleanDigits.length === 16;
    const sktTamam = expiryDate.length === 5;
    const isimTamam = cardholderName.trim().length >= this.hedefIsimUzunlugu;

    if (kartNoTamam && isimTamam && sktTamam && !this.isCvvFocused) {
      this.isCvvFocused = true;
      this.otomatikDonduMu = true;
      setTimeout(() => {
        this.cvvInputEl?.nativeElement?.focus();
      }, 200);
    }
  }

  adresSec(adres: any): void {
    this.secilenAdres = adres;
    this.adresAlanlari = {
      sehir: adres.sehir,
      ilce: adres.ilce,
      acikAdres: adres.acikAdres
    };
  }

  yeniAdresKaydet(): void {
    if (!this.adresAlanlari.sehir || !this.adresAlanlari.ilce || !this.adresAlanlari.acikAdres) {
      this.snackBar.open('Lütfen önce adres bilgilerini doldurun.', 'Kapat', { duration: 2500 });
      return;
    }
    const yeniAdres = {
      id: Date.now(),
      baslik: this.adresBasligi.trim() || `Adres ${this.kayitliAdresler.length + 1}`,
      sehir: this.adresAlanlari.sehir,
      ilce: this.adresAlanlari.ilce,
      acikAdres: this.adresAlanlari.acikAdres
    };

    this.kayitliAdresler.push(yeniAdres);
    localStorage.setItem('kullaniciAdresDefteri', JSON.stringify(this.kayitliAdresler));
    this.snackBar.open(`"${yeniAdres.baslik}" başarıyla kaydedildi!`, 'Kapat', { duration: 2000 });
    this.adresBasligi = '';
  }

  kayitliAdresiDoldur(): void {
    if (this.kayitliAdresler.length > 0) {
      this.adresSec(this.kayitliAdresler[0]);
    }
  }

  adresSil(id: any, event: Event): void {
    event.stopPropagation();
    this.kayitliAdresler = this.kayitliAdresler.filter(adres => String(adres.id) !== String(id));
    localStorage.setItem('kullaniciAdresDefteri', JSON.stringify(this.kayitliAdresler));
    if (this.secilenAdres && String(this.secilenAdres.id) === String(id)) {
      this.adresAlanlari = { sehir: '', ilce: '', acikAdres: '' };
      this.secilenAdres = null;
    }
    this.snackBar.open('Adres başarıyla silindi.', 'Kapat', { duration: 2000 });
  }

  kartSec(kart: any): void {
    this.form.patchValue({
      cardNumber: kart.kartNo,
      cardholderName: kart.kartSahibi,
      expiryDate: kart.skt
    });
    this.otomatikDonduMu = true;
    this.isCvvFocused = true;
    setTimeout(() => {
      this.cvvInputEl?.nativeElement?.focus();
    }, 200);
    this.snackBar.open(`${kart.baslik} seçildi.`, 'Kapat', { duration: 1500 });
  }

  yeniKartiKaydet(): void {
    const formValues = this.form.getRawValue();
    const yeniKart = {
      id: Date.now(),
      baslik: `${this.getCardType().toUpperCase()} - ${formValues.cardNumber.slice(-4)}`,
      kartSahibi: formValues.cardholderName,
      kartNo: formValues.cardNumber,
      skt: formValues.expiryDate,
      tip: this.getCardType()
    };
    this.kayitliKartlar.push(yeniKart);
    localStorage.setItem('kullaniciKartDefteri', JSON.stringify(this.kayitliKartlar));
  }

  sepeteUrunEkle(urun: any): void {
    const mevcutUrun = this.urunler.find(u => u.id === urun.id);
    if (mevcutUrun) {
      mevcutUrun.adet++;
    } else {
      this.urunler.push({ ...urun, adet: 1 });
    }
    this.anlikTutarGuncelle();
    this.snackBar.open(`${urun.isim} sepete eklendi.`, 'Kapat', { duration: 1500 });
  }

  sepeteGit(): void {
    this.urunlerSayfasiAktif = false;
  }

  odemeAdiminaGec(tutar: number) {
    if (this.aktifAdim === 1) {
      this.aktifAdim = 2;
      return;
    }

    if (this.aktifAdim === 2) {
      if (!this.adresAlanlari.sehir || !this.adresAlanlari.ilce || !this.adresAlanlari.acikAdres) {
        alert("Lütfen teslimat için şehir, ilçe ve açık adres bilgilerini eksiksiz doldurun!");
        return;
      }
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
    this.otomatikDonduMu = false;
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
  
  isValidLuhn(cardNumber: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  submit(): void {
    this.isLoading = false; 
    this.validationError = null;
    this.errorMessage = null; // Önceki mesajı temizle
    this.isErrorColor = false;

    const rawCardNumber = (this.form.value.cardNumber || '').replace(/\s+/g, '').replace(/\D/g, '');
    const cvv = (this.form.value.cvv || '').trim();
    const expiryDate = (this.form.value.expiryDate || '').trim();

    // Form Doğrulama Kontrolleri
    if (!rawCardNumber || rawCardNumber.length !== 16 || isNaN(Number(rawCardNumber)) || !this.isValidLuhn(rawCardNumber)) {
      this.validationError = "Geçersiz Kart Formatı veya Bilgisi!"; 
      this.form.markAllAsTouched();
      return;
    }
    if (!cvv || cvv.length !== 3 || isNaN(Number(cvv))) {
      this.validationError = "Geçersiz Kart Formatı veya Bilgisi!";
      this.form.markAllAsTouched();
      return;
    }
    const expiryPattern = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expiryPattern.test(expiryDate)) {
      this.validationError = "Geçersiz Kart Formatı veya Bilgisi!";
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) {
      this.validationError = "Lütfen formdaki alanları doğru formatta doldurunuz.";
      this.form.markAllAsTouched();
      return;
    }

    if (!this.idempotencyKey) {
      this.idempotencyKey = crypto.randomUUID();
    }

    this.errorMessage = "🔄 Ödemeniz tamamlanıyor, lütfen bekleyin...";
    this.isErrorColor = false;
    this.isLoading = true;

    const expiryParts = expiryDate.split('/');
    const month = expiryParts[0] ? Number(expiryParts[0]) : 0;
    const year = expiryParts[1] ? Number('20' + expiryParts[1]) : 0;

    const request: PaymentRequest = {
      cardholderName: this.form.value.cardholderName,
      cardNumber: rawCardNumber,
      expMonth: month,
      expYear: year,
      cvv: cvv,
      amount: Number(this.secilenTutar),
      saveCard: !!this.form.value.saveCard
    };

    this.isSubmitting = false;

    this.paymentService.processPayment(request, this.idempotencyKey).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.errorMessage = null; 
        
        if (this.form.value.saveCard) { this.yeniKartiKaydet(); }
        this.successAmount = Number(this.secilenTutar);
        this.maskedCardNumber = `**** **** **** ${rawCardNumber.slice(-4)}`;
        this.successTransactionId = (res as any)?.id || (res as any)?.transactionId || null;

        this.form.reset(); 
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          if (control) { control.setValue(''); control.setErrors(null); }
        });

        this.isCvvFocused = false; 
        if (this.adresAlanlari) { this.adresAlanlari = { sehir: '', ilce: '', acikAdres: '' }; }
        if ('adresBasligi' in this) { this.adresBasligi = ''; }
        this.secilenAdres = null;

        const kayitliKartlarYedek = localStorage.getItem('kullaniciKartDefteri');
        const kayitliAdreslerYedek = localStorage.getItem('kullaniciAdresDefteri');
        localStorage.clear();   
        sessionStorage.clear(); 
        if (kayitliKartlarYedek) { localStorage.setItem('kullaniciKartDefteri', kayitliKartlarYedek); }
        if (kayitliAdreslerYedek) { localStorage.setItem('kullaniciAdresDefteri', kayitliAdreslerYedek); }
        
        this.urunler = [];                    
        this.validationError = null;          
        this.idempotencyKey = '';             
        this.isSuccess = true;                
        this.isModalOpen = false;             
        this.aktifAdim = 1;
        this.urunlerSayfasiAktif = true;      
      },
      error: (err) => {
        this.isLoading = false; 
        const statusCode = err?.status;
        
        if (statusCode === 409) {
          let serverMessage = err?.error?.message || err?.error || "Bu işlem zaten gerçekleştiriliyor.";
          serverMessage = serverMessage.replace(/hata:/gi, '').replace(/hata/gi, '').trim();
          
       
          this.errorMessage = `❌ ${serverMessage}`;
          this.isErrorColor = true; 
        } 
        else if (statusCode === 400) {
          this.errorMessage = null; 
          this.isErrorColor = false;
          const serverMessage = err?.error?.message || err?.error;
          this.validationError = serverMessage || "Geçersiz Kart Formatı veya Bilgisi!";
        }
        else {
          this.errorMessage = "Sistemsel bir hata oluştu.";
          this.isErrorColor = true; 
        }
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

  indirimTutariniHesapla(): number {
    const urunlerToplami = this.urunler.reduce((toplam, urun) => toplam + (urun.fiyat * urun.adet), 0);
    return urunlerToplami * this.indirimOrani;
  }

  urunlerToplaminiHesapla(): number {
    return this.urunler.reduce((toplam, urun) => toplam + (urun.fiyat * urun.adet), 0);
  }

  // İşlemin halihazırda başlatılıp başlatılmadığını takip etmek için bir kilit tanımlıyoruz
  isCancelRequestPending: boolean = false;

  islemiIptalEt(): void {
    console.log('İptal butonuna tıklandı!');

    if (!this.successTransactionId) {
      this.cancelErrorMessage = "❌ İptal edilecek geçerli bir işlem bulunamadı.";
      this.isCancelErrorColor = true;
      return;
    }

    // ilk tıklanma
    if (!this.isCancelRequestPending) {
      this.isCancelRequestPending = true; 
      
      this.cancelErrorMessage = "Ödemeniz iptal ediliyor, lütfen bekleyin...";
      this.isCancelErrorColor = false;
      this.isCancelLoading = true;

      // İlk istek test amaçlı artık 5 saniye sonra gönderilecek
      setTimeout(() => {
     if (this.isCancelled) return;

        this.paymentService.cancelPayment(this.successTransactionId!).subscribe({
          next: (response: any) => {
            this.isCancelLoading = false;
            this.isCancelled = true; 
            this.isCancelRequestPending = false;
            this.cancelErrorMessage = null; 
      
          },
          error: (err: any) => {
            this.isCancelLoading = false;
            this.isCancelRequestPending = false;
            console.log('İlk istekte hata yakalandı!', err);
            this.handleCancelError(err);
          }
        });
      }, 5000); 
    } 
    // tekrar tıklanırsa
    else {
      console.log('İkinci tıklama algılandı! Yazı süreç bitene kadar sabit kalacak.');
      
   this.cancelErrorMessage = "⚠️ Bu işlem zaten iptal ediliyor, lütfen sürecin tamamlanmasını bekleyiniz...";
      this.isCancelErrorColor = true; 

    }
  }

  // Hata mesajlarını yöneten fonksiyonumuz
  private handleCancelError(err: any): void {
    if (err?.status === 404) {
      let serverMessage = err?.error?.message || err?.error || "Bu işlem daha önce zaten iptal edilmiş.";
      if (typeof serverMessage === 'string') {
        serverMessage = serverMessage.replace(/hata:/gi, '').replace(/hata/gi, '').trim();
      }
      this.cancelErrorMessage = `❌ ${serverMessage}`;
      this.isCancelErrorColor = true; 
    } 
    else if (err?.status === 400) {
      const serverMessage = err?.error?.message || err?.error || "Sadece aynı gün içindeki işlemler iptal edilebilir.";
      this.cancelErrorMessage = `❌ ${serverMessage}`;
      this.isCancelErrorColor = true;
    }
    else {
      this.cancelErrorMessage = "İptal işlemi gerçekleştirilemedi.";
      this.isCancelErrorColor = true;
    }
  }
}