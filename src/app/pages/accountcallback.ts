import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-account-callback',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-md px-6 pt-32 pb-24 text-center">
      @if (status() === 'pending') {
        <p class="text-sm text-chalk/60">Signing you in…</p>
      } @else if (status() === 'denied') {
        <p class="text-sm text-chalk/60">
          Access wasn't approved on TMDB's side.
          <a routerLink="/login" class="text-chalk underline underline-offset-4">Try again</a>.
        </p>
      } @else if (status() === 'error') {
        <p class="text-sm text-chalk/60">
          Something went wrong signing you in.
          <a routerLink="/login" class="text-chalk underline underline-offset-4">Try again</a>.
        </p>
      }
    </div>
  `,
})
export class AccountCallback {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly request_token = input<string>();
  readonly approved = input<string>();

  protected readonly status = signal<'pending' | 'denied' | 'error'>('pending');

  constructor() {
    effect(() => {
      const token = this.request_token();
      const approved = this.approved();
      if (!token) {
        return;
      }

      untracked(() => {
        if (approved !== 'true') {
          this.status.set('denied');
          return;
        }

        this.auth.createSession(token).subscribe({
          next: ({ session_id }) => {
            this.auth.setSession(session_id);
            this.router.navigateByUrl('/account');
          },
          error: () => this.status.set('error'),
        });
      });
    });
  }
}