import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { MovieCardItem, TmdbLists, TmdbListResponse } from '../services/lists.service';

interface Genre {
  id: number;
  label: string;
}

interface CarouselCard {
  offset: number;
  item: MovieCardItem;
  isCenter: boolean;
}

const GENRES: Genre[] = [
  { id: 28, label: 'Action' },
  { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' },
  { id: 27, label: 'Horror' },
  { id: 10749, label: 'Romance' },
  { id: 878, label: 'Sci-Fi' },
  { id: 16, label: 'Animation' },
];

const POSITION_STYLES: Record<number, string> = {
  [-2]: 'hidden sm:block w-24 md:w-36 opacity-30 blur-[1px] scale-90 z-0 -mr-6 md:-mr-10',
  [-1]: 'w-28 sm:w-36 md:w-48 opacity-70 scale-95 z-10 -mr-5 sm:-mr-8 md:-mr-10',
  [0]: 'w-40 sm:w-52 md:w-64 opacity-100 scale-100 z-20',
  [1]: 'w-28 sm:w-36 md:w-48 opacity-70 scale-95 z-10 -ml-5 sm:-ml-8 md:-ml-10',
  [2]: 'hidden sm:block w-24 md:w-36 opacity-30 blur-[1px] scale-90 z-0 -ml-6 md:-ml-10',
};

@Component({
  selector: 'app-genre-carousel',
  template: `
    <section class="mx-auto mt-30 mb-17 max-w-6xl overflow-hidden px-4 text-center">
      <h2 class="mt-2 font-display text-3xl font-extrabold tracking-tight text-chalk md:text-4xl">
        Explore by Category
      </h2>

      <div class="mt-9 flex flex-wrap items-center justify-center gap-2 px-2">
        @for (genre of genres; track genre.id) {
          <button
            type="button"
            (click)="selectGenre(genre)"
            [attr.aria-pressed]="genre.id === activeGenre().id"
            class="rounded-full border px-4 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none md:px-5 md:text-sm"
            [class]="
              genre.id === activeGenre().id
                ? 'border-chalk bg-chalk text-ink-950'
                : 'border-chalk/15 text-chalk/70 hover:border-chalk/40 hover:text-chalk'
            "
          >
            {{ genre.label }}
          </button>
        }
      </div>

      <div
        class="carousel-fade relative mt-10 flex h-[280px] w-full max-w-full items-center justify-center sm:h-[320px] md:mt-14 md:h-[380px]"
        [class.carousel-fade--dim]="resource.isLoading() && items().length > 0"
      >
        <div class="flex w-full items-center justify-center">
          @for (card of visibleCards(); track card.item.id) {
            <div
              (click)="selectCard(card)"
              class="aspect-2/3 shrink-0 cursor-pointer transition-all duration-300"
              [class]="positionClasses(card.offset)"
            >
              <div class="relative size-full">
                @if (posterUrl(card.item); as url) {
                  <img
                    [src]="url"
                    [alt]="''"
                    aria-hidden="true"
                    class="size-full rounded-xl object-cover shadow-lg md:rounded-2xl"
                  />
                } @else {
                  <div class="grid size-full place-items-center rounded-xl bg-chalk/10 text-xs text-muted md:rounded-2xl">
                    Sem imagem
                  </div>
                }

                @if (card.isCenter) {
                  <span
                    class="absolute inset-x-3 bottom-3 rounded-lg bg-[#08080a]/70 px-3 py-2 text-left text-xs font-medium text-[#f5f4f2] backdrop-blur-sm"
                  >
                    {{ card.item.title }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <div class="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          (click)="prev()"
          aria-label="Anterior"
          class="grid size-10 place-items-center rounded-full border border-chalk/15 text-chalk/70 transition-colors hover:border-chalk hover:bg-chalk hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m15 19-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          (click)="next()"
          aria-label="Próximo"
          class="grid size-10 place-items-center rounded-full border border-chalk/15 text-chalk/70 transition-colors hover:border-chalk hover:bg-chalk hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  `,
  styles: `
    .carousel-fade {
      transition:
        opacity 0.35s ease-out,
        filter 0.35s ease-out;
    }

    .carousel-fade--dim {
      opacity: 0.35;
      filter: blur(2px);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .carousel-fade {
        transition: none;
      }
    }
  `,
})
export class Categories {
  private readonly lists = inject(TmdbLists);
  private readonly router = inject(Router);

  protected readonly genres = GENRES;
  protected readonly activeGenre = signal(GENRES[0]);
  protected readonly activeIndex = signal(0);

  protected readonly resource = httpResource<TmdbListResponse>(() =>
    this.lists.discoverByGenreUrl('movie', this.activeGenre().id)
  );

  protected readonly items = linkedSignal<TmdbListResponse | undefined, MovieCardItem[]>({
    source: () => this.resource.value(),
    computation: (value, previous) => {
      if (value) {
        return this.lists.toCardItems(value, 'movie');
      }
      return previous?.value ?? [];
    },
  });

  protected readonly visibleCards = computed<CarouselCard[]>(() => {
    const list = this.items();
    if (list.length === 0) {
      return [];
    }

    return [-2, -1, 0, 1, 2].map((offset) => {
      const index = this.mod(this.activeIndex() + offset, list.length);
      return { offset, item: list[index], isCenter: offset === 0 };
    });
  });

  protected selectGenre(genre: Genre): void {
    this.activeGenre.set(genre);
    this.activeIndex.set(0);
  }

  protected positionClasses(offset: number): string {
    return POSITION_STYLES[offset];
  }

  protected posterUrl(item: MovieCardItem): string | null {
    return item.posterPath ? `${environment.linkImageUrl}${item.posterPath}` : null;
  }

  protected selectCard(card: CarouselCard): void {
    if (!card.isCenter) {
      this.activeIndex.set(this.mod(this.activeIndex() + card.offset, this.items().length));
      return;
    }
    this.router.navigate(['/movie', card.item.id]);
  }

  protected next(): void {
    this.activeIndex.update((i) => this.mod(i + 1, this.items().length));
  }

  protected prev(): void {
    this.activeIndex.update((i) => this.mod(i - 1, this.items().length));
  }

  protected viewMore(): void {
    this.router.navigate(['/movies'], { queryParams: { genre: this.activeGenre().id } });
  }

  private mod(n: number, m: number): number {
    return ((n % m) + m) % m;
  }
}