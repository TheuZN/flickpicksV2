import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  standalone: true,
  template: `
    <a routerLink="/" class="group ml-1 flex items-center gap-2 text-chalk">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        class="hidden min-[400px]:block"
      >
        <path 
          d="M4 6.5 11 12 4 17.5z" 
          fill="currentColor" 
          class="opacity-70 transition-opacity duration-200 group-hover:opacity-100"
        />
        <path 
          d="M12.5 6.5 19.5 12 12.5 17.5z" 
          fill="currentColor" 
          class="opacity-30 transition-all duration-300 delay-100 group-hover:opacity-100 group-hover:translate-x-0.5"
        />
      </svg>
      <span class="font-bebas text-xl tracking-tight font-bold">FlickPicks</span>
    </a>
  `
})
export class Logo {
  
}