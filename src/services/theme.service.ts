
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  mode = signal<'light' | 'dark'>('dark');

  constructor() {
    effect(() => {
      const m = this.mode();
      if (m === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  toggle() {
    this.mode.update(m => m === 'dark' ? 'light' : 'dark');
  }
}
