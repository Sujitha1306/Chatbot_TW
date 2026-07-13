import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MfaService } from '../../shared/services/mfa.service';

@Component({
  selector: 'app-mfa',
  templateUrl: './mfa.component.html',
  styleUrls: ['./mfa.component.css'],
})
export class MfaComponent {
  @Input() username: any = null;
  @Input() isConfigured: boolean = false;
  @Input() otpAuthUrl: string | null = null;
  @Input() secret: string | null = null;
  @Output() verified = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  showQr = false;
  verifying = false;
  otpControl = new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]);
  errorMsg: string | null = null;

  constructor(private mfa: MfaService) {}

  toggleQr(): void {
    this.showQr = !this.showQr;
    this.errorMsg = null;
  }

  verify(): void {
    if (this.otpControl.invalid || this.verifying) { return; }
    const token = (this.otpControl.value as string).trim();
    this.verifying = true;
    this.errorMsg = null;

    this.mfa.verify(this.username, token).subscribe({
      next: (res) => {
        this.verifying = false;
        if (res.results?.success) {
          this.verified.emit();
        } else {
          this.errorMsg = res.message ?? 'Invalid code. Please try again.';
          this.otpControl.reset();
        }
      },
      error: () => {
        this.verifying = false;
        this.errorMsg = 'Verification failed. Please try again.';
        this.otpControl.reset();
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
