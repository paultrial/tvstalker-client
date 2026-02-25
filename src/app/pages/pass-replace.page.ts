import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-pass-replace-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pass-replace.page.html',
  styleUrl: './pass-replace.page.css'
})
export class PassReplacePage {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly status = signal<'checking' | 'invalid' | 'ready' | 'done'>('checking');
  readonly message = signal<string | null>(null);

  readonly token = signal('');
  readonly email = signal('');

  form = this.fb.group({
    password: ['', Validators.required]
  });

  constructor() {
    const token = this.route.snapshot.paramMap.get('token');
    const email = this.route.snapshot.paramMap.get('email');
    if (!token || !email) {
      this.status.set('invalid');
      return;
    }
    this.token.set(token);
    this.email.set(decodeURIComponent(email));

    this.auth.passReplace(token, decodeURIComponent(email)).subscribe({
      next: (resp) => {
        this.status.set(resp.ok ? 'ready' : 'invalid');
      },
      error: () => this.status.set('invalid')
    });
  }

  submit() {
    if (this.form.invalid) return;
    const password = this.form.getRawValue().password!;
    this.auth.resetPassword(this.token(), this.email(), password).subscribe({
      next: (resp) => {
        if (resp.ok) {
          this.status.set('done');
          this.message.set('Password updated. You can log in now.');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.message.set(resp.error || 'Reset failed.');
        }
      },
      error: () => this.message.set('Reset failed.')
    });
  }
}
