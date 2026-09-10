import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

const IMAGE_W185 = 'https://image.tmdb.org/t/p/w185';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Watchlist', path: '/account/watchlist' },
  { label: 'Favorites', path: '/account/favorites' },
  { label: 'Ratings', path: '/account/ratings' },
  { label: 'My Lists', path: '/account/lists' },
];

@Component({
  selector: 'app-account-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.isAuthenticated()) {
      <div class="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-28 pb-16 lg:flex-row lg:pt-32">
        <aside class="shrink-0 lg:w-56">
          @if (auth.account(); as account) {
            <div class="flex items-center gap-3">
              @if (avatarUrl(); as url) {
                <img [src]="url" [alt]="''" aria-hidden="true" class="size-11 rounded-full object-cover" />
              } @else {
                <div class="grid size-11 place-items-center rounded-full bg-chalk/10 text-sm font-bold text-chalk">
                  {{ account.username.charAt(0).toUpperCase() }}
                </div>
              }
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-chalk">{{ account.name || account.username }}</p>
                <p class="truncate text-xs text-chalk/50">&#64;{{ account.username }}</p>
              </div>
            </div>
          }

          <nav class="scroll-row mt-6 flex gap-1 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible" aria-label="Account">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-chalk !text-ink-950 font-semibold"
                class="shrink-0 rounded-full px-4 py-2 text-sm text-chalk/70 transition-colors hover:text-chalk lg:rounded-xl lg:px-3.5"
              >
                {{ item.label }}
              </a>
            }
          </nav>

          <button
            type="button"
            (click)="auth.logout()"
            class="mt-6 block text-sm font-semibold text-chalk/50 transition-colors hover:text-chalk"
          >
            Log out
          </button>
        </aside>

        <div class="min-w-0 flex-1">
          <router-outlet />
        </div>
      </div>
    } @else {
      <div class="mx-auto max-w-md px-6 pt-32 pb-24 text-center">
        <p class="text-sm text-chalk/60">You need to log in to see your account.</p>
        <a
          routerLink="/login"
          class="mt-4 inline-block rounded-full bg-chalk px-6 py-2.5 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02]"
        >
          Log in
        </a>
      </div>
    }
  `,
  styles: `
    .scroll-row {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .scroll-row::-webkit-scrollbar {
      display: none;
    }
  `,
})
export class AccountShell {
  protected readonly auth = inject(AuthService);
  protected readonly navItems = NAV_ITEMS;

  protected readonly avatarUrl = computed(() => {
    const path = this.auth.account()?.avatarPath;
    return path ? `${IMAGE_W185}${path}` : null;
  });
}