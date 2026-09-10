import { Component, computed, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MovieCardItem, TmdbCustomListDetail, TmdbLists } from '../services/lists.service';
import { MovieCard } from '../components/movieCard';
import { ConfirmDialog } from '../components/confirmdialog';

@Component({
  selector: 'app-account-list-detail',
  imports: [MovieCard, RouterLink, ConfirmDialog],
  template: `
    <a routerLink="/account/lists" class="text-sm font-semibold text-chalk/60 hover:text-chalk">← My Lists</a>

    @if (list(); as l) {
      <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold tracking-tight text-chalk sm:text-3xl">{{ l.name }}</h1>
          @if (l.description) {
            <p class="mt-2 text-sm text-chalk/60">{{ l.description }}</p>
          }
        </div>
        <button
          type="button"
          (click)="pendingDeleteList.set(true)"
          class="rounded-full border border-chalk/20 px-4 py-2 text-sm font-semibold text-chalk/70 transition-colors hover:border-chalk/40 hover:text-chalk"
        >
          Delete list
        </button>
      </div>

      @if (items().length === 0) {
        <p class="mt-10 text-sm text-chalk/60">No titles in this list yet.</p>
      } @else {
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          @for (item of items(); track item.id) {
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
      }
    } @else if (resource.isLoading()) {
      <p class="mt-10 text-sm text-chalk/60">Loading…</p>
    } @else if (resource.error()) {
      <p class="mt-10 text-sm text-chalk/60">Couldn't load this list.</p>
    }

    @if (pendingRemove(); as item) {
      <app-confirm-dialog
        [message]="confirmMessage(item.title)"
        (confirm)="confirmRemove(item.id)"
        (cancel)="pendingRemove.set(null)"
      />
    }

    @if (pendingDeleteList()) {
      <app-confirm-dialog
        [message]="deleteListMessage()"
        (confirm)="confirmDeleteList()"
        (cancel)="pendingDeleteList.set(false)"
      />
    }
  `,
})
export class AccountListDetail {
  private readonly lists = inject(TmdbLists);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly resource = httpResource<TmdbCustomListDetail>(() => this.lists.customListDetailsUrl(Number(this.id())));

  protected readonly list = computed(() => this.resource.value());

  private readonly removedIds = signal<Set<number>>(new Set());

  protected readonly items = computed<MovieCardItem[]>(() =>
    (this.list()?.items ?? [])
      .filter((item) => !this.removedIds().has(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? '',
        posterPath: item.poster_path,
        voteAverage: item.vote_average,
        mediaType: 'movie',
      }))
  );

  protected readonly pendingRemove = signal<MovieCardItem | null>(null);

  protected confirmMessage(title: string): string {
    return `Remove "${title}" from this list?`;
  }

  protected confirmRemove(movieId: number): void {
    this.lists.removeFromCustomList(Number(this.id()), movieId).subscribe({
      next: () => {
        this.removedIds.update((current) => new Set(current).add(movieId));
        this.pendingRemove.set(null);
      },
    });
  }

  protected readonly pendingDeleteList = signal(false);

  protected readonly deleteListMessage = computed(() => {
    const name = this.list()?.name ?? 'this list';
    return `Delete "${name}"? This can't be undone.`;
  });

  protected confirmDeleteList(): void {
    this.lists.deleteCustomList(Number(this.id())).subscribe({
      next: () => this.router.navigate(['/account/lists']),
    });
  }
}