import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#08080a]/80 p-6 backdrop-blur-sm" (click)="cancel.emit()">
      <div
        class="w-full max-w-sm rounded-2xl border border-chalk/10 bg-surface p-6 shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <p class="text-sm leading-relaxed text-chalk">{{ message() }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            (click)="cancel.emit()"
            class="rounded-full px-4 py-2 text-sm font-semibold text-chalk/70 transition-colors hover:text-chalk focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            class="rounded-full bg-chalk px-4 py-2 text-sm font-bold text-ink-950 focus-visible:ring-2 focus-visible:ring-chalk focus-visible:outline-none"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  readonly message = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}