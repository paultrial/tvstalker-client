import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { SeriesService } from '../core/series.service';

@Component({
  selector: 'app-watchlist-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist.page.html',
  styleUrl: './watchlist.page.css'
})
export class WatchlistPage implements OnInit {
  private auth = inject(AuthService);
  private series = inject(SeriesService);

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
}
