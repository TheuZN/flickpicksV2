import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { MovieCardItem } from '../services/lists.service';

@Component({
  selector: 'app-movie-card',
  imports: [RouterLink],
  template: `
    <a [routerLink]="linkPath()" class="group block w-40 shrink-0 sm:w-48">
      @if (isPerson()) {
        <div class="mx-auto w-28 overflow-hidden rounded-full bg-chalk/5 p-2 sm:w-32">
          @if (posterUrl(); as url) {
            <img
              [src]="url"
              [alt]="''"
              aria-hidden="true"
              loading="lazy"
              (load)="loaded.set(true)"
              class="aspect-square w-full rounded-full object-cover transition-opacity duration-500 ease-out"
              [class.opacity-0]="!loaded()"
              [class.opacity-100]="loaded()"
            />
          } @else {
            <div class="grid aspect-square w-full place-items-center rounded-full bg-chalk/10 text-xs text-muted">No photo</div>
          }
        </div>
      } @else {
        <div class="overflow-hidden rounded-2xl bg-chalk/5 p-3">
          @if (posterUrl(); as url) {
            <img
              [src]="url"
              [alt]="''"
              aria-hidden="true"
              loading="lazy"
              (load)="loaded.set(true)"
              class="aspect-2/3 w-full rounded-xl object-cover transition-[opacity,transform] duration-400 ease-out group-hover:scale-[0.93]"
              [class.opacity-0]="!loaded()"
              [class.opacity-100]="loaded()"
            />
          } @else {
            <div class="flex aspect-2/3 w-full items-center justify-center rounded-xl bg-chalk/10 text-center text-xs text-muted">
              No image
            </div>
          }
        </div>
      }

      @if (item().voteAverage !== undefined) {
        <span class="mt-3 inline-block rounded-full bg-chalk px-3 py-1 text-xs font-extrabold text-ink-950">
          {{ item().voteAverage!.toFixed(1) }}
        </span>
      } @else if (item().subtitle; as subtitle) {
        <span
          class="mt-3 inline-block rounded-full bg-chalk/10 px-3 py-1 text-xs font-semibold text-chalk/70"
          [class.mx-auto]="isPerson()"
        >
          {{ subtitle }}
        </span>
      }

      <p class="mt-2 line-clamp-2 text-sm font-bold text-chalk" [class.min-h-10]="!compact()" [class.text-center]="isPerson()">
        {{ item().title }}
      </p>
    </a>
  `,
})
export class MovieCard {
  readonly item = input.required<MovieCardItem>();
  readonly compact = input(false);

  protected readonly loaded = signal(false);

  protected readonly isPerson = computed(() => this.item().mediaType === 'person');

  protected readonly posterUrl = computed(() => {
    const path = this.item().posterPath;
    return path ? `${environment.linkImageUrl}${path}` : null;
  });

  protected readonly linkPath = computed(() => {
    const item = this.item();
    return item.mediaType === 'person' ? ['/person', item.id] : ['/', item.mediaType === 'tv' ? 'tv' : 'movie', item.id];
  });
}