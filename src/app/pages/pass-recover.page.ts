import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-pass-recover-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pass-recover.page.html',
  styleUrl: './pass-recover.page.css'
})
export class PassRecoverPage {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly message = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit() {
    if (this.form.invalid) return;
    const { email } = this.form.getRawValue();
    this.auth.passRecover(email!).subscribe({
      next: (resp) => {
        this.message.set(resp.ok ? 'Check your inbox for a reset link.' : 'Email not found.');
      },
      error: () => {
        this.message.set('Failed to send reset link.');
      }
    });
  }
}
