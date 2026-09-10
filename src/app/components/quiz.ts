import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MovieQuizService, QuizAnswers } from '../services/quiz.service';
 
interface QuizOption {
  label: string;
  patch: Partial<QuizAnswers>;
}
 
interface QuizQuestion {
  eyebrow: string;
  prompt: string;
  options: QuizOption[];
}
 
const EMPTY_ANSWERS: QuizAnswers = {
  genreIds: [],
  afterYear: null,
  beforeYear: null,
  maxRuntime: null,
  watchProviderId: null,
};
 
const QUESTIONS: QuizQuestion[] = [
  {
    eyebrow: 'Mood',
    prompt: 'What are you in the mood for?',
    options: [
      { label: 'Action & adventure', patch: { genreIds: [28, 12] } },
      { label: 'Something light', patch: { genreIds: [35, 10751] } },
      { label: 'An emotional story', patch: { genreIds: [18, 10749] } },
      { label: 'Horror & suspense', patch: { genreIds: [27, 53] } },
    ],
  },
  {
    eyebrow: 'Era',
    prompt: 'New releases or classics?',
    options: [
      { label: 'Last few years', patch: { afterYear: new Date().getFullYear() - 5 } },
      { label: 'Timeless classics', patch: { beforeYear: 1999 } },
      { label: "Doesn't matter", patch: {} },
    ],
  },
  {
    eyebrow: 'Runtime',
    prompt: 'How much time do you have?',
    options: [
      { label: 'Under 100 minutes', patch: { maxRuntime: 100 } },
      { label: "I've got the whole evening", patch: {} },
    ],
  },
  {
    eyebrow: 'Where',
    prompt: 'Where do you want to watch it?',
    options: [
      { label: 'Netflix', patch: { watchProviderId: 8 } },
      { label: 'Prime Video', patch: { watchProviderId: 119 } },
      { label: 'Disney+', patch: { watchProviderId: 337 } },
      { label: 'Any platform', patch: {} },
    ],
  },
];
 
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
 
@Component({
  selector: 'app-movie-quiz',
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-2xl px-6 py-24">
      @if (!done()) {
        @for (question of [current()]; track step()) {
          <div class="quiz-step rounded-[28px] border border-chalk/10 bg-surface/40 p-8 backdrop-blur-2xl sm:p-10">

          <h1 class="font-display text-3xl font-extrabold tracking-tight text-chalk sm:text-5xl">
                No idea what to watch?
            </h1>
            <p class="mt-2 mb-4 text-1xl">
                Four quick questions, one good pick.
            </p>
            
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold tracking-[0.2em] text-muted uppercase">{{ question.eyebrow }}</span>
              <span class="text-xs text-muted">{{ step() + 1 }} / {{ questions.length }}</span>
            </div>
 
            <div class="mt-8 flex items-center gap-2" aria-hidden="true">
              @for (q of questions; track $index) {
                <span
                  class="h-1.5 rounded-full transition-all duration-300"
                  [class]="$index === step() ? 'w-7 bg-chalk' : $index < step() ? 'w-1.5 bg-chalk/70' : 'w-1.5 bg-chalk/20'"
                ></span>
              }
            </div>
 
            <h2 class="mt-6 font-display text-3xl font-extrabold tracking-tight text-chalk sm:text-4xl">
              {{ question.prompt }}
            </h2>
 
            <div class="mt-8 flex flex-col gap-3" role="radiogroup" [attr.aria-label]="question.prompt">
              @for (option of question.options; track option.label) {
                <button
                  type="button"
                  role="radio"
                  aria-checked="false"
                  (click)="choose(option)"
                  class="flex items-center justify-between rounded-2xl border border-chalk/10 bg-chalk/5 px-5 py-4 text-left text-sm font-medium text-chalk/85 transition-colors hover:border-chalk/20 hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
                >
                  {{ option.label }}
                  <svg class="size-4 shrink-0 text-chalk/40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              }
            </div>
 
            @if (step() > 0) {
              <button
                type="button"
                (click)="back()"
                class="mt-8 text-sm font-medium text-muted transition-colors hover:text-chalk"
              >
                ← Back
              </button>
            }
          </div>
        }
      } @else {
        <div class="rounded-[28px] border border-chalk/10 bg-surface/40 p-8 backdrop-blur-2xl sm:p-10">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-3xl font-extrabold tracking-tight text-chalk sm:text-4xl">
              Picked for you
            </h2>
            <button
              type="button"
              (click)="restart()"
              class="text-sm font-medium text-muted transition-colors hover:text-chalk"
            >
              Start over
            </button>
          </div>
 
          @if (quiz.recommendations.isLoading()) {
            <p class="mt-8 text-sm text-muted">Finding something good…</p>
          } @else if (quiz.recommendations.error()) {
            <p class="mt-8 text-sm text-chalk/75">
              Couldn't reach TMDB just now.
              <button type="button" (click)="retry()" class="font-semibold text-chalk underline underline-offset-4">
                Try again
              </button>
            </p>
          } @else if (results().length === 0) {
            <p class="mt-8 text-sm text-chalk/75">No match for that combination. Try different answers.</p>
          } @else {
            <ul class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              @for (movie of results(); track movie.id) {
                <li>
                  <a
                    [routerLink]="['/movie', movie.id]"
                    class="group block overflow-hidden rounded-2xl border border-chalk/10 bg-chalk/5 transition-colors hover:border-chalk/20"
                  >
                    @if (movie.poster_path) {
                      <img
                        [src]="posterUrl(movie.poster_path)"
                        [alt]="''"
                        aria-hidden="true"
                        class="aspect-2/3 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    }
                    <div class="p-3">
                      <p class="line-clamp-1 text-sm font-semibold text-chalk">{{ movie.title }}</p>
                      <p class="mt-0.5 text-xs text-muted">★ {{ movie.vote_average.toFixed(1) }}</p>
                    </div>
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  styles: `
    @keyframes quiz-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
 
    .quiz-step {
      animation: quiz-in 0.35s ease-out;
    }
 
    @media (prefers-reduced-motion: reduce) {
      .quiz-step {
        animation: none;
      }
    }
  `,
})
export class MovieQuiz {
  protected readonly quiz = inject(MovieQuizService);
 
  protected readonly questions = QUESTIONS;
  protected readonly step = signal(0);
  protected readonly done = signal(false);
  private readonly draft = signal<QuizAnswers>(EMPTY_ANSWERS);
 
  protected readonly current = computed(() => this.questions[this.step()]);
  protected readonly results = computed(() => this.quiz.recommendations.value()?.results.slice(0, 6) ?? []);
 
  protected choose(option: QuizOption): void {
    this.draft.update((answers) => ({ ...answers, ...option.patch }));
 
    if (this.step() === this.questions.length - 1) {
      this.quiz.submit(this.draft());
      this.done.set(true);
      return;
    }
 
    this.step.update((s) => s + 1);
  }
 
  protected back(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }
 
  protected restart(): void {
    this.draft.set(EMPTY_ANSWERS);
    this.step.set(0);
    this.done.set(false);
    this.quiz.reset();
  }
 
  protected retry(): void {
    this.quiz.submit(this.draft());
  }
 
  protected posterUrl(path: string): string {
    return `${POSTER_BASE}${path}`;
  }
}