import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { MediaKind, MovieCardItem, TmdbLists, TmdbListResponse, TmdbRatedResponse } from '../services/lists.service';
import { MovieCard } from '../components/movieCard';
import { ConfirmDialog } from '../components/confirmdialog';

type Kind = 'watchlist' | 'favorite' | 'rated';

const TITLES: Record<Kind, string> = {
  watchlist: 'My Watchlist',
  favorite: 'My Favorites',
  rated: 'My Ratings',
};

@Component({
  selector: 'app-account-media',
  imports: [MovieCard, ConfirmDialog],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="font-display text-2xl font-extrabold tracking-tight text-chalk sm:text-3xl">{{ title() }}</h1>

      <div class="flex items-center gap-1 rounded-full border border-chalk/10 bg-surface/40 p-1" role="tablist" aria-label="Media type">
        @for (option of mediaTypes; track option) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="option === mediaType()"
            (click)="mediaType.set(option)"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
            [class]="option === mediaType() ? 'bg-chalk text-ink-950' : 'text-chalk/70 hover:text-chalk'"
          >
            {{ option === 'movie' ? 'Movies' : 'TV Shows' }}
          </button>
        }
      </div>
    </div>

    @if (items().length === 0 && resource.isLoading()) {
      <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        @for (i of skeletonSlots; track i) {
          <div aria-hidden="true">
            <div class="skeleton aspect-2/3 w-full rounded-2xl bg-chalk/10"></div>
            <div class="skeleton mt-3 h-6 w-14 rounded-full bg-chalk/10"></div>
            <div class="skeleton mt-2 h-10 w-3/4 rounded bg-chalk/10"></div>
          </div>
        }
      </div>
    } @else if (items().length === 0) {
      <p class="mt-10 text-sm text-chalk/60">Nothing here yet.</p>
    } @else {
      <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        @for (item of items(); track item.mediaType + '-' + item.id) {
          <div>
            <app-movie-card [item]="item" [compact]="true" />
            <button
              type="button"
              (click)="pendingRemove.set(item)"
              class="mt-1 text-xs font-semibold text-chalk/50 transition-colors hover:text-chalk"
            >
              Remove
            </button>
          </div>
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

    @if (pendingRemove(); as item) {
      <app-confirm-dialog
        [message]="confirmMessage(item.title)"
        (confirm)="confirmRemove(item)"
        (cancel)="pendingRemove.set(null)"
      />
    }
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
export class AccountMedia {
  private readonly auth = inject(AuthService);
  private readonly lists = inject(TmdbLists);

  readonly kind = input.required<Kind>();

  protected readonly title = computed(() => TITLES[this.kind()]);
  protected readonly mediaTypes: MediaKind[] = ['movie', 'tv'];
  protected readonly mediaType = signal<MediaKind>('movie');

  protected readonly skeletonSlots = Array.from({ length: 10 }, (_, i) => i);
  protected readonly page = signal(1);

  protected readonly resource = httpResource<TmdbListResponse | TmdbRatedResponse>(() => {
    if (!this.auth.isAuthenticated()) {
      return undefined;
    }
    const url = this.lists.myMediaUrl(this.kind(), this.mediaType(), this.page());
    return url || undefined;
  });

  private readonly accumulated = signal<MovieCardItem[]>([]);
  protected readonly items = computed(() => this.accumulated());

  protected readonly hasMore = computed(() => {
    const value = this.resource.value();
    return value ? this.page() < value.total_pages : false;
  });

  constructor() {
    effect(() => {
      this.kind();
      this.mediaType();
      untracked(() => {
        this.page.set(1);
        this.accumulated.set([]);
      });
    });

    effect(() => {
      const value = this.resource.value();
      const kind = this.kind();
      const type = this.mediaType();
      if (!value) {
        return;
      }

      const newItems =
        kind === 'rated' ? this.lists.toRatedCardItems(value as TmdbRatedResponse, type) : this.lists.toCardItems(value as TmdbListResponse, type);

      untracked(() => {
        this.accumulated.update((current) => (this.page() === 1 ? newItems : [...current, ...newItems]));
      });
    });
  }

  protected loadMore(): void {
    this.page.update((p) => p + 1);
  }

  protected readonly pendingRemove = signal<MovieCardItem | null>(null);

  protected confirmMessage(title: string): string {
    if (this.kind() === 'rated') {
      return `Remove your rating for "${title}"?`;
    }
    const list = this.kind() === 'watchlist' ? 'watchlist' : 'favorites';
    return `Remove "${title}" from your ${list}?`;
  }

  protected confirmRemove(item: MovieCardItem): void {
    const mediaType = item.mediaType as MediaKind;

    const request$ =
      this.kind() === 'rated'
        ? this.lists.deleteRating(mediaType, item.id)
        : this.kind() === 'watchlist'
          ? this.lists.addToWatchlist(mediaType, item.id, false)
          : this.lists.addToFavorites(mediaType, item.id, false);

    request$.subscribe({
      next: () => {
        this.accumulated.update((current) => current.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType)));
        this.pendingRemove.set(null);
      },
    });
  }
}