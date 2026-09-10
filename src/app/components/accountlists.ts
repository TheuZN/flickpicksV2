import { Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { TmdbCustomListsResponse, TmdbLists } from '../services/lists.service';

@Component({
  selector: 'app-account-lists',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-extrabold tracking-tight text-chalk sm:text-3xl">My Lists</h1>
        <p class="mt-1 text-sm text-chalk/50">Movies only — TMDB's custom-list feature predates TV support.</p>
      </div>

      <button
        type="button"
        (click)="creating.set(!creating())"
        class="rounded-full bg-chalk px-5 py-2 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02]"
      >
        {{ creating() ? 'Cancel' : 'New list' }}
      </button>
    </div>

    @if (creating()) {
      <form (submit)="submitNewList($event)" class="mt-6 flex flex-col gap-3 rounded-2xl border border-chalk/10 p-5">
        <input
          [ngModel]="newListName()"
          (ngModelChange)="newListName.set($event)"
          name="name"
          type="text"
          placeholder="List name"
          required
          class="rounded-xl border border-chalk/15 bg-transparent px-4 py-2.5 text-sm text-chalk placeholder:text-chalk/40 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
        />
        <textarea
          [ngModel]="newListDescription()"
          (ngModelChange)="newListDescription.set($event)"
          name="description"
          rows="2"
          placeholder="Description (optional)"
          class="resize-none rounded-xl border border-chalk/15 bg-transparent px-4 py-2.5 text-sm text-chalk placeholder:text-chalk/40 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
        ></textarea>
        <button
          type="submit"
          [disabled]="creatingStatus() === 'saving' || !newListName().trim()"
          class="self-start rounded-full bg-chalk px-5 py-2 text-sm font-bold text-ink-950 disabled:opacity-50"
        >
          {{ creatingStatus() === 'saving' ? 'Creating…' : 'Create list' }}
        </button>
        @if (creatingStatus() === 'error') {
          <p class="text-xs text-chalk/50">Couldn't create the list right now.</p>
        }
      </form>
    }

    @if (lists().length === 0 && resource.isLoading()) {
      <p class="mt-10 text-sm text-chalk/60">Loading your lists…</p>
    } @else if (lists().length === 0) {
      <p class="mt-10 text-sm text-chalk/60">You haven't created any lists yet.</p>
    } @else {
      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        @for (list of lists(); track list.id) {
          <a
            [routerLink]="['/account/lists', list.id]"
            class="block rounded-2xl border border-chalk/10 p-5 transition-colors hover:border-chalk/25"
          >
            <p class="font-bold text-chalk">{{ list.name }}</p>
            @if (list.description) {
              <p class="mt-1 line-clamp-2 text-sm text-chalk/60">{{ list.description }}</p>
            }
            <p class="mt-3 text-xs font-semibold tracking-[0.1em] text-muted uppercase">
              {{ list.item_count }} {{ list.item_count === 1 ? 'title' : 'titles' }}
            </p>
          </a>
        }
      </div>
    }
  `,
})
export class AccountLists {
  private readonly auth = inject(AuthService);
  private readonly lists_ = inject(TmdbLists);
  private readonly router = inject(Router);

  protected readonly page = signal(1);

  protected readonly resource = httpResource<TmdbCustomListsResponse>(() => {
    if (!this.auth.isAuthenticated()) {
      return undefined;
    }
    const url = this.lists_.myCustomListsUrl(this.page());
    return url || undefined;
  });

  protected readonly lists = computed(() => this.resource.value()?.results ?? []);

  protected readonly creating = signal(false);
  protected readonly creatingStatus = signal<'idle' | 'saving' | 'error'>('idle');
  protected readonly newListName = signal('');
  protected readonly newListDescription = signal('');

  protected submitNewList(event: Event): void {
    event.preventDefault();
    const name = this.newListName().trim();
    if (!name) {
      return;
    }

    this.creatingStatus.set('saving');
    this.lists_.createCustomList(name, this.newListDescription().trim()).subscribe({
      next: ({ list_id }) => {
        this.creatingStatus.set('idle');
        this.creating.set(false);
        this.newListName.set('');
        this.newListDescription.set('');
        this.router.navigate(['/account/lists', list_id]);
      },
      error: () => this.creatingStatus.set('error'),
    });
  }
}