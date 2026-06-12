import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Invalid credentials';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
