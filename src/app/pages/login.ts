import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="mx-auto max-w-md px-6 pt-32 pb-24 text-center">
      <h1 class="font-display text-3xl font-extrabold tracking-tight text-chalk">Log in</h1>
      <p class="mt-3 text-sm leading-relaxed text-chalk/60">
        FlickPicks uses your TMDB account, so your watchlist, favorites, and ratings are really yours — not a demo.
      </p>

      <button
        type="button"
        (click)="auth.startLogin()"
        class="mt-8 inline-flex items-center gap-2 rounded-full bg-chalk px-6 py-3 text-sm font-bold text-ink-950 transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
      >
        Continue with TMDB
      </button>

      <p class="mt-6 text-xs text-chalk/40">
        You'll be sent to themoviedb.org to approve access, then brought straight back here.
      </p>
    </div>
  `,
})
export class Login {
  protected readonly auth = inject(AuthService);
}