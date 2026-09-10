import { Component } from '@angular/core';
import { Logo } from './logo';

interface FooterLinkGroup {
  heading: string;
  links: { label: string; href: string }[];
}

interface SocialLink {
  label: string;
  href: string;
  path: string;
}

@Component({
  selector: 'app-footer',
  imports: [Logo],
  template: `
    <footer class="border-t border-chalk/10">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div class="max-w-xs">
            <app-logo />
            <p class="mt-4 text-sm leading-relaxed text-chalk/60">
              Discover, rate, and organize what to watch — movies and TV shows in one place.
            </p>
          </div>

          <div class="flex flex-wrap gap-12 sm:gap-16">
            @for (group of linkGroups; track group.heading) {
              <div>
                <h3 class="text-xs font-semibold tracking-[0.2em] text-muted uppercase">{{ group.heading }}</h3>
                <ul class="mt-4 flex flex-col gap-2.5">
                  @for (link of group.links; track link.label) {
                    <li>
                      <a
                        [href]="link.href"
                        class="text-sm text-chalk/70 transition-colors hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
                      >
                        {{ link.label }}
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }

            <div>
              <h3 class="text-xs font-semibold tracking-[0.2em] text-muted uppercase">Social</h3>
              <div class="mt-4 flex items-center gap-2">
                @for (social of socialLinks; track social.label) {
                  <a
                    [href]="social.href"
                    [attr.aria-label]="social.label"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="grid size-9 place-items-center rounded-full text-chalk/70 transition-colors hover:bg-chalk/10 hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
                  >
                    <svg class="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path [attr.d]="social.path" />
                    </svg>
                  </a>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="mt-14 flex flex-col gap-3 border-t border-chalk/10 pt-6 text-xs text-chalk/50 sm:flex-row sm:items-center sm:justify-between">
          <p>Made by <a href=""><span class="font-semibold text-chalk/75">Mateus Melo</span></a></p>
          <p>This project was built using the TMDB API.</p>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly linkGroups: FooterLinkGroup[] = [
    {
      heading: 'Contact',
      links: [
        { label: 'flickpickssac.com', href: 'https://flickpickssac.com' },
        { label: '88 4154-8569', href: 'tel:+558841548569' },
        { label: '88 98165-5247', href: 'tel:+5588981655247' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms of use', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://facebook.com',
      path: 'M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H9v3h2v7h3v-7h3l1-3h-4V9c0-.55.45-1 1-1z',
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com',
      path: 'M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43C21.99 8.94 22 9.28 22 12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76 4.9 4.9 0 0 1-1.76 1.15c-.64.25-1.37.42-2.43.47C15.06 21.99 14.72 22 12 22s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76A4.9 4.9 0 0 1 5.44 2.53c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2zm0 3.6A6.4 6.4 0 1 0 12 18.4 6.4 6.4 0 0 0 12 5.6zm0 2.16a4.24 4.24 0 1 1 0 8.48 4.24 4.24 0 0 1 0-8.48zm6.66-2.4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
    },
    {
      label: 'Twitter',
      href: 'https://twitter.com',
      path: 'M22 5.9c-.73.33-1.5.54-2.32.64a4.05 4.05 0 0 0 1.78-2.24c-.78.47-1.64.8-2.56.98a4.03 4.03 0 0 0-6.87 3.68A11.44 11.44 0 0 1 3.67 4.9a4.03 4.03 0 0 0 1.25 5.38 4 4 0 0 1-1.83-.5v.05a4.03 4.03 0 0 0 3.23 3.95 4.05 4.05 0 0 1-1.82.07 4.03 4.03 0 0 0 3.76 2.8A8.08 8.08 0 0 1 2 18.4a11.4 11.4 0 0 0 6.19 1.82c7.42 0 11.48-6.15 11.48-11.48l-.01-.52c.79-.57 1.47-1.28 2.01-2.09-.72.32-1.5.54-2.31.63A4.03 4.03 0 0 0 22 5.9z',
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com',
      path: 'M6.94 8.5H3.56V20h3.38V8.5zM5.25 3a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92zM20.44 20h-3.38v-5.9c0-1.4-.03-3.2-1.95-3.2-1.96 0-2.26 1.53-2.26 3.1V20H9.47V8.5h3.24v1.57h.05c.45-.86 1.56-1.77 3.21-1.77 3.43 0 4.06 2.26 4.06 5.2V20z',
    },
  ];
}