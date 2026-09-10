import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Hero, HeroSlide, TmdbTrendingResponse, TmdbMediaItem } from '../components/hero';
import { MovieRow, MovieRowTab } from '../components/movieRow';
import { MovieQuiz } from '../components/quiz';
import { Categories } from '../components/categories';
 
const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy',
  36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery',
  10749: 'Romance', 878: 'Science Fiction', 53: 'Thriller',
  10752: 'War', 37: 'Western',
};
 
const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 9648: 'Mystery',
  10765: 'Science Fiction', 10768: 'War & Politics', 37: 'Western',
};
 
@Component({
  selector: 'app-home',
  imports: [Hero, MovieRow, MovieQuiz, Categories],
  template: `
    <app-hero [slides]="slides()" />
 
    <app-genre-carousel />
 
    <app-movie-row title="Latest" [tabs]="latestTabs" />
 
    <app-movie-row title="Indication" [tabs]="devListTabs" />
 
    <app-movie-row title="Top Rated" [tabs]="topRatedTabs" />
 
    <app-movie-quiz />
 
    <app-movie-row title="Nerd List" [tabs]="nerdListTabs" />
  `,
})
export class Home {
  protected readonly latestTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'catalog', listKind: 'now_playing' } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'catalog', listKind: 'airing_today' } },
  ];
 
  protected readonly popularTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'catalog', listKind: 'popular' } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'catalog', listKind: 'popular' } },
  ];
 
  protected readonly topRatedTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'catalog', listKind: 'top_rated' } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'catalog', listKind: 'top_rated' } },
  ];
 
  protected readonly upcomingTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'catalog', listKind: 'upcoming' } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'catalog', listKind: 'on_the_air' } },
  ];
 
  protected readonly devListTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'account', listKind: 'watchlist', page: 1 } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'account', listKind: 'watchlist', page: 1 } },
  ];
 
  protected readonly devListIITabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'account', listKind: 'watchlist', page: 2 } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'account', listKind: 'watchlist', page: 2 } },
  ];
 
  protected readonly nerdListTabs: MovieRowTab[] = [
    { label: 'Movies', mediaType: 'movie', source: { kind: 'account', listKind: 'favorite', page: 1 } },
    { label: 'TV Shows', mediaType: 'tv', source: { kind: 'account', listKind: 'favorite', page: 1 } },
  ];
 
  private readonly trending = httpResource<TmdbTrendingResponse>(
    () => `${environment.linkUrl}/trending/all/day`
  );
 
  protected readonly slides = computed<HeroSlide[]>(() => {
    const results = this.trending.value()?.results ?? [];
 
    return results
      .filter((item) => item.media_type !== 'person' && item.backdrop_path)
      .slice(0, 11)
      .map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? '',
        overview: item.overview,
        backdropPath: item.backdrop_path,
        genre: this.genreName(item),
        certification: null,
        mediaType: item.media_type as 'movie' | 'tv',
      }));
  });
 
  private genreName(item: TmdbMediaItem): string {
    const map = item.media_type === 'tv' ? TV_GENRES : MOVIE_GENRES;
    return map[item.genre_ids[0]] ?? 'Trends';
  }
}