import { Component } from '@angular/core';
import { PaymentFormComponent } from './payment-form/payment-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PaymentFormComponent],
  template: '<app-payment-form></app-payment-form>',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'paymentsample-ui';
}