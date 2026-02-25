import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  signupForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    passkey: ['']
  });

  submitLogin() {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.loginForm.getRawValue();
    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Login failed');
      }
    });
  }

  submitSignup() {
    if (this.signupForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const { username, email, password, passkey } = this.signupForm.getRawValue();
    this.auth.signup(username!, email!, password!, passkey || '').subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Signup failed');
      }
    });
  }
}
