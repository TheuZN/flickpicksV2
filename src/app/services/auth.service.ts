import { Service, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';

const SESSION_KEY = 'tmdb-session-id';

export interface TmdbAccount {
  id: number;
  username: string;
  name: string;
  avatarPath: string | null;
}

interface RawTmdbAvatar {
  tmdb: { avatar_path: string | null };
}

interface RawTmdbAccount {
  id: number;
  username: string;
  name: string;
  avatar: RawTmdbAvatar;
}

interface RequestTokenResponse {
  success: boolean;
  request_token: string;
}

interface SessionResponse {
  success: boolean;
  session_id: string;
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly sessionId = signal<string | null>(localStorage.getItem(SESSION_KEY));
  readonly isAuthenticated = computed(() => this.sessionId() !== null);

  private readonly accountResource = httpResource<RawTmdbAccount>(() => {
    const session = this.sessionId();
    return session ? `${environment.linkUrl}/account?session_id=${session}` : undefined;
  });

  readonly account = computed<TmdbAccount | null>(() => {
    const raw = this.accountResource.value();
    if (!raw) {
      return null;
    }
    return {
      id: raw.id,
      username: raw.username,
      name: raw.name,
      avatarPath: raw.avatar?.tmdb?.avatar_path ?? null,
    };
  });

  readonly accountLoading = computed(() => this.isAuthenticated() && this.accountResource.isLoading());

  constructor() {
    effect(() => {
      const failed = this.accountResource.error();
      if (failed && this.sessionId() && this.isAuthError(failed)) {
        untracked(() => this.logout());
      }
    });
  }

  private isAuthError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return false;
    }
    const status = (error as { status: unknown }).status;
    return status === 401 || status === 403;
  }

  startLogin(): void {
    this.http.get<RequestTokenResponse>(`${environment.linkUrl}/authentication/token/new`).subscribe({
      next: ({ request_token }) => {
        const redirectTo = `${window.location.origin}/account/callback`;
        window.location.href = `https://www.themoviedb.org/authenticate/${request_token}?redirect_to=${encodeURIComponent(redirectTo)}`;
      },
    });
  }

  createSession(requestToken: string) {
    return this.http.post<SessionResponse>(`${environment.linkUrl}/authentication/session/new`, {
      request_token: requestToken,
    });
  }

  setSession(sessionId: string): void {
    localStorage.setItem(SESSION_KEY, sessionId);
    this.sessionId.set(sessionId);
  }

  logout(): void {
    const session = this.sessionId();
    localStorage.removeItem(SESSION_KEY);
    this.sessionId.set(null);

    if (session) {
      this.http.delete(`${environment.linkUrl}/authentication/session`, { body: { session_id: session } }).subscribe();
    }
  }
}