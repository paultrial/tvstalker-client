import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginPage } from './pages/login.page';
import { SeriesPage } from './pages/series.page';
import { WatchlistPage } from './pages/watchlist.page';
import { ProfilePage } from './pages/profile.page';
import { PassRecoverPage } from './pages/pass-recover.page';
import { PassReplacePage } from './pages/pass-replace.page';
import { NotFoundPage } from './pages/not-found.page';

export const routes: Routes = [
  { path: '', component: SeriesPage, canActivate: [authGuard] },
  { path: 'login', component: LoginPage },
  { path: 'watchlist', component: WatchlistPage, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'pass-recover', component: PassRecoverPage },
  { path: 'pass-replace/:token/:email', component: PassReplacePage },
  { path: '**', component: NotFoundPage }
];
