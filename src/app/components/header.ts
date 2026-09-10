import { Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Logo } from './logo';
import { ThemeService } from '../services/theme.service';
 
export interface NavItem {
  label: string;
  path: string;
}
 
@Component({
  selector: 'app-header',
  imports: [Logo, RouterLink, RouterLinkActive],
  standalone: true,
  template: `
    <header [class]="headerClass()">
        <nav
            [class]="navClass()"
            aria-label="Principal"
        >
 
        <app-logo/>
 
        <ul class="ml-1 hidden items-center gap-0.5 sm:flex">
            @for (item of navItems; track item.path) {
                <li>
                  <a
                        [routerLink]="item.path"
                        queryParamsHandling="preserve"
                        routerLinkActive="bg-chalk !text-ink-950 font-semibold"
                        class="block rounded-full px-4 py-2 text-sm text-chalk/75 transition-colors hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none"
                    >
                        {{ item.label }}
                    </a>
                </li>
            }
        </ul>
 
        <div class="ml-auto flex items-center gap-1">
            <div
                class="hidden overflow-hidden transition-[width,opacity] duration-300 ease-out sm:block"
                [class.sm:w-0]="!searchOpen()"
                [class.sm:opacity-0]="!searchOpen()"
                [class.sm:w-52]="searchOpen()"
                [class.sm:opacity-100]="searchOpen()"
            >
                <input
                #searchInput
                type="search"
                placeholder="Search"
                [value]="query()"
                (input)="onQueryInput($event)"
                (keydown.enter)="submitSearch()"
                (keydown)="onSearchKeydown($event)"
                [attr.tabindex]="searchOpen() ? 0 : -1"
                class="w-full bg-transparent px-3 py-2 text-sm text-chalk placeholder:text-muted focus:outline-none"
                aria-label="Search"
                />
            </div>
 
            <button
                type="button"
                (click)="toggleSearch()"
                [attr.aria-expanded]="searchOpen()"
                [attr.aria-label]="searchOpen() ? 'Fechar busca' : 'Abrir busca'"
                class="grid size-9 shrink-0 place-items-center rounded-full text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none"
            >
                <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" />
                <path d="m16.2 16.2 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
            </button>
 
            <button
                type="button"
                (click)="theme.toggle()"
                [attr.aria-label]="theme.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
                class="grid size-9 shrink-0 place-items-center rounded-full text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none"
            >
                <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                @if (theme.theme() === 'dark') {
                    <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8" />
                    <path
                        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.55 1.55M7.15 16.85l-1.55 1.55M18.4 18.4l-1.55-1.55M7.15 7.15 5.6 5.6"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                } @else {
                    <path
                        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />
                }
                </svg>
            </button>

            <a
                routerLink="/account"
                aria-label="Sua conta"
                class="grid size-9 shrink-0 place-items-center rounded-full text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none mr-1"
            >
                <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" stroke-width="1.8" />
                    <path d="M4.8 19.2c1.1-3.3 3.9-5.2 7.2-5.2s6.1 1.9 7.2 5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
            </a>

            <button
                type="button"
                (click)="toggleMenu()"
                [attr.aria-expanded]="menuOpen()"
                aria-label="Abrir menu"
                class="grid size-9 shrink-0 place-items-center rounded-full text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none sm:hidden"
            >
                <svg class="size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                @if (menuOpen()) {
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                } @else {
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                }
                </svg>
            </button>
        </div>
        </nav>
 
        @if (searchOpen()) {
        <div class="absolute inset-x-4 top-20 flex items-center gap-2 rounded-2xl border border-chalk/10 bg-surface/80 px-4 py-3 backdrop-blur-2xl sm:hidden">
          <svg class="size-[18px] shrink-0 text-chalk/60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" />
            <path d="m16.2 16.2 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            autofocus
            [value]="query()"
            (input)="onQueryInput($event)"
            (keydown.enter)="submitSearch()"
            (keydown)="onSearchKeydown($event)"
            class="w-full bg-transparent text-sm text-chalk placeholder:text-muted focus:outline-none"
            aria-label="Search"
          />
          <button
            type="button"
            (click)="toggleSearch()"
            aria-label="Fechar busca"
            class="grid size-6 shrink-0 place-items-center rounded-full text-chalk/60 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk/70 focus-visible:outline-none"
          >
            <svg class="size-[14px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      }
 
        @if (menuOpen()) {
            <ul
            class="absolute top-20 left-4 right-4 rounded-2xl border border-chalk/10 bg-surface/80 p-2 backdrop-blur-2xl sm:hidden"
            >
            @for (item of navItems; track item.path) {
                <li>
                <a
                    [routerLink]="item.path"
                    queryParamsHandling="preserve"
                    routerLinkActive="bg-chalk/10 text-chalk"
                    (click)="toggleMenu()"
                    class="block rounded-xl px-4 py-3 text-sm text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk"
                >
                    {{ item.label }}
                </a>
                </li>
            }
            </ul>
        }
    </header>
  `
})
export class Header {
  private readonly router = inject(Router);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly theme = inject(ThemeService);
 
  protected readonly navItems: NavItem[] = [
    { label: 'Movies', path: '/movies' },
    { label: 'TV Shows', path: '/tv' },
    { label: 'People', path: '/people' },
  ];
 
  protected readonly searchOpen = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly query = signal('');
 
  protected readonly scrolled = signal(false);
 
  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }
 
  protected readonly headerClass = computed(() =>
    this.scrolled()
      ? 'fixed inset-x-0 top-0 z-50 flex justify-center bg-surface/70 backdrop-blur-xl shadow-lg shadow-black/20 transition-[background-color,backdrop-filter,box-shadow,padding] duration-200 ease-out'
      : 'fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 transition-[background-color,backdrop-filter,box-shadow,padding] duration-200 ease-out'
  );
 
  protected readonly navClass = computed(() =>
    this.scrolled()
      ? 'mx-auto flex w-full max-w-6xl items-center gap-1 px-6 py-3 transition-[max-width,border-radius,background-color,padding] duration-200 ease-out'
      : 'flex w-full max-w-3xl items-center gap-1 rounded-full border border-chalk/10 bg-surface/40 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-2xl transition-[max-width,border-radius,background-color,padding] duration-200 ease-out'
  );
 
  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
 
  protected submitSearch(): void {
    const term = this.query().trim();
    if (!term) {
      return;
    }
 
    this.router.navigate(['/search'], { queryParams: { q: term } });
    this.searchOpen.set(false);
    this.menuOpen.set(false);
    this.query.set('');
  }
 
  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.searchOpen.set(false);
      this.query.set('');
    }
  }
 
  protected toggleSearch(): void {
    const next = !this.searchOpen();
    this.searchOpen.set(next);
    this.menuOpen.set(false);
 
    if (next) {
      requestAnimationFrame(() => this.searchInput()?.nativeElement.focus());
    } else {
      this.query.set('');
    }
  }
 
  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.searchOpen.set(false);
  }
}