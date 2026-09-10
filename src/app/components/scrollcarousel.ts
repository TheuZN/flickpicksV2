import { Component, ElementRef, HostListener, computed, effect, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-scroll-carousel',
  template: `
    <div #scrollRow class="scroll-row snap-x snap-mandatory scroll-smooth flex gap-4 overflow-x-auto pb-2" (scroll)="onScroll()" role="list">
      <ng-content />
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
              [attr.aria-selected]="i === activeIndex()"
              [attr.aria-label]="'Page ' + (i + 1)"
              class="h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
              [class]="i === activeIndex() ? 'w-6 bg-chalk' : 'w-1.5 bg-chalk/30 hover:bg-chalk/50'"
            ></button>
          }
        </div>
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
export class ScrollCarousel {
  readonly count = input<number>(0);

  private readonly scrollRow = viewChild<ElementRef<HTMLDivElement>>('scrollRow');

  protected readonly pageCount = signal(1);
  protected readonly activeIndex = signal(0);
  protected readonly pageDots = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));

  @HostListener('window:resize')
  protected onScroll(): void {
    const el = this.scrollRow()?.nativeElement;
    if (!el || el.clientWidth === 0) {
      return;
    }

    const pages = this.computePageCount(el);
    const index = Math.round(el.scrollLeft / el.clientWidth);

    this.pageCount.set(pages);
    this.activeIndex.set(Math.min(index, pages - 1));
  }

  private computePageCount(el: HTMLDivElement): number {
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow <= 4) {
      return 1;
    }
    return Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
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

  constructor() {
    effect(() => {
      this.count();
      requestAnimationFrame(() => this.onScroll());
    });
  }
}