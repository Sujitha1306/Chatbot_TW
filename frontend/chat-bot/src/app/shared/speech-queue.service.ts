// src/app/shared/services/speech-queue.service.ts
import { Injectable } from '@angular/core';
import { TextToSpeechService } from './services/text-to-speech.service';

@Injectable({ providedIn: 'root' })
export class SpeechQueueService {
  private queue: { id?: string; tokenNo?: string; text: string; speed?: number, voice?: string }[] = [];
  private processing = false;
  private isPageUnloading = false;

  constructor(private tts: TextToSpeechService) {
    window.addEventListener('beforeunload', this.onBeforeUnload);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onBeforeUnload = () => {
    this.isPageUnloading = true;
    this.queue = [];
    try { window.speechSynthesis?.cancel(); } catch (e) { /* swallow */ }
  };

  private onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      this.isPageUnloading = true;
    } else {
      this.isPageUnloading = false;
      this.process();
    }
  };

  enqueue(item: { id?: string; tokenNo?: string; text: string, speed?: number; voice?: string }) {
    if (this.isPageUnloading) return; // do not enqueue during unload/hidden
    if (!item?.text) return;
    this.queue.push(item);
    this.process();
  }

  private async process() {
    if (this.processing || this.isPageUnloading) return;
    this.processing = true;
    try {
      while (this.queue.length && !this.isPageUnloading) {
        const item = this.queue.shift();
        if (!item) continue;
        try {
          // guard again before speaking
          if (this.isPageUnloading) break;
          await this.tts.speak([item.text], 'en-IN', 1, item?.speed, 1, item?.voice);
        } catch (e) {
          console.error('Error speaking item', e);
        }
        await new Promise(r => setTimeout(r, 120));
      }
    } finally {
      this.processing = false;
    }
  }

  clear() { this.queue = []; }

  // cleanup if service ever destroyed (rare for providedIn: 'root')
  ngOnDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}

