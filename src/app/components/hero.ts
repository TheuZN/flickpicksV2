import { Component, computed, input, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
 
 
export interface HeroSlide {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  overview: string;
  backdropPath: string | null;
  genre: string;
  certification: string | null;
}
 
export interface TmdbTrendingResponse {
  page: number;
  results: TmdbMediaItem[];
  total_results: number;
}
 
export interface TmdbMediaItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
}
 
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
 
@Component({
  selector: 'app-hero',
  imports: [RouterLink, TitleCasePipe],
  standalone: true,
  template: `
    <section
        class="relative flex min-h-[90svh] items-end overflow-hidden bg-[#08080a] sm:min-h-[100svh]"
        (keydown)="onKeydown($event)"
        tabindex="0"
        aria-roledescription="carrossel"
        [attr.aria-label]="current() ? 'Destaque: ' + current()!.title : 'Carregando destaque'"
    >
    @if (current(); as movie) {
    @if (backdropUrl(); as url) {
    <img
        [src]="url"
        [alt]="''"
        aria-hidden="true"
        class="absolute inset-0 size-full object-cover object-center"
        fetchpriority="high"
    />
    }
 
    <div class="absolute inset-0 bg-linear-to-r from-[#08080a] via-[#08080a]/70 to-transparent" aria-hidden="true"></div>
    <div class="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-[#08080a] to-transparent" aria-hidden="true"></div>
 
    <div class="relative mx-auto w-full max-w-6xl px-6 pb-16 sm:pb-24">
    <div class="max-w-xl">
        <h1
          class="flex min-h-[2lh] items-end break-words font-display text-4xl leading-[0.95] font-extrabold tracking-[0.02em] uppercase text-[#f5f4f2] sm:text-7xl sm:leading-[0.92] sm:tracking-[0.1em]"
        >
          {{ movie.title }}
        </h1>
 
        <div class="mt-4 flex flex-wrap items-center gap-2.5">
        <span class="text-sm text-[#f5f4f2]/85">{{ movie.genre }} • {{ movie.mediaType | titlecase }}</span>
        @if (movie.certification) {
            <span class="rounded border border-[#f5f4f2]/40 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#f5f4f2]/85">
            {{ movie.certification }}
            </span>
        }
        </div>
 
        <p class="mt-4 line-clamp-3 break-words text-base leading-relaxed text-[#f5f4f2]/75">
        {{ movie.overview }}
        </p>
 
        <a
        [routerLink]="['/movie', movie.id]"
        class="mt-7 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/15 px-7 py-3 text-sm font-semibold text-[#f5f4f2] backdrop-blur-md transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
        View details
        </a>
    </div>
 
    @if (slides().length > 1) {
        <div class="mt-10 flex items-center gap-2" role="tablist" aria-label="Escolher destaque">
        @for (slide of slides(); track slide.id; let i = $index) {
            <button
            type="button"
            role="tab"
            (click)="goTo(i)"
            [attr.aria-selected]="i === index()"
            [attr.aria-label]="slide.title"
            class="h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            [class]="i === index() ? 'w-7 bg-[#f5f4f2]' : 'w-1.5 bg-[#f5f4f2]/35 hover:bg-[#f5f4f2]/60'"
            ></button>
        }
        </div>
    }
    </div>
    } @else {
      <div class="absolute inset-0 animate-pulse bg-[#0e0e11]" aria-hidden="true"></div>
    }
</section>
  `
})
export class Hero {
  readonly slides = input.required<HeroSlide[]>();
 
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.slides()[this.index()] ?? null);
  protected readonly backdropUrl = computed(() => {
    const path = this.current()?.backdropPath;
    return path ? `${BACKDROP_BASE}${path}` : null;
  });
 
  constructor() {
    effect((onCleanup) => {
      if (this.slides().length <= 1) return;
 
      const timer = setInterval(() => this.next(), 5000);
      onCleanup(() => clearInterval(timer));
    });
  }
 
  protected goTo(i: number): void {
    this.index.set(i);
  }
 
  protected next(): void {
    this.index.update((i) => (i + 1) % this.slides().length);
  }
 
  protected previous(): void {
    this.index.update((i) => (i - 1 + this.slides().length) % this.slides().length);
  }
 
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.next();
    else if (event.key === 'ArrowLeft') this.previous();
  }
}