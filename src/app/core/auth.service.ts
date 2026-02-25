import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, of, tap } from 'rxjs';
import { API_BASE } from './api';

export interface User {
  _id?: string;
  username: string;
  email: string;
  FLpasskey?: string;
  favorites: number[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.user());

  loadMe() {
    return this.http
      .get<{ user: User }>(`${API_BASE}/auth/me`, { withCredentials: true })
      .pipe(
        tap((resp) => this.user.set(resp.user)),
        catchError(() => {
          this.user.set(null);
          return of(null);
        })
      );
  }

  login(username: string, password: string) {
    return this.http
      .post<{ user: User }>(
        `${API_BASE}/auth/login`,
        { username, password },
        { withCredentials: true }
      )
      .pipe(tap((resp) => this.user.set(resp.user)));
  }

  signup(username: string, email: string, password: string, passkey?: string) {
    return this.http
      .post<{ user: User }>(
        `${API_BASE}/auth/signup`,
        { username, email, password, FLpasskey: passkey || '' },
        { withCredentials: true }
      )
      .pipe(tap((resp) => this.user.set(resp.user)));
  }

  logout() {
    return this.http
      .post(`${API_BASE}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.user.set(null);
          this.router.navigate(['/login']);
        })
      );
  }

  passRecover(email: string) {
    return this.http.post<{ ok: boolean }>(
      `${API_BASE}/auth/pass-recover`,
      { email },
      { withCredentials: true }
    );
  }

  passReplace(token: string, email: string) {
    return this.http.post<{ ok: boolean; error?: string }>(
      `${API_BASE}/auth/pass-replace`,
      { token, email },
      { withCredentials: true }
    );
  }

  resetPassword(token: string, email: string, password: string) {
    return this.http.post<{ ok: boolean; error?: string }>(
      `${API_BASE}/auth/new-pass`,
      { token, email, password },
      { withCredentials: true }
    );
  }

  updatePasskey(passKey: string, password: string) {
    return this.http.post<{ ok: boolean; FLpasskey?: string }>(
      `${API_BASE}/auth/new-passkey`,
      { passKey, password },
      { withCredentials: true }
    ).pipe(
      tap((resp) => {
        if (resp.ok && this.user()) {
          const current = this.user();
          if (current) {
            this.user.set({ ...current, FLpasskey: resp.FLpasskey || passKey });
          }
        }
      })
    );
  }

  updateFavorites(addId?: number, removeId?: number) {
    const current = this.user();
    if (!current) return;
    const set = new Set(current.favorites || []);
    if (addId !== undefined) set.add(addId);
    if (removeId !== undefined) set.delete(removeId);
    this.user.set({ ...current, favorites: Array.from(set) });
  }
}
