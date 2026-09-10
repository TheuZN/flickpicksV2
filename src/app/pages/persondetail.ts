import { Component, computed, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MovieCard } from '../components/movieCard';
import { ScrollCarousel } from '../components/scrollcarousel';
import { MediaKind, MovieCardItem } from '../services/lists.service';

interface CombinedCreditItem {
  id: number;
  media_type: MediaKind;
  title?: string;
  name?: string;
  character?: string;
  poster_path: string | null;
  vote_average: number;
  popularity: number;
  release_date?: string;
  first_air_date?: string;
}

interface ExternalIds {
  instagram_id: string | null;
  tiktok_id: string | null;
  twitter_id: string | null;
  youtube_id: string | null;
  facebook_id: string | null;
}

interface TmdbPersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  combined_credits: { cast: CombinedCreditItem[] };
  external_ids: ExternalIds;
}

const IMAGE_PROFILE = 'https://image.tmdb.org/t/p/w500';

const GENDER_LABELS: Record<number, string> = {
  1: 'Female',
  2: 'Male',
  3: 'Non-binary',
};

@Component({
  selector: 'app-person-detail',
  imports: [MovieCard, ScrollCarousel],
  template: `
    @if (person(); as p) {
      <div class="mx-auto max-w-6xl px-6 pt-28 pb-12 sm:pt-32">
        <div class="grid grid-cols-1 gap-10 sm:grid-cols-[260px_1fr]">
          <div>
            <div class="overflow-hidden rounded-2xl bg-chalk/5 p-3">
              @if (profileUrl(); as url) {
                <img [src]="url" [alt]="''" aria-hidden="true" class="aspect-2/3 w-full rounded-xl object-cover" loading="lazy" />
              } @else {
                <div class="grid aspect-2/3 w-full place-items-center rounded-xl bg-chalk/10 text-xs text-muted">No photo</div>
              }
            </div>

            @if (socialLinks().length > 0) {
              <div class="mt-4 flex items-center gap-2">
                @for (social of socialLinks(); track social.label) {
                  <a
                    [href]="social.href"
                    [attr.aria-label]="social.label"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="grid size-9 place-items-center rounded-full text-chalk/70 transition-colors hover:bg-chalk/10 hover:text-chalk"
                  >
                    <svg class="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path [attr.d]="social.path" />
                    </svg>
                  </a>
                }
              </div>
            }

            <div class="mt-6 flex flex-col gap-5">
              <div>
                <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Known For</p>
                <p class="mt-1 text-sm text-chalk">{{ p.known_for_department }}</p>
              </div>

              @if (genderLabel(); as gender) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Gender</p>
                  <p class="mt-1 text-sm text-chalk">{{ gender }}</p>
                </div>
              }

              @if (birthdayLabel(); as birthday) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">
                    {{ p.deathday ? 'Born' : 'Birthday' }}
                  </p>
                  <p class="mt-1 text-sm text-chalk">{{ birthday }}</p>
                </div>
              }

              @if (p.deathday) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Died</p>
                  <p class="mt-1 text-sm text-chalk">{{ deathdayLabel() }}</p>
                </div>
              }

              @if (p.place_of_birth) {
                <div>
                  <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Place of Birth</p>
                  <p class="mt-1 text-sm text-chalk">{{ p.place_of_birth }}</p>
                </div>
              }

              <div>
                <p class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Known Credits</p>
                <p class="mt-1 text-sm text-chalk">{{ p.combined_credits.cast.length }}</p>
              </div>
            </div>
          </div>

          <div class="min-w-0">
            <h1 class="font-display text-3xl font-extrabold tracking-tight text-chalk sm:text-5xl">{{ p.name }}</h1>

            @if (p.biography) {
              <div class="mt-6">
                <h2 class="text-xs font-semibold tracking-[0.15em] text-muted uppercase">Biography</h2>
                <p class="mt-2 text-sm leading-relaxed text-chalk/80" [class.line-clamp-6]="!bioExpanded()">
                  {{ p.biography }}
                </p>
                @if (p.biography.length > 400) {
                  <button
                    type="button"
                    (click)="bioExpanded.set(!bioExpanded())"
                    class="mt-2 text-xs font-bold tracking-wide text-chalk uppercase underline underline-offset-4"
                  >
                    {{ bioExpanded() ? 'Read less' : 'Read more' }}
                  </button>
                }
              </div>
            } @else {
              <p class="mt-6 text-sm text-chalk/50">No biography available.</p>
            }

            @if (knownFor().length > 0) {
              <div class="mt-12">
                <h2 class="font-display text-xl font-extrabold tracking-tight text-chalk">Known For</h2>
                <app-scroll-carousel [count]="knownFor().length" class="mt-5 block">
                  @for (item of knownFor(); track item.id + item.mediaType) {
                    <app-movie-card class="snap-start" [item]="item" />
                  }
                </app-scroll-carousel>
              </div>
            }
          </div>
        </div>
      </div>
    } @else if (resource.isLoading()) {
      <div class="mx-auto max-w-6xl px-6 pt-28 pb-12 sm:pt-32">
        <div class="grid grid-cols-1 gap-10 sm:grid-cols-[260px_1fr]">
          <div class="aspect-2/3 w-full animate-pulse rounded-2xl bg-chalk/10"></div>
          <div class="flex flex-col gap-3">
            <div class="h-10 w-2/3 animate-pulse rounded bg-chalk/10"></div>
            <div class="h-4 w-full animate-pulse rounded bg-chalk/10"></div>
            <div class="h-4 w-5/6 animate-pulse rounded bg-chalk/10"></div>
          </div>
        </div>
      </div>
    } @else if (resource.error()) {
      <p class="mx-auto max-w-6xl px-6 py-16 text-sm text-chalk/75">Couldn't load this profile right now.</p>
    }
  `,
})
export class PersonDetail {
  readonly id = input.required<string>();

  protected readonly resource = httpResource<TmdbPersonDetail>(
    () => `${environment.linkUrl}/person/${this.id()}?language=en-US&append_to_response=combined_credits,external_ids`
  );

  protected readonly person = computed(() => this.resource.value());
  protected readonly bioExpanded = signal(false);

  protected readonly profileUrl = computed(() => {
    const path = this.person()?.profile_path;
    return path ? `${IMAGE_PROFILE}${path}` : null;
  });

  protected readonly genderLabel = computed(() => GENDER_LABELS[this.person()?.gender ?? 0] ?? null);

  protected readonly birthdayLabel = computed(() => {
    const p = this.person();
    if (!p?.birthday) return null;
    const formatted = this.formatDate(p.birthday);
    if (p.deathday) return formatted;
    const age = this.age(p.birthday, p.deathday);
    return age !== null ? `${formatted} (age ${age})` : formatted;
  });

  protected readonly deathdayLabel = computed(() => {
    const p = this.person();
    if (!p?.deathday) return null;
    return this.formatDate(p.deathday);
  });

  private toCardItem(credit: CombinedCreditItem): MovieCardItem {
    return {
      id: credit.id,
      title: credit.title ?? credit.name ?? '',
      posterPath: credit.poster_path,
      voteAverage: credit.vote_average,
      mediaType: credit.media_type,
    };
  }

  protected readonly knownFor = computed(() => {
    const cast = this.person()?.combined_credits.cast ?? [];
    return [...cast]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12)
      .map((c) => this.toCardItem(c));
  });

  protected readonly socialLinks = computed(() => {
    const ids = this.person()?.external_ids;
    if (!ids) return [];

    const links: { label: string; href: string; path: string }[] = [];

    if (ids.instagram_id) {
      links.push({
        label: 'Instagram',
        href: `https://instagram.com/${ids.instagram_id}`,
        path: 'M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43C21.99 8.94 22 9.28 22 12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76 4.9 4.9 0 0 1-1.76 1.15c-.64.25-1.37.42-2.43.47C15.06 21.99 14.72 22 12 22s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76A4.9 4.9 0 0 1 5.44 2.53c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 3.6A6.4 6.4 0 1 0 12 18.4 6.4 6.4 0 0 0 12 5.6zm0 2.16a4.24 4.24 0 1 1 0 8.48 4.24 4.24 0 0 1 0-8.48zm6.66-2.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
      });
    }
    if (ids.tiktok_id) {
      links.push({
        label: 'TikTok',
        href: `https://tiktok.com/@${ids.tiktok_id}`,
        path: 'M16.5 2h-3.2v13.2a2.9 2.9 0 1 1-2.05-2.77V9.1a6.1 6.1 0 1 0 5.25 6.04V8.6a7.6 7.6 0 0 0 4.5 1.46V6.86A4.3 4.3 0 0 1 16.5 2z',
      });
    }
    if (ids.youtube_id) {
      links.push({
        label: 'YouTube',
        href: `https://youtube.com/${ids.youtube_id}`,
        path: 'M21.6 7.2s-.2-1.5-.85-2.15c-.8-.85-1.7-.85-2.1-.9C15.9 4 12 4 12 4h-.02s-3.88 0-6.63.15c-.4.05-1.3.05-2.1.9C2.6 5.7 2.4 7.2 2.4 7.2S2.2 8.95 2.2 10.7v1.6c0 1.75.2 3.5.2 3.5s.2 1.5.85 2.15c.8.85 1.85.82 2.32.92C7.2 19 12 19 12 19s3.9 0 6.65-.15c.4-.05 1.3-.05 2.1-.9.65-.65.85-2.15.85-2.15s.2-1.75.2-3.5v-1.6c0-1.75-.2-3.5-.2-3.5zM9.95 14.2V8.9l5.3 2.66-5.3 2.65z',
      });
    }
    if (ids.facebook_id) {
      links.push({
        label: 'Facebook',
        href: `https://facebook.com/${ids.facebook_id}`,
        path: 'M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H9v3h2v7h3v-7h3l1-3h-4V9c0-.55.45-1 1-1z',
      });
    }
    if (ids.twitter_id) {
      links.push({
        label: 'Twitter',
        href: `https://twitter.com/${ids.twitter_id}`,
        path: 'M22 5.9c-.73.33-1.5.54-2.32.64a4.05 4.05 0 0 0 1.78-2.24c-.78.47-1.64.8-2.56.98a4.03 4.03 0 0 0-6.87 3.68A11.44 11.44 0 0 1 3.67 4.9a4.03 4.03 0 0 0 1.25 5.38 4 4 0 0 1-1.83-.5v.05a4.03 4.03 0 0 0 3.23 3.95 4.05 4.05 0 0 1-1.82.07 4.03 4.03 0 0 0 3.76 2.8A8.08 8.08 0 0 1 2 18.4a11.4 11.4 0 0 0 6.19 1.82c7.42 0 11.48-6.15 11.48-11.48l-.01-.52c.79-.57 1.47-1.28 2.01-2.09-.72.32-1.5.54-2.31.63A4.03 4.03 0 0 0 22 5.9z',
      });
    }

    return links;
  });

  private formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private age(birthday: string, deathday: string | null): number | null {
    const end = deathday ? new Date(`${deathday}T00:00:00`) : new Date();
    const start = new Date(`${birthday}T00:00:00`);
    let age = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
      age--;
    }
    return age;
  }
}