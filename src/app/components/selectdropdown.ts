import { Component, computed, input, output, signal } from '@angular/core';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select-dropdown',
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label()"
        class="inline-flex items-center gap-2 rounded-full border border-chalk/15 bg-surface/40 px-4 py-2 text-sm font-semibold text-chalk transition-colors hover:border-chalk/30 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
      >
        {{ selectedLabel() }}
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      @if (open()) {
        <div class="fixed inset-0 z-40" (click)="open.set(false)"></div>

        <div class="absolute top-full left-0 z-50 mt-2 w-52 rounded-2xl border border-chalk/10 bg-surface p-1.5 shadow-2xl">
          @for (opt of options(); track opt.value) {
            <button
              type="button"
              (click)="select(opt.value)"
              class="block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-chalk/10"
              [class]="opt.value === value() ? 'font-bold text-chalk' : 'text-chalk/75'"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class SelectDropdown {
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly open = signal(false);

  protected readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? this.label());

  protected select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
  }
}