import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  CardKind,
  MediaKind,
  MovieCardItem,
  TmdbGenreListResponse,
  TmdbLists,
  TmdbListResponse,
  TmdbPersonListResponse,
} from '../services/lists.service';
import { MovieCard } from '../components/movieCard';
import { SelectDropdown } from '../components/selectdropdown';

interface Tab {
  label: string;
  type: CardKind;
  path: string;
}

interface Option {
  label: string;
  value: string;
}

const TABS: Tab[] = [
  { label: 'Movies', type: 'movie', path: '/movies' },
  { label: 'TV Shows', type: 'tv', path: '/tv' },
  { label: 'People', type: 'person', path: '/people' },
];

const WATCH_PROVIDERS: Option[] = [
  { label: 'Any Platform', value: '' },
  { label: 'Netflix', value: '8' },
  { label: 'Prime Video', value: '119' },
  { label: 'Disney+', value: '337' },
  { label: 'Max', value: '1899' },
  { label: 'Apple TV+', value: '350' },
];

const RATING_OPTIONS: Option[] = [
  { label: 'Any Rating', value: '' },
  { label: '9+', value: '9' },
  { label: '8+', value: '8' },
  { label: '7+', value: '7' },
  { label: '6+', value: '6' },
];

@Component({
  selector: 'app-browse',
  imports: [MovieCard, SelectDropdown],
  template: `
    <div class="mx-auto max-w-6xl px-6 pt-28 pb-16 sm:pt-32">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          @if (q(); as q) {
            <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Search results</p>
            <h1 class="mt-1 font-display text-2xl font-extrabold tracking-tight text-chalk sm:text-3xl">"{{ q }}"</h1>
          } @else {
            <h1 class="font-display text-2xl font-extrabold tracking-tight text-chalk sm:text-3xl">{{ browseTitle() }}</h1>
          }
        </div>

        <div class="flex items-center gap-1 rounded-full border border-chalk/10 bg-surface/40 p-1" role="tablist" aria-label="Media type">
          @for (tab of tabs; track tab.type) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="tab.type === activeType()"
              (click)="selectType(tab)"
              class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
              [class]="tab.type === activeType() ? 'bg-chalk text-ink-950' : 'text-chalk/70 hover:text-chalk'"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      @if (!q() && activeType() !== 'person') {
        <div class="mt-6 flex flex-wrap gap-2">
          <app-select-dropdown
            label="Sort by"
            [options]="sortOptions()"
            [value]="sortBy()"
            (valueChange)="sortBy.set($event)"
          />

          <app-select-dropdown
            label="Genre"
            [options]="genreOptions()"
            [value]="genreId()"
            (valueChange)="genreId.set($event)"
          />

          <app-select-dropdown
            label="Where to watch"
            [options]="watchProviders"
            [value]="watchProviderId()"
            (valueChange)="watchProviderId.set($event)"
          />

          <app-select-dropdown
            label="Minimum rating"
            [options]="ratingOptions"
            [value]="minRating()"
            (valueChange)="minRating.set($event)"
          />

          @if (hasActiveFilters()) {
            <button
              type="button"
              (click)="clearFilters()"
              class="rounded-full px-4 py-2 text-sm font-semibold text-chalk/60 underline underline-offset-4 hover:text-chalk"
            >
              Clear filters
            </button>
          }
        </div>
      }

      @if (items().length === 0 && resource.isLoading()) {
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5">
          @for (i of skeletonSlots; track i) {
            <div aria-hidden="true">
              <div class="skeleton aspect-2/3 w-full rounded-2xl bg-chalk/10"></div>
              <div class="skeleton mt-3 h-6 w-14 rounded-full bg-chalk/10"></div>
              <div class="skeleton mt-2 h-10 w-3/4 rounded bg-chalk/10"></div>
            </div>
          }
        </div>
      } @else if (items().length === 0) {
        <p class="mt-10 text-sm text-chalk/60">
          @if (q()) {
            No results for "{{ q() }}". Try a different search.
          } @else {
            No results match these filters.
          }
        </p>
      } @else {
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5">
          @for (item of items(); track item.mediaType + '-' + item.id) {
            <app-movie-card [item]="item" />
          }
        </div>

        @if (hasMore()) {
          <div class="mt-10 flex justify-center">
            <button
              type="button"
              (click)="loadMore()"
              [disabled]="resource.isLoading()"
              class="rounded-full border border-chalk/20 px-6 py-2.5 text-sm font-semibold text-chalk transition-colors hover:border-chalk/40 disabled:opacity-50"
            >
              {{ resource.isLoading() ? 'Loading…' : 'Load more' }}
            </button>
          </div>
        }
      }

      @if (resource.error() && items().length === 0) {
        <p class="mt-10 text-sm text-chalk/60">Couldn't load results right now.</p>
      }
    </div>
  `,
  styles: `
    @keyframes shimmer {
      0%,
      100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }

    .skeleton {
      animation: shimmer 1.4s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
      }
    }
  `,
})
export class Browse {
  private readonly lists = inject(TmdbLists);
  private readonly router = inject(Router);

  readonly routeType = input<CardKind>();
  readonly q = input<string>('');

  protected readonly tabs = TABS;
  protected readonly activeType = computed<CardKind>(() => this.routeType() ?? 'movie');

  protected readonly browseTitle = computed(() => {
    const label = this.tabs.find((t) => t.type === this.activeType())?.label ?? 'Movies';
    return `Popular ${label}`;
  });

  protected readonly sortOptions = computed<Option[]>(() => {
    const dateField = this.activeType() === 'tv' ? 'first_air_date' : 'primary_release_date';
    return [
      { label: 'Most Popular', value: 'popularity.desc' },
      { label: 'Highest Rated', value: 'vote_average.desc' },
      { label: 'Newest', value: `${dateField}.desc` },
      { label: 'Oldest', value: `${dateField}.asc` },
      { label: 'Most Voted', value: 'vote_count.desc' },
    ];
  });

  protected readonly watchProviders = WATCH_PROVIDERS;
  protected readonly ratingOptions = RATING_OPTIONS;

  protected readonly sortBy = signal('popularity.desc');
  protected readonly genreId = signal('');
  protected readonly watchProviderId = signal('');
  protected readonly minRating = signal('');

  protected readonly hasActiveFilters = computed(
    () => this.sortBy() !== 'popularity.desc' || !!this.genreId() || !!this.watchProviderId() || !!this.minRating()
  );

  protected clearFilters(): void {
    this.sortBy.set('popularity.desc');
    this.genreId.set('');
    this.watchProviderId.set('');
    this.minRating.set('');
  }

  protected readonly genresResource = httpResource<TmdbGenreListResponse>(() => {
    const type = this.activeType();
    return type === 'person' ? undefined : this.lists.genreListUrl(type as MediaKind);
  });

  protected readonly genres = computed(() => this.genresResource.value()?.genres ?? []);

  protected readonly genreOptions = computed<Option[]>(() => [
    { label: 'Any Genre', value: '' },
    ...this.genres().map((genre) => ({ label: genre.name, value: String(genre.id) })),
  ]);

  protected readonly skeletonSlots = Array.from({ length: 10 }, (_, i) => i);

  protected readonly page = signal(1);

  protected readonly resource = httpResource<TmdbListResponse | TmdbPersonListResponse>(() => {
    const type = this.activeType();
    const q = this.q();
    const p = this.page();

    if (q) {
      return this.lists.searchUrl(type, q, p);
    }

    if (type === 'person') {
      return this.lists.browseUrl('person', p);
    }

    return this.lists.discoverUrl(type, {
      sortBy: this.sortBy(),
      genreId: this.genreId() ? Number(this.genreId()) : undefined,
      watchProviderId: this.watchProviderId() ? Number(this.watchProviderId()) : undefined,
      minRating: this.minRating() ? Number(this.minRating()) : undefined,
    }, p);
  });

  private readonly accumulated = signal<MovieCardItem[]>([]);
  protected readonly items = computed(() => this.accumulated());

  protected readonly hasMore = computed(() => {
    const value = this.resource.value();
    return value ? this.page() < value.total_pages : false;
  });

  constructor() {
    effect(() => {
      this.q();
      this.activeType();
      this.sortBy();
      this.genreId();
      this.watchProviderId();
      this.minRating();
      untracked(() => {
        this.page.set(1);
        this.accumulated.set([]);
      });
    });

    effect(() => {
      const value = this.resource.value();
      const type = this.activeType();
      if (!value) return;

      const newItems =
        type === 'person' ? this.lists.toPersonCardItems(value as TmdbPersonListResponse) : this.lists.toCardItems(value as TmdbListResponse, type);

      untracked(() => {
        this.accumulated.update((current) => (this.page() === 1 ? newItems : [...current, ...newItems]));
      });
    });
  }

  protected selectType(tab: Tab): void {
    this.router.navigate([tab.path], { queryParamsHandling: 'preserve' });
  }

  protected loadMore(): void {
    this.page.update((p) => p + 1);
  }
}