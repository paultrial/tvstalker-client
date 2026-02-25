import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { SeriesService } from '../core/series.service';

@Component({
  selector: 'app-series-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './series.page.html',
  styleUrl: './series.page.css'
})
export class SeriesPage implements OnInit {
  private auth = inject(AuthService);
  private series = inject(SeriesService);

  readonly searchControl = new FormControl('');
  readonly results = signal<any[]>([]);
  readonly popular = signal<any[]>([]);
  readonly watchlist = signal<any[]>([]);
  readonly recentFilelist = signal<any[]>([]);
  readonly recentRarbg = signal<any[]>([]);
  readonly loading = signal(false);

  readonly favorites = computed(() => this.auth.user()?.favorites || []);

  ngOnInit() {
    this.loadPopular();
    this.loadWatchlist();
    this.loadRecentReleases();
  }

  loadPopular() {
    this.series.popularWatched().subscribe({
      next: (data) => this.popular.set(data || []),
      error: () => this.popular.set([])
    });
  }

  loadWatchlist() {
    const ids = this.favorites();
    if (!ids.length) {
      this.watchlist.set([]);
      return;
    }
    this.series.userSeriesMoreInfo(ids).subscribe({
      next: (data) => this.watchlist.set(data || []),
      error: () => this.watchlist.set([])
    });
  }

  loadRecentReleases() {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    this.series.filelistSince(twoDaysAgo).subscribe({
      next: (data) => this.recentFilelist.set(data || []),
      error: () => this.recentFilelist.set([])
    });
    this.series.rarbgSince(twoDaysAgo).subscribe({
      next: (data) => this.recentRarbg.set(data || []),
      error: () => this.recentRarbg.set([])
    });
  }

  search() {
    const query = this.searchControl.value?.trim();
    if (!query) return;
    this.loading.set(true);
    this.series.search(query).subscribe({
      next: (data) => {
        this.results.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  isFavorite(id: number) {
    return this.favorites().includes(id);
  }

  toggleFavorite(show: any) {
    const id = show?.id;
    if (!id) return;

    if (this.isFavorite(id)) {
      this.series.pullFromSet(id).subscribe({
        next: () => {
          this.auth.updateFavorites(undefined, id);
          this.loadWatchlist();
        }
      });
    } else {
      this.series.addToSet(id).subscribe({
        next: () => {
          this.auth.updateFavorites(id, undefined);
          this.loadWatchlist();
        }
      });
    }
  }
}
