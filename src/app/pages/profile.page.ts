import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly user = computed(() => this.auth.user());
  readonly message = signal<string | null>(null);

  passkeyForm = this.fb.group({
    passKey: ['', Validators.required],
    password: ['', Validators.required]
  });

  updatePasskey() {
    if (this.passkeyForm.invalid) return;
    const { passKey, password } = this.passkeyForm.getRawValue();
    this.auth.updatePasskey(passKey!, password!).subscribe({
      next: () => this.message.set('Passkey updated.'),
      error: () => this.message.set('Failed to update passkey.')
    });
  }
}
