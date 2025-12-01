
import { Component, input, output, signal, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div class="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <span class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">JSON Input</span>
        <div class="flex gap-2">
            <!-- Feature 2: Download JSON -->
          <button (click)="downloadJson.emit()" class="px-2 py-1 text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1" title="Download JSON">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          </button>
          <button (click)="formatJson()" class="px-2 py-1 text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700 transition-colors">
            Format
          </button>
          <button (click)="clearJson()" class="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 rounded border border-red-200 dark:border-red-900/50 transition-colors">
            Clear
          </button>
        </div>
      </div>
      
      <!-- Feature 1: Line Numbers + Textarea -->
      <div class="relative flex-1 overflow-hidden flex">
        <!-- Line Numbers Gutter -->
        <div 
          #lineNumbers
          class="bg-zinc-100 dark:bg-[#121214] border-r border-zinc-200 dark:border-zinc-800 text-right pr-2 pt-4 select-none text-zinc-400 dark:text-zinc-600 font-mono text-sm leading-6 min-w-[3rem] overflow-hidden"
          style="font-family: monospace;">
          @for (line of lines(); track $index) {
              <div>{{ line }}</div>
          }
        </div>

        <textarea
          #textarea
          [value]="jsonString()"
          (input)="onInput($event)"
          (scroll)="syncScroll($event)"
          class="flex-1 h-full bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 p-4 font-mono text-sm leading-6 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 border-none transition-colors duration-300 whitespace-pre"
          spellcheck="false"
          placeholder="Paste your JSON here..."
        ></textarea>
        
        @if (error()) {
          <div class="absolute bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-3 py-2 rounded text-xs font-mono backdrop-blur-sm shadow-md pointer-events-none">
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
  downloadJson = output<void>();
  error = input<string | null>(null);

  lineNumbersRef = viewChild<ElementRef>('lineNumbers');
  lines = signal<number[]>([1]);

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.updateLineNumbers(val);
    this.jsonChange.emit(val);
  }

  formatJson() {
    try {
      const current = this.jsonString();
      if (!current.trim()) return;
      const parsed = JSON.parse(current);
      const formatted = JSON.stringify(parsed, null, 2);
      this.updateLineNumbers(formatted);
      this.jsonChange.emit(formatted);
    } catch (e) {
      // ignore format error
    }
  }

  clearJson() {
    this.lines.set([1]);
    this.jsonChange.emit('');
  }

  syncScroll(event: Event) {
      const textarea = event.target as HTMLTextAreaElement;
      const gutter = this.lineNumbersRef()?.nativeElement;
      if (gutter) {
          gutter.scrollTop = textarea.scrollTop;
      }
  }

  private updateLineNumbers(text: string) {
      const count = text.split('\n').length;
      if (count !== this.lines().length) {
          this.lines.set(Array.from({length: count}, (_, i) => i + 1));
      }
  }
}
