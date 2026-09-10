import { Service, effect, signal } from '@angular/core';
 
export type Theme = 'dark' | 'light';
 
const STORAGE_KEY = 'flickpicks-theme';
 
function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
 
@Service()
export class ThemeService {
  readonly theme = signal<Theme>(initialTheme());
 
  constructor() {
    effect(() => {
      const theme = this.theme();
      document.documentElement.dataset['theme'] = theme;
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }
 
  toggle(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }
}