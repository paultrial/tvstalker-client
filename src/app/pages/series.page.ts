import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  readonly watchlist = signal<any[]>([]);
  readonly results = signal<any[]>([]);
  readonly latestFilelist = signal<any[]>([]);
  readonly latestRarbg = signal<any[]>([]);
  readonly filelistItems = signal<any[]>([]);
  readonly rarbgItems = signal<any[]>([]);
  readonly filelistFilter = signal('');
  readonly rarbgFilter = signal('');
  readonly rssQuery = signal<string | null>(null);
  readonly subtitleQuery = signal<string | null>(null);
  readonly subtitleResults = signal<any[]>([]);
  readonly subtitleLoading = signal(false);
  readonly loading = signal(false);

  readonly favorites = computed(() => this.auth.user()?.favorites || []);
  readonly groupedFavorites = computed(() => this.groupByDay(this.watchlist()));
  readonly filteredFilelist = computed(() => this.filterList(this.filelistItems(), this.filelistFilter()));
  readonly filteredRarbg = computed(() => this.filterList(this.rarbgItems(), this.rarbgFilter()));

  ngOnInit() {
    this.loadWatchlist();
    this.loadRecentReleases();
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
      next: (data) => {
        const items = data || [];
        this.latestFilelist.set(items);
        if (!this.rssQuery()) this.filelistItems.set(items);
      },
      error: () => {
        this.latestFilelist.set([]);
        if (!this.rssQuery()) this.filelistItems.set([]);
      }
    });
    this.series.rarbgSince(twoDaysAgo).subscribe({
      next: (data) => {
        const items = data || [];
        this.latestRarbg.set(items);
        if (!this.rssQuery()) this.rarbgItems.set(items);
      },
      error: () => {
        this.latestRarbg.set([]);
        if (!this.rssQuery()) this.rarbgItems.set([]);
      }
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

  removeFavorite(show: any) {
    const id = show?.id;
    if (!id) return;
    this.series.pullFromSet(id).subscribe({
      next: () => {
        this.auth.updateFavorites(undefined, id);
        this.loadWatchlist();
      }
    });
  }

  searchRssFor(showName: string) {
    const query = showName?.trim();
    if (!query || query === 'Unknown') return;
    this.rssQuery.set(query);
    forkJoin({
      filelist: this.series.flForSerie(query),
      rarbg: this.series.rarbgForSerie(query)
    }).subscribe({
      next: ({ filelist, rarbg }) => {
        this.filelistItems.set(filelist || []);
        this.rarbgItems.set(rarbg || []);
      },
      error: () => {
        this.filelistItems.set([]);
        this.rarbgItems.set([]);
      }
    });
  }

  clearRssFilter() {
    this.rssQuery.set(null);
    this.filelistItems.set(this.latestFilelist());
    this.rarbgItems.set(this.latestRarbg());
  }

  searchSubtitles(showName: string) {
    const query = showName?.trim();
    if (!query || query === 'Unknown') return;
    this.subtitleLoading.set(true);
    this.subtitleQuery.set(query);
    this.series.subtitles(query).subscribe({
      next: (data) => {
        this.subtitleResults.set(data || []);
        this.subtitleLoading.set(false);
      },
      error: () => {
        this.subtitleResults.set([]);
        this.subtitleLoading.set(false);
      }
    });
  }

  clearSubtitles() {
    this.subtitleQuery.set(null);
    this.subtitleResults.set([]);
  }

  showTitle(show: any) {
    return show?.name || show?.title || show?.series || 'Unknown';
  }

  showMeta(show: any) {
    const time = show?.airtime || show?.schedule?.time || show?.air?.time || show?.airsTime;
    const network = show?.network?.name || show?.network;
    return [time, network].filter(Boolean).join(' · ');
  }

  itemTitle(item: any) {
    return item?.title || item?.name || item?.filename || item?.release || item?.series || 'Untitled';
  }

  itemLink(item: any) {
    return item?.link || item?.url || item?.href || item?.download || item?.downloadLink;
  }

  private filterList(list: any[], filter: string) {
    const term = filter.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) => this.itemTitle(item).toLowerCase().includes(term));
  }

  private groupByDay(shows: any[]) {
    const groups = new Map<string, any[]>();
    for (const show of shows || []) {
      const day = this.pickDay(show);
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day)?.push(show);
    }

    const ordered = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
      'Unknown'
    ];

    return ordered
      .map((day) => ({ day, shows: groups.get(day) || [] }))
      .filter((group) => group.shows.length);
  }

  private pickDay(show: any) {
    const candidates = [
      show?.airdate,
      show?.nextEpisode?.airdate,
      show?.nextEpisode?.airstamp,
      show?.schedule?.days,
      show?.schedule?.day,
      show?.airsDayOfWeek,
      show?.airsDay,
      show?.airDay,
      show?.airday,
      show?.weekday,
      show?.day,
      show?.air?.day
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const day = this.normalizeDay(candidate);
      if (day) return day;
    }

    return 'Unknown';
  }

  private normalizeDay(candidate: any): string | null {
    if (Array.isArray(candidate)) {
      if (!candidate.length) return null;
      return this.normalizeDay(candidate[0]);
    }

    if (typeof candidate === 'number') {
      const byIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return byIndex[candidate] || null;
    }

    if (typeof candidate !== 'string') return null;

    const trimmed = candidate.trim();
    if (!trimmed) return null;

    const asDate = new Date(trimmed);
    if (!Number.isNaN(asDate.getTime())) {
      const byIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return byIndex[asDate.getDay()];
    }

    const lower = trimmed.toLowerCase();
    const map: Record<string, string> = {
      mon: 'Monday',
      monday: 'Monday',
      tue: 'Tuesday',
      tues: 'Tuesday',
      tuesday: 'Tuesday',
      wed: 'Wednesday',
      weds: 'Wednesday',
      wednesday: 'Wednesday',
      thu: 'Thursday',
      thur: 'Thursday',
      thurs: 'Thursday',
      thursday: 'Thursday',
      fri: 'Friday',
      friday: 'Friday',
      sat: 'Saturday',
      saturday: 'Saturday',
      sun: 'Sunday',
      sunday: 'Sunday'
    };

    return map[lower] || null;
  }
}
