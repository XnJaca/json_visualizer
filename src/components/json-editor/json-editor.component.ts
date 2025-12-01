import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  template: `
    <div class="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div class="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950">
        <span class="text-sm font-semibold text-zinc-300">JSON Input</span>
        <div class="flex gap-2">
          <button (click)="formatJson()" class="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors">
            Format
          </button>
          <button (click)="clearJson()" class="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded border border-red-900/50 transition-colors">
            Clear
          </button>
        </div>
      </div>
      
      <div class="relative flex-1">
        <textarea
          #textarea
          [value]="jsonString()"
          (input)="onInput($event)"
          class="w-full h-full bg-zinc-900 text-zinc-300 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700 border-none"
          spellcheck="false"
          placeholder="Paste your JSON here..."
        ></textarea>
        
        @if (error()) {
          <div class="absolute bottom-4 left-4 right-4 bg-red-900/80 border border-red-700 text-red-200 px-3 py-2 rounded text-xs font-mono backdrop-blur-sm">
            {{ error() }}
          </div>
        }
      </div>
    </div>
  `
})
export class JsonEditorComponent {
  jsonString = input.required<string>();
  jsonChange = output<string>();
  error = input<string | null>(null);

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.jsonChange.emit(val);
  }

  formatJson() {
    try {
      const current = this.jsonString();
      if (!current.trim()) return;
      const parsed = JSON.parse(current);
      this.jsonChange.emit(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // ignore format error, let the validation handle it
    }
  }

  clearJson() {
    this.jsonChange.emit('');
  }
}