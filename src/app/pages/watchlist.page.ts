import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { SeriesService } from '../core/series.service';

@Component({
  selector: 'app-watchlist-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './watchlist.page.html',
  styleUrl: './watchlist.page.css'
})
export class WatchlistPage implements OnInit {
  private auth = inject(AuthService);
  private series = inject(SeriesService);

  readonly searchControl = new FormControl('');
  readonly results = signal<any[]>([]);
  readonly loading = signal(false);
  readonly favorites = computed(() => this.auth.user()?.favorites || []);
  readonly shows = signal<any[]>([]);

  ngOnInit() {
    this.load();
  }

  load() {
    const ids = this.favorites();
    if (!ids.length) {
      this.shows.set([]);
      return;
    }
    this.series.userSeriesMoreInfo(ids).subscribe({
      next: (data) => this.shows.set(data || []),
      error: () => this.shows.set([])
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

  onSearchSubmit(event: Event) {
    event.preventDefault();
    this.search();
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
          this.load();
        }
      });
    } else {
      this.series.addToSet(id).subscribe({
        next: () => {
          this.auth.updateFavorites(id, undefined);
          this.load();
        }
      });
    }
  }

  remove(show: any) {
    const id = show?.id;
    if (!id) return;
    this.series.pullFromSet(id).subscribe({
      next: () => {
        this.auth.updateFavorites(undefined, id);
        this.load();
      }
    });
  }

  resultYear(show: any) {
    if (show?.premieredYear) return String(show.premieredYear);
    if (typeof show?.premiered === 'string' && show.premiered.length >= 4) {
      return show.premiered.slice(0, 4);
    }
    return '';
  }

  resultCountry(show: any) {
    return (
      show?.network?.country?.code ||
      show?.network?.country?.name ||
      show?.webChannel?.country?.code ||
      show?.webChannel?.country?.name ||
      show?.country ||
      ''
    );
  }

  resultMeta(show: any) {
    const year = this.resultYear(show);
    const country = this.resultCountry(show);
    if (year && country) return `${year} • ${country}`;
    return year || country || '';
  }
}
