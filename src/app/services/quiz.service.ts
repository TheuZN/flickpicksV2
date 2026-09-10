import { Service, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
 
export interface QuizAnswers {
  genreIds: number[];
  afterYear: number | null;
  beforeYear: number | null;
  maxRuntime: number | null;
  watchProviderId: number | null;
}
 
export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}
 
export interface TmdbDiscoverResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}
 
const QUALITY_FLOOR = {
  'vote_average.gte': '6.5',
  'vote_count.gte': '300',
} as const;
 
@Service()
export class MovieQuizService {
  private readonly answers = signal<QuizAnswers | null>(null);
 
  private readonly discoverUrl = computed(() => {
    const a = this.answers();
    if (!a) {
      return undefined;
    }
 
    const params = new URLSearchParams({
      language: 'pt-BR',
      sort_by: 'popularity.desc',
      page: String(this.pickPage()),
      ...QUALITY_FLOOR,
    });
 
    if (a.genreIds.length) {
      params.set('with_genres', a.genreIds.join('|'));
    }
    if (a.afterYear) {
      params.set('primary_release_date.gte', `${a.afterYear}-01-01`);
    }
    if (a.beforeYear) {
      params.set('primary_release_date.lte', `${a.beforeYear}-12-31`);
    }
    if (a.maxRuntime) {
      params.set('with_runtime.lte', String(a.maxRuntime));
    }
    if (a.watchProviderId) {
      params.set('with_watch_providers', String(a.watchProviderId));
      params.set('watch_region', 'BR');
    }
 
    return `${environment.linkUrl}/discover/movie?${params.toString()}`;
  });
 
  readonly recommendations = httpResource<TmdbDiscoverResponse>(() => this.discoverUrl());
 
  submit(answers: QuizAnswers): void {
    this.answers.set(answers);
  }
 
  reset(): void {
    this.answers.set(null);
  }
 
  private pickPage(): number {
    return Math.floor(Math.random() * 5) + 1;
  }
}