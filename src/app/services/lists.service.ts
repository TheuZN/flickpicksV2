import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface GuestSession {
  success: boolean;
  guest_session_id: string;
  expires_at: string;
}

export interface AccountStates {
  id: number;
  favorite: boolean;
  watchlist: boolean;
  rated: false | { value: number };
}

export interface TmdbReview {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: { rating: number | null; avatar_path: string | null };
}

export type MediaKind = 'movie' | 'tv';

export type ListKind = 'now_playing' | 'popular' | 'top_rated' | 'upcoming' | 'airing_today' | 'on_the_air';

export type AccountListKind = 'watchlist' | 'favorite';

export type ListSource =
  | { kind: 'catalog'; listKind: ListKind }
  | { kind: 'account'; listKind: AccountListKind; page?: number }
  | { kind: 'similar'; id: number };

export interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

export interface TmdbListResponse {
  page: number;
  results: TmdbListItem[];
  total_pages: number;
}

export interface TmdbPersonListItem {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
}

export interface TmdbPersonListResponse {
  page: number;
  results: TmdbPersonListItem[];
  total_pages: number;
}

export type CardKind = MediaKind | 'person';

export interface MovieCardItem {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage?: number;
  mediaType: CardKind;
  subtitle?: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreListResponse {
  genres: TmdbGenre[];
}

export interface DiscoverFilters {
  sortBy?: string;
  genreId?: number;
  watchProviderId?: number;
  minRating?: number;
}

export interface TmdbRatedItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  rating: number;
}

export interface TmdbRatedResponse {
  page: number;
  results: TmdbRatedItem[];
  total_pages: number;
}

export interface TmdbCustomList {
  id: number;
  name: string;
  description: string;
  item_count: number;
  poster_path: string | null;
}

export interface TmdbCustomListsResponse {
  page: number;
  results: TmdbCustomList[];
  total_pages: number;
}

export interface TmdbCustomListDetail {
  id: number;
  name: string;
  description: string;
  items: TmdbListItem[];
}

@Service()
export class TmdbLists {

  private readonly accountId = 20162127;

  listUrl(mediaType: MediaKind, source: ListSource): string {
    if (source.kind === 'account') {
      const page = source.page ?? 1;
      const segment = mediaType === 'movie' ? 'movies' : 'tv';
      return `${environment.linkUrl}/account/${this.accountId}/${source.listKind}/${segment}?language=en&page=${page}&sort_by=created_at.asc`;
    }

    if (source.kind === 'similar') {
      return `${environment.linkUrl}/${mediaType}/${source.id}/similar?language=en&page=1`;
    }

    return `${environment.linkUrl}/${mediaType}/${source.listKind}?language=en&page=1`;
  }

  discoverByGenreUrl(mediaType: MediaKind, genreId: number, page = 1): string {
    return `${environment.linkUrl}/discover/${mediaType}?with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&language=en&page=${page}`;
  }

  browseUrl(mediaType: CardKind, page = 1): string {
    const endpoint = mediaType === 'person' ? 'person/popular' : `${mediaType}/popular`;
    return `${environment.linkUrl}/${endpoint}?language=en-US&page=${page}`;
  }

  searchUrl(mediaType: CardKind, query: string, page = 1): string {
    return `${environment.linkUrl}/search/${mediaType}?query=${encodeURIComponent(query)}&language=en-US&page=${page}`;
  }

  toCardItems(response: TmdbListResponse | undefined, mediaType: MediaKind): MovieCardItem[] {
    return (response?.results ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? '',
      posterPath: item.poster_path,
      voteAverage: item.vote_average,
      mediaType,
    }));
  }

  toPersonCardItems(response: TmdbPersonListResponse | undefined): MovieCardItem[] {
    return (response?.results ?? []).map((person) => ({
      id: person.id,
      title: person.name,
      posterPath: person.profile_path,
      mediaType: 'person',
      subtitle: person.known_for_department,
    }));
  }

  genreListUrl(mediaType: MediaKind): string {
    return `${environment.linkUrl}/genre/${mediaType}/list?language=en-US`;
  }

  discoverUrl(mediaType: MediaKind, filters: DiscoverFilters, page = 1): string {
    const params = new URLSearchParams({
      language: 'en-US',
      page: String(page),
      sort_by: filters.sortBy ?? 'popularity.desc',
    });

    if (filters.genreId) {
      params.set('with_genres', String(filters.genreId));
    }
    if (filters.watchProviderId) {
      params.set('with_watch_providers', String(filters.watchProviderId));
      params.set('watch_region', 'US');
    }
    if (filters.minRating) {
      params.set('vote_average.gte', String(filters.minRating));
      params.set('vote_count.gte', '50');
    }

    return `${environment.linkUrl}/discover/${mediaType}?${params.toString()}`;
  }

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  addToWatchlist(mediaType: MediaKind, id: number, add: boolean) {
    const session = this.auth.sessionId();
    const accountId = this.auth.account()?.id;
    if (!session || !accountId) {
      return throwError(() => new NotAuthenticatedError());
    }

    return this.http.post(`${environment.linkUrl}/account/${accountId}/watchlist?session_id=${session}`, {
      media_type: mediaType,
      media_id: id,
      watchlist: add,
    });
  }

  addToFavorites(mediaType: MediaKind, id: number, add: boolean) {
    const session = this.auth.sessionId();
    const accountId = this.auth.account()?.id;
    if (!session || !accountId) {
      return throwError(() => new NotAuthenticatedError());
    }

    return this.http.post(`${environment.linkUrl}/account/${accountId}/favorite?session_id=${session}`, {
      media_type: mediaType,
      media_id: id,
      favorite: add,
    });
  }

  createGuestSession() {
    return this.http.get<GuestSession>(`${environment.linkUrl}/authentication/guest_session/new`);
  }

  rate(mediaType: MediaKind, id: number, value: number, sessionOrGuestId: string, isGuest: boolean) {
    const param = isGuest ? 'guest_session_id' : 'session_id';
    return this.http.post(`${environment.linkUrl}/${mediaType}/${id}/rating?${param}=${sessionOrGuestId}`, {
      value,
    });
  }

  myMediaUrl(kind: 'watchlist' | 'favorite' | 'rated', mediaType: MediaKind, page = 1): string {
    const accountId = this.auth.account()?.id;
    const session = this.auth.sessionId();
    if (!accountId || !session) {
      return '';
    }
    const segment = mediaType === 'movie' ? 'movies' : 'tv';
    return `${environment.linkUrl}/account/${accountId}/${kind}/${segment}?language=en-US&page=${page}&session_id=${session}`;
  }

  toRatedCardItems(response: TmdbRatedResponse | undefined, mediaType: MediaKind): MovieCardItem[] {
    return (response?.results ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? '',
      posterPath: item.poster_path,
      voteAverage: item.rating,
      mediaType,
    }));
  }

  myCustomListsUrl(page = 1): string {
    const accountId = this.auth.account()?.id;
    const session = this.auth.sessionId();
    if (!accountId || !session) {
      return '';
    }
    return `${environment.linkUrl}/account/${accountId}/lists?language=en-US&page=${page}&session_id=${session}`;
  }

  customListDetailsUrl(listId: number): string {
    const session = this.auth.sessionId();
    return `${environment.linkUrl}/list/${listId}?language=en-US${session ? `&session_id=${session}` : ''}`;
  }

  createCustomList(name: string, description: string) {
    const session = this.auth.sessionId();
    if (!session) {
      return throwError(() => new NotAuthenticatedError());
    }
    return this.http.post<{ success: boolean; list_id: number }>(`${environment.linkUrl}/list?session_id=${session}`, {
      name,
      description,
      language: 'en',
    });
  }

  addToCustomList(listId: number, movieId: number) {
    const session = this.auth.sessionId();
    if (!session) {
      return throwError(() => new NotAuthenticatedError());
    }
    return this.http.post(`${environment.linkUrl}/list/${listId}/add_item?session_id=${session}`, {
      media_id: movieId,
    });
  }

  removeFromCustomList(listId: number, movieId: number) {
    const session = this.auth.sessionId();
    if (!session) {
      return throwError(() => new NotAuthenticatedError());
    }
    return this.http.post(`${environment.linkUrl}/list/${listId}/remove_item?session_id=${session}`, {
      media_id: movieId,
    });
  }

  deleteCustomList(listId: number) {
    const session = this.auth.sessionId();
    if (!session) {
      return throwError(() => new NotAuthenticatedError());
    }
    return this.http.delete(`${environment.linkUrl}/list/${listId}?session_id=${session}`);
  }

  accountStatesUrl(mediaType: MediaKind, id: number): string {
    const session = this.auth.sessionId();
    if (!session) {
      return '';
    }
    return `${environment.linkUrl}/${mediaType}/${id}/account_states?session_id=${session}`;
  }

  deleteRating(mediaType: MediaKind, id: number) {
    const session = this.auth.sessionId();
    if (!session) {
      return throwError(() => new NotAuthenticatedError());
    }
    return this.http.delete(`${environment.linkUrl}/${mediaType}/${id}/rating?session_id=${session}`);
  }
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super('Not authenticated');
  }
}