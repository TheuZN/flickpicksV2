import { Component, computed, inject, input, linkedSignal, signal, effect, viewChild, ElementRef, HostListener } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MovieCard } from '../components/movieCard';
import { ListSource, MediaKind, MovieCardItem, TmdbLists, TmdbListResponse } from '../services/lists.service';

export interface MovieRowTab {
  label: string;
  mediaType: MediaKind;
  source: ListSource;
}

@Component({
  selector: 'app-movie-row',
  imports: [MovieCard],
  template: `
    <section class="py-15">
      <div class="mx-auto max-w-6xl px-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-display text-2xl font-extrabold tracking-tight text-chalk">{{ title() }}</h2>

          @if (tabs().length > 1) {
            <div
              class="flex items-center gap-1 rounded-full border border-chalk/10 bg-surface/40 p-1"
              role="tablist"
              [attr.aria-label]="title()"
            >
              @for (tab of tabs(); track tab.label; let i = $index) {
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="i === activeIndex()"
                  (click)="activeIndex.set(i)"
                  class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
                  [class]="i === activeIndex() ? 'bg-chalk text-ink-950' : 'text-chalk/70 hover:text-chalk'"
                >
                  {{ tab.label }}
                </button>
              }
            </div>
          }
        </div>

        <div
          #scrollRow
          class="row-fade scroll-row snap-x snap-mandatory scroll-smooth mt-5 flex gap-4 overflow-x-auto pb-2"
          [class.row-fade--dim]="isDimmed()"
          (scroll)="onRowScroll()"
          role="list"
        >
          @if (displayItems().length > 0) {
            @for (item of displayItems(); track item.id) {
              <div role="listitem" class="snap-start">
                <app-movie-card [item]="item" />
              </div>
            }
          } @else if (resource.isLoading()) {
            @for (i of skeletonSlots; track i) {
              <div class="w-40 shrink-0 sm:w-48" role="listitem" aria-hidden="true">
                <div class="rounded-2xl bg-chalk/5 p-3">
                  <div class="skeleton aspect-2/3 w-full rounded-xl bg-chalk/10"></div>
                </div>
                <div class="skeleton mt-3 h-6 w-14 rounded-full bg-chalk/10"></div>
                <div class="skeleton mt-2 h-10 w-3/4 rounded bg-chalk/10"></div>
              </div>
            }
          } @else if (resource.error()) {
            <p class="text-sm text-chalk/75">Não deu pra carregar "{{ title() }}" agora.</p>
          }
        </div>

        @if (pageCount() > 1) {
          <div class="mt-4 flex items-center justify-center gap-3 sm:justify-between">
            <div class="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                (click)="scrollByPage(-1)"
                aria-label="Previous"
                class="grid size-9 place-items-center rounded-full border border-chalk/15 text-chalk/70 transition-colors hover:border-chalk hover:bg-chalk hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m15 19-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                (click)="scrollByPage(1)"
                aria-label="Next"
                class="grid size-9 place-items-center rounded-full border border-chalk/15 text-chalk/70 transition-colors hover:border-chalk hover:bg-chalk hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <div class="flex items-center gap-2" role="tablist" aria-label="Scroll position">
              @for (i of pageDots(); track i) {
                <button
                  type="button"
                  role="tab"
                  (click)="goToPage(i)"
                  [attr.aria-selected]="i === activeIndexDot()"
                  [attr.aria-label]="'Page ' + (i + 1)"
                  class="h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
                  [class]="i === activeIndexDot() ? 'w-6 bg-chalk' : 'w-1.5 bg-chalk/30 hover:bg-chalk/50'"
                ></button>
              }
            </div>
          </div>
        }
      </div>
    </section>
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

    .row-fade {
      transition:
        opacity 0.35s ease-out,
        filter 0.35s ease-out;
    }

    .row-fade--dim {
      opacity: 0.35;
      filter: blur(2px);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
      }
      .row-fade {
        transition: none;
      }
    }

    .scroll-row {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .scroll-row::-webkit-scrollbar {
      display: none;
    }
  `,
})
export class MovieRow {
  private readonly lists = inject(TmdbLists);

  readonly title = input.required<string>();
  readonly tabs = input.required<MovieRowTab[]>();

  protected readonly activeIndex = signal(0);
  protected readonly activeTab = computed(() => this.tabs()[this.activeIndex()]);

  protected readonly skeletonSlots = Array.from({ length: 6 }, (_, i) => i);

  protected readonly resource = httpResource<TmdbListResponse>(() => {
    const tab = this.activeTab();
    return this.lists.listUrl(tab.mediaType, tab.source);
  });

  protected readonly processedItems = linkedSignal<TmdbListResponse | undefined, MovieCardItem[]>({
    source: () => this.resource.value(),
    computation: (value, previous) => {
      if (value) {
        return this.lists.toCardItems(value, this.activeTab().mediaType);
      }
      return previous?.value ?? [];
    },
  });

  protected readonly displayItems = signal<MovieCardItem[]>([]);
  protected readonly isDimmed = signal(false);

  constructor() {
    effect((onCleanup) => {
      const loading = this.resource.isLoading();
      const fetchedItems = this.processedItems();
      const currentDisplay = this.displayItems();

      if (loading && currentDisplay.length > 0) {
        this.isDimmed.set(true); 
      } 
      else if (!loading && currentDisplay !== fetchedItems) {
        
        if (currentDisplay.length > 0) {
          const timer = setTimeout(() => {
            this.displayItems.set(fetchedItems);
            this.isDimmed.set(false);
          }, 300);
          
          onCleanup(() => clearTimeout(timer));
        } else {
          this.displayItems.set(fetchedItems);
        }
      }
    });

    effect(() => {
      this.displayItems();
      requestAnimationFrame(() => this.onRowScroll());
    });
  }

  private readonly scrollRow = viewChild<ElementRef<HTMLDivElement>>('scrollRow');

  protected readonly pageCount = signal(1);
  protected readonly activeIndexDot = signal(0);
  protected readonly pageDots = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));

  @HostListener('window:resize')
  protected onRowScroll(): void {
    const el = this.scrollRow()?.nativeElement;
    if (!el || el.clientWidth === 0) {
      return;
    }

    const pages = this.computePageCount(el);
    const index = Math.round(el.scrollLeft / el.clientWidth);

    this.pageCount.set(pages);
    this.activeIndexDot.set(Math.min(index, pages - 1));
  }

  protected scrollByPage(direction: 1 | -1): void {
    const el = this.scrollRow()?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  }

  protected goToPage(index: number): void {
    const el = this.scrollRow()?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }

  private computePageCount(el: HTMLDivElement): number {
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow <= 4) {
      return 1;
    }
    return Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
  }
}