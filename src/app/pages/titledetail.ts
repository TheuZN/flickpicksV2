import { Component, computed, effect, ElementRef, inject, input, signal, untracked, viewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { MediaKind } from '../services/lists.service';
import { MovieRow, MovieRowTab } from '../components/movieRow';
import { ScrollCarousel } from '../components/scrollcarousel';
import { AccountStates, GuestSession, TmdbCustomListsResponse, TmdbLists, TmdbReview } from '../services/lists.service';
import { AuthService } from '../services/auth.service';

interface Genre {
  id: number;
  name: string;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface VideoItem {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

interface ReleaseDateEntry {
  iso_3166_1: string;
  release_dates: { certification: string }[];
}

interface ContentRatingEntry {
  iso_3166_1: string;
  rating: string;
}

interface Creator {
  id: number;
  name: string;
}

interface BackdropImage {
  file_path: string;
}

interface TmdbTitleCore {
  id: number;
  title?: string;
  name?: string;
  tagline: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  genres: Genre[];
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  budget?: number;
  created_by?: Creator[];
}

interface TmdbTitleExtra {
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: VideoItem[] };
  images: { backdrops: BackdropImage[] };
  reviews: { results: TmdbReview[] };
  release_dates?: { results: ReleaseDateEntry[] };
  content_ratings?: { results: ContentRatingEntry[] };
}

const IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMAGE_W342 = 'https://image.tmdb.org/t/p/w342';
const IMAGE_W185 = 'https://image.tmdb.org/t/p/w185';
const GUEST_SESSION_KEY = 'tmdb-guest-session';

@Component({
  selector: 'app-title-detail',
  imports: [MovieRow, RouterLink, ScrollCarousel],
  template: `
    <section class="relative flex min-h-[85svh] items-end overflow-hidden bg-[#08080a]">
      @if (backdropUrl(); as url) {
        <img [src]="url" [alt]="''" aria-hidden="true" class="absolute inset-0 size-full object-cover object-bottom" fetchpriority="high" />
      } @else if (core.isLoading()) {
        <div class="absolute inset-0 animate-pulse bg-[#0e0e11]" aria-hidden="true"></div>
      }
      <div class="absolute inset-0 bg-linear-to-t from-[#08080a] via-[#08080a]/50 to-transparent" aria-hidden="true"></div>

      @if (movie(); as m) {
        <div class="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 sm:pb-14">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="font-display text-3xl font-extrabold tracking-tight text-[#f5f4f2] sm:text-5xl">
                {{ displayTitle() }}
                @if (year(); as y) {
                  <span class="font-sans text-xl font-normal text-[#f5f4f2]/50 sm:text-2xl">({{ y }})</span>
                }
              </h1>
              <p class="mt-2 text-sm text-[#f5f4f2]/70">{{ genreLabel() }}</p>
            </div>

            <span class="inline-block h-fit rounded-full bg-[#f5f4f2] px-4 py-1.5 text-sm font-extrabold text-[#08080a]">
              ★ {{ m.vote_average.toFixed(1) }}
            </span>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              (click)="toggleWatchlist()"
              [disabled]="watchlistStatus() === 'saving'"
              class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50"
              [class]="inWatchlist() ? 'border-white/15 bg-[#f5f4f2] text-[#08080a]' : 'border-white/25 bg-white/10 text-[#f5f4f2] hover:bg-white/20'"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              {{ inWatchlist() ? 'In Watchlist' : 'Add to Watchlist' }}
            </button>

            <button
              type="button"
              (click)="toggleFavorite()"
              [disabled]="favoriteStatus() === 'saving'"
              class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50"
              [class]="inFavorites() ? 'border-white/15 bg-[#f5f4f2] text-[#08080a]' : 'border-white/25 bg-white/10 text-[#f5f4f2] hover:bg-white/20'"
            >
              <svg class="size-4" viewBox="0 0 24 24" [attr.fill]="inFavorites() ? 'currentColor' : 'none'" aria-hidden="true">
                <path
                  d="M12 20.5s-7.5-4.6-9.8-9.1C.6 8 2.2 4.7 5.4 4.1c2-.4 3.9.5 5 2.1a1 1 0 0 0 1.6 0c1.1-1.6 3-2.5 5-2.1 3.2.6 4.8 3.9 3.2 7.3-2.3 4.5-9.8 9.1-9.8 9.1z"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
              </svg>
              {{ inFavorites() ? 'In Favorites' : 'Add to Favorites' }}
            </button>

            @if (mediaType() === 'movie' && auth.isAuthenticated()) {
              <div class="relative">
                <button
                  #listMenuButton
                  type="button"
                  (click)="toggleListMenu()"
                  [attr.aria-expanded]="listMenuOpen()"
                  class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-[#f5f4f2] backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  Add to a list
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>

                @if (listMenuOpen()) {
                  <div class="fixed inset-0 z-40" (click)="listMenuOpen.set(false)"></div>

                  <div
                    class="fixed z-50 w-56 rounded-2xl border border-white/15 bg-[#08080a]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                    [style.top.px]="listMenuPosition().top"
                    [style.left.px]="listMenuPosition().left"
                  >
                    @if (myLists().length === 0) {
                      <p class="px-3 py-2 text-xs text-[#f5f4f2]/50">You don't have any lists yet.</p>
                    } @else {
                      @for (list of myLists(); track list.id) {
                        <button
                          type="button"
                          (click)="addToList(list.id.toString()); listMenuOpen.set(false)"
                          class="block w-full rounded-xl px-3 py-2 text-left text-sm text-[#f5f4f2]/85 transition-colors hover:bg-white/10 hover:text-[#f5f4f2]"
                        >
                          {{ list.name }}
                        </button>
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>

          @if (addToListStatus() === 'saved') {
            <p class="mt-2 text-xs text-[#f5f4f2]/50">Added to your list.</p>
          }

          @if (actionError(); as err) {
            <p class="mt-2 text-xs text-[#f5f4f2]/50">{{ err }}</p>
          }
        </div>
      }
    </section>

    @if (movie(); as m) {
      <div class="mx-auto max-w-6xl px-6">
        <div class="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-chalk/10 py-5">
          @if (certification(); as cert) {
            <div>
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Rating</p>
              <p class="mt-1 text-sm font-bold text-chalk">{{ cert }}</p>
            </div>
          }
          @if (runtimeLabel(); as runtime) {
            <div>
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">
                {{ mediaType() === 'tv' ? 'Episode Runtime' : 'Running Time' }}
              </p>
              <p class="mt-1 text-sm font-bold text-chalk">{{ runtime }}</p>
            </div>
          }
          @if (budgetLabel(); as budget) {
            <div>
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Budget</p>
              <p class="mt-1 text-sm font-bold text-chalk">{{ budget }}</p>
            </div>
          }
          @if (releaseDateLabel(); as date) {
            <div>
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">
                {{ mediaType() === 'tv' ? 'First Aired' : 'Release Date' }}
              </p>
              <p class="mt-1 text-sm font-bold text-chalk">{{ date }}</p>
            </div>
          }
        </div>

        <div class="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-[220px_1fr]">
          <div class="overflow-hidden rounded-2xl bg-chalk/5 p-3">
            @if (posterUrl(); as url) {
              <img [src]="url" [alt]="''" aria-hidden="true" class="aspect-2/3 w-full rounded-xl object-cover" loading="lazy" />
            } @else {
              <div class="grid aspect-2/3 w-full place-items-center rounded-xl bg-chalk/10 text-xs text-muted">No image</div>
            }
          </div>

          <div>
            <div class="flex flex-wrap gap-x-12 gap-y-4">
              @if (director(); as name) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">
                    {{ mediaType() === 'tv' ? 'Creator' : 'Director' }}
                  </p>
                  <p class="mt-1 text-sm text-chalk">{{ name }}</p>
                </div>
              }
              @if (writers(); as names) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Writer</p>
                  <p class="mt-1 text-sm text-chalk">{{ names }}</p>
                </div>
              }
            </div>

            <div class="mt-6">
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Plot</p>
              <p class="mt-2 text-sm leading-relaxed text-chalk/80" [class.line-clamp-4]="!plotExpanded()">
                {{ m.overview }}
              </p>
              @if (m.overview.length > 220) {
                <button
                  type="button"
                  (click)="plotExpanded.set(!plotExpanded())"
                  class="mt-2 text-xs font-bold tracking-wide text-chalk uppercase underline underline-offset-4"
                >
                  {{ plotExpanded() ? 'Read less' : 'Read more' }}
                </button>
              }
            </div>

            <div class="mt-8">
              <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Your Rating</p>
              <div class="mt-2 flex flex-wrap items-center gap-1">
                @for (n of ratingScale; track n) {
                  <button
                    type="button"
                    (click)="rate(n)"
                    [disabled]="ratingStatus() === 'saving'"
                    [attr.aria-label]="'Rate ' + n + ' out of 10'"
                    class="grid size-7 place-items-center rounded text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none disabled:opacity-50"
                    [class]="n <= (myRating() ?? 0) ? 'bg-chalk text-ink-950' : 'bg-chalk/10 text-chalk/50 hover:bg-chalk/20'"
                  >
                    {{ n }}
                  </button>
                }
              </div>
              @if (ratingStatus() === 'saved') {
                <p class="mt-2 text-xs text-chalk/50">Saved as a guest rating on this device.</p>
              } @else if (ratingStatus() === 'error') {
                <p class="mt-2 text-xs text-chalk/50">Couldn't save your rating right now.</p>
              }
            </div>
          </div>
        </div>

        @if (trailerKey(); as key) {
          <div class="mt-14">
            <h2 class="font-display text-xl font-extrabold tracking-tight text-chalk">Trailer</h2>
            <div class="mt-4 aspect-video overflow-hidden rounded-2xl bg-chalk/5">
              @if (trailerStarted()) {
                <iframe
                  [src]="trailerEmbedUrl(key)"
                  class="size-full"
                  title="Trailer"
                  allow="accelerate-compute; autoplay; encrypted-media"
                  allowfullscreen
                ></iframe>
              } @else {
                <button type="button" (click)="trailerStarted.set(true)" class="group relative block size-full" aria-label="Play trailer">
                  @if (backdropUrl(); as url) {
                    <img [src]="url" [alt]="''" aria-hidden="true" class="size-full object-cover" loading="lazy" />
                  }
                  <span class="absolute inset-0 bg-[#08080a]/30 transition-colors group-hover:bg-[#08080a]/10"></span>
                  <span class="absolute inset-0 grid place-items-center">
                    <span class="grid size-16 place-items-center rounded-full bg-chalk/90 text-ink-950 shadow-xl transition-transform group-hover:scale-105">
                      <svg class="ml-1 size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </button>
              }
            </div>
          </div>
        }

        @if (m.tagline) {
          <blockquote class="mt-16 border-y border-chalk/10 py-10 text-center">
            <p class="font-display text-xl italic text-chalk/80 sm:text-2xl">"{{ m.tagline }}"</p>
          </blockquote>
        }

        @if (topCast().length > 0) {
          <div class="mt-14">
            <h2 class="font-display text-xl font-extrabold tracking-tight text-chalk">Cast</h2>
            <app-scroll-carousel [count]="topCast().length" class="mt-5 block">
              @for (person of topCast(); track person.id) {
                <a [routerLink]="['/person', person.id]" class="block w-24 shrink-0 snap-start text-center sm:w-28">
                  @if (profileUrl(person.profile_path); as url) {
                    <img [src]="url" [alt]="''" aria-hidden="true" class="aspect-square w-full rounded-full object-cover" loading="lazy" />
                  } @else {
                    <div class="grid aspect-square w-full place-items-center rounded-full bg-chalk/10 text-xs text-muted">
                      {{ person.name.charAt(0) }}
                    </div>
                  }
                  <p class="mt-2 line-clamp-1 text-xs font-bold text-chalk">{{ person.name }}</p>
                  <p class="line-clamp-1 text-[11px] text-chalk/50">{{ person.character }}</p>
                </a>
              }
            </app-scroll-carousel>
          </div>
        }

        @if (reviews().length > 0) {
          <div class="mt-14">
            <h2 class="font-display text-xl font-extrabold tracking-tight text-chalk">Reviews</h2>
            <div class="mt-5 flex flex-col gap-5">
              @for (review of reviews(); track review.id) {
                <div class="rounded-2xl border border-chalk/10 p-5">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-bold text-chalk">{{ review.author }}</p>
                    @if (review.author_details.rating; as rating) {
                      <span class="rounded-full bg-chalk/10 px-2.5 py-1 text-xs font-bold text-chalk">★ {{ rating }}/10</span>
                    }
                  </div>
                  <p class="mt-2 line-clamp-5 text-sm leading-relaxed text-chalk/70">{{ review.content }}</p>
                </div>
              }
            </div>
          </div>
        }

        @if (gallery().length > 0) {
          <div class="mt-14 mb-16">
            <h2 class="font-display text-xl font-extrabold tracking-tight text-chalk">Gallery</h2>
            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              @for (image of gallery(); track image.file_path; let i = $index) {
                <button type="button" (click)="openLightbox(i)" class="block overflow-hidden rounded-xl">
                  <img
                    [src]="imageThumbUrl(image.file_path)"
                    [alt]="''"
                    aria-hidden="true"
                    class="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (lightboxIndex(); as index) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-[#08080a]/90 p-6 backdrop-blur-sm"
          (click)="closeLightbox()"
        >
          <button
            type="button"
            (click)="closeLightbox()"
            aria-label="Close"
            class="absolute right-6 top-6 grid size-10 place-items-center rounded-full bg-chalk/10 text-chalk hover:bg-chalk/20"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>

          @if (index > 1) {
            <button
              type="button"
              (click)="stepLightbox(-1); $event.stopPropagation()"
              aria-label="Previous"
              class="absolute left-6 grid size-10 place-items-center rounded-full bg-chalk/10 text-chalk hover:bg-chalk/20"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m15 19-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          }
          @if (index < gallery().length) {
            <button
              type="button"
              (click)="stepLightbox(1); $event.stopPropagation()"
              aria-label="Next"
              class="absolute right-20 grid size-10 place-items-center rounded-full bg-chalk/10 text-chalk hover:bg-chalk/20"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          }

          <img
            [src]="imageOriginalUrl(gallery()[index - 1].file_path)"
            [alt]="''"
            aria-hidden="true"
            class="max-h-[85vh] max-w-full rounded-xl object-contain"
            (click)="$event.stopPropagation()"
          />
        </div>
      }

      <app-movie-row [title]="mediaType() === 'tv' ? 'Related Shows' : 'Related Movies'" [tabs]="similarTabs()" />
    } @else if (core.error()) {
      <p class="mx-auto max-w-6xl px-6 py-16 text-sm text-chalk/75">Couldn't load this title right now.</p>
    }
  `,
})
export class TitleDetail {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly lists = inject(TmdbLists);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  readonly mediaType = input<MediaKind>('movie');

  private readonly appendFields = computed(() =>
    this.mediaType() === 'tv' ? 'credits,videos,content_ratings,images,reviews' : 'credits,videos,release_dates,images,reviews'
  );

  protected readonly core = httpResource<TmdbTitleCore>(
    () => `${environment.linkUrl}/${this.mediaType()}/${this.id()}?language=en-US`
  );

  protected readonly extra = httpResource<TmdbTitleExtra>(
    () => `${environment.linkUrl}/${this.mediaType()}/${this.id()}?language=en-US&append_to_response=${this.appendFields()}`
  );

  protected readonly movie = computed(() => this.core.value());

  protected readonly plotExpanded = signal(false);
  protected readonly trailerStarted = signal(false);

  protected readonly displayTitle = computed(() => this.movie()?.title ?? this.movie()?.name ?? '');

  private readonly dateStr = computed(() => this.movie()?.release_date ?? this.movie()?.first_air_date ?? null);

  protected readonly year = computed(() => this.dateStr()?.slice(0, 4) || null);
  protected readonly genreLabel = computed(() => (this.movie()?.genres ?? []).map((g) => g.name).join(' | '));

  protected readonly backdropUrl = computed(() => {
    const path = this.movie()?.backdrop_path;
    return path ? `${IMAGE_ORIGINAL}${path}` : null;
  });

  protected readonly posterUrl = computed(() => {
    const path = this.movie()?.poster_path;
    return path ? `${environment.linkImageUrl}${path}` : null;
  });

  protected readonly director = computed(() => {
    const m = this.movie();
    if (!m) return null;

    if (this.mediaType() === 'tv') {
      const creators = m.created_by ?? [];
      return creators.length > 0 ? creators.map((c) => c.name).join(', ') : null;
    }

    return this.extra.value()?.credits.crew.find((c) => c.job === 'Director')?.name ?? null;
  });

  protected readonly writers = computed(() => {
    const crew = this.extra.value()?.credits.crew ?? [];
    const names = crew.filter((c) => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story').map((c) => c.name);
    const unique = Array.from(new Set(names)).slice(0, 3);
    return unique.length > 0 ? unique.join(', ') : null;
  });

  protected readonly topCast = computed(() => (this.extra.value()?.credits.cast ?? []).slice(0, 12));

  protected readonly reviews = computed(() => (this.extra.value()?.reviews.results ?? []).slice(0, 6));

  protected readonly trailerKey = computed(() => {
    const videos = this.extra.value()?.videos.results ?? [];
    const youtube = videos.filter((v) => v.site === 'YouTube');
    const trailer = youtube.find((v) => v.type === 'Trailer' && v.official) ?? youtube.find((v) => v.type === 'Trailer') ?? youtube[0];
    return trailer?.key ?? null;
  });

  protected readonly certification = computed(() => {
    const extra = this.extra.value();
    if (!extra) return null;

    if (this.mediaType() === 'tv') {
      const results = extra.content_ratings?.results ?? [];
      const br = results.find((r) => r.iso_3166_1 === 'BR')?.rating;
      const us = results.find((r) => r.iso_3166_1 === 'US')?.rating;
      return br || us || null;
    }

    const results = extra.release_dates?.results ?? [];
    const br = results.find((r) => r.iso_3166_1 === 'BR')?.release_dates.find((d) => d.certification)?.certification;
    const us = results.find((r) => r.iso_3166_1 === 'US')?.release_dates.find((d) => d.certification)?.certification;
    return br || us || null;
  });

  protected readonly runtimeLabel = computed(() => {
    const m = this.movie();
    const minutes = this.mediaType() === 'tv' ? m?.episode_run_time?.[0] : m?.runtime;
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const min = minutes % 60;
    return h > 0 ? `${h}h ${min}min` : `${min}min`;
  });

  protected readonly budgetLabel = computed(() => {
    const budget = this.mediaType() === 'movie' ? this.movie()?.budget : null;
    return budget ? `$${budget.toLocaleString('en-US')}` : null;
  });

  protected readonly releaseDateLabel = computed(() => {
    const date = this.dateStr();
    if (!date) return null;
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  });

  protected readonly gallery = computed(() => (this.extra.value()?.images.backdrops ?? []).slice(0, 8));

  protected readonly similarTabs = computed<MovieRowTab[]>(() => [
    { label: 'Similar', mediaType: this.mediaType(), source: { kind: 'similar', id: Number(this.id()) } },
  ]);

  protected readonly inWatchlist = signal(false);
  protected readonly inFavorites = signal(false);
  protected readonly watchlistStatus = signal<'idle' | 'saving' | 'error'>('idle');
  protected readonly favoriteStatus = signal<'idle' | 'saving' | 'error'>('idle');
  protected readonly actionError = signal<string | null>(null);

  private readonly accountStates = httpResource<AccountStates>(() => {
    if (!this.auth.isAuthenticated()) {
      return undefined;
    }
    const url = this.lists.accountStatesUrl(this.mediaType(), Number(this.id()));
    return url || undefined;
  });

  constructor() {
    effect(() => {
      const states = this.accountStates.value();
      if (!states) {
        return;
      }
      untracked(() => {
        this.inWatchlist.set(states.watchlist);
        this.inFavorites.set(states.favorite);
        if (states.rated) {
          this.myRating.set(states.rated.value);
        }
      });
    });
  }

  private readonly myListsResource = httpResource<TmdbCustomListsResponse>(() => {
    if (!this.auth.isAuthenticated() || this.mediaType() !== 'movie') {
      return undefined;
    }
    const url = this.lists.myCustomListsUrl();
    return url || undefined;
  });

  protected readonly myLists = computed(() => this.myListsResource.value()?.results ?? []);
  protected readonly addToListStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  protected readonly listMenuOpen = signal(false);
  protected readonly listMenuPosition = signal({ top: 0, left: 0 });
  private readonly listMenuButton = viewChild<ElementRef<HTMLButtonElement>>('listMenuButton');

  protected toggleListMenu(): void {
    const next = !this.listMenuOpen();
    if (next) {
      const rect = this.listMenuButton()?.nativeElement.getBoundingClientRect();
      if (rect) {
        this.listMenuPosition.set({ top: rect.bottom + 8, left: rect.left });
      }
    }
    this.listMenuOpen.set(next);
  }

  protected addToList(listId: string): void {
    if (!listId) {
      return;
    }
    this.addToListStatus.set('saving');
    this.lists.addToCustomList(Number(listId), Number(this.id())).subscribe({
      next: () => this.addToListStatus.set('saved'),
      error: () => this.addToListStatus.set('error'),
    });
  }

  protected toggleWatchlist(): void {
    if (!this.auth.isAuthenticated()) {
      this.actionError.set('Log in to add titles to your watchlist.');
      return;
    }

    const next = !this.inWatchlist();
    this.watchlistStatus.set('saving');
    this.actionError.set(null);
    this.lists.addToWatchlist(this.mediaType(), Number(this.id()), next).subscribe({
      next: () => {
        this.inWatchlist.set(next);
        this.watchlistStatus.set('idle');
      },
      error: () => {
        this.watchlistStatus.set('error');
        this.actionError.set("Couldn't update your watchlist right now.");
      },
    });
  }

  protected toggleFavorite(): void {
    if (!this.auth.isAuthenticated()) {
      this.actionError.set('Log in to add titles to your favorites.');
      return;
    }

    const next = !this.inFavorites();
    this.favoriteStatus.set('saving');
    this.actionError.set(null);
    this.lists.addToFavorites(this.mediaType(), Number(this.id()), next).subscribe({
      next: () => {
        this.inFavorites.set(next);
        this.favoriteStatus.set('idle');
      },
      error: () => {
        this.favoriteStatus.set('error');
        this.actionError.set("Couldn't update your favorites right now.");
      },
    });
  }

  protected readonly ratingScale = Array.from({ length: 10 }, (_, i) => i + 1);
  protected readonly myRating = signal<number | null>(null);
  protected readonly ratingStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  protected rate(value: number): void {
    this.ratingStatus.set('saving');

    const realSession = this.auth.sessionId();
    if (realSession) {
      this.submitRating(value, realSession, false);
      return;
    }

    this.withGuestSession((guestSessionId) => this.submitRating(value, guestSessionId, true));
  }

  private submitRating(value: number, sessionOrGuestId: string, isGuest: boolean): void {
    this.lists.rate(this.mediaType(), Number(this.id()), value, sessionOrGuestId, isGuest).subscribe({
      next: () => {
        this.myRating.set(value);
        this.ratingStatus.set('saved');
      },
      error: () => this.ratingStatus.set('error'),
    });
  }

  private withGuestSession(then: (guestSessionId: string) => void): void {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (stored) {
      then(stored);
      return;
    }

    this.lists.createGuestSession().subscribe({
      next: (session: GuestSession) => {
        localStorage.setItem(GUEST_SESSION_KEY, session.guest_session_id);
        then(session.guest_session_id);
      },
      error: () => this.ratingStatus.set('error'),
    });
  }

  protected readonly lightboxIndex = signal<number | null>(null);

  protected openLightbox(index: number): void {
    this.lightboxIndex.set(index + 1);
  }

  protected closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  protected stepLightbox(delta: number): void {
    this.lightboxIndex.update((current) => {
      if (current === null) return null;
      const next = current + delta;
      return next < 1 || next > this.gallery().length ? current : next;
    });
  }

  protected profileUrl(path: string | null): string | null {
    return path ? `${IMAGE_W185}${path}` : null;
  }

  protected imageThumbUrl(path: string): string {
    return `${IMAGE_W342}${path}`;
  }

  protected imageOriginalUrl(path: string): string {
    return `${IMAGE_ORIGINAL}${path}`;
  }

  protected trailerEmbedUrl(key: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${key}?autoplay=1`);
  }
}