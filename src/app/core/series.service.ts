import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api';

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private http = inject(HttpClient);

  search(query: string, country?: string) {
    return this.http.post<any[]>(
      `${API_BASE}/series/search`,
      { query, country },
      { withCredentials: true }
    );
  }

  popularWatched() {
    return this.http.get<any[]>(`${API_BASE}/series/popular-watched`, { withCredentials: true });
  }

  moreInfo(showId: number) {
    return this.http.post<any>(
      `${API_BASE}/series/more-info`,
      { showId },
      { withCredentials: true }
    );
  }

  userSeries(list: number[]) {
    return this.http.post<any[]>(
      `${API_BASE}/series/user-series`,
      { list },
      { withCredentials: true }
    );
  }

  userSeriesMoreInfo(list: number[]) {
    return this.http.post<any[]>(
      `${API_BASE}/series/user-series-more-info`,
      { list },
      { withCredentials: true }
    );
  }

  addToSet(id: number) {
    return this.http.post<{ ok: boolean }>(
      `${API_BASE}/series/add-to-set`,
      { id },
      { withCredentials: true }
    );
  }

  pullFromSet(id: number) {
    return this.http.post<{ ok: boolean }>(
      `${API_BASE}/series/pull`,
      { id },
      { withCredentials: true }
    );
  }

  filelistSince(time: number) {
    return this.http.post<any[]>(
      `${API_BASE}/series/filelist`,
      { time },
      { withCredentials: true }
    );
  }

  rarbgSince(time: number) {
    return this.http.post<any[]>(
      `${API_BASE}/series/rarbg`,
      { time },
      { withCredentials: true }
    );
  }

  flForSerie(serie: string) {
    return this.http.post<any[]>(
      `${API_BASE}/series/fl-for-serie`,
      { serie },
      { withCredentials: true }
    );
  }

  rarbgForSerie(serie: string) {
    return this.http.post<any[]>(
      `${API_BASE}/series/rarbg-for-serie`,
      { serie },
      { withCredentials: true }
    );
  }

  subtitles(name: string, language = 'rum') {
    return this.http.post<any[]>(
      `${API_BASE}/subtitles`,
      { name, language },
      { withCredentials: true }
    );
  }
}
