import { Injectable,ErrorHandler, NgZone} from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler{
  constructor(public router : Router, private readonly ngZone: NgZone) {}
  handleError(error: any): void {
    try {
      const message = error?.message ?? error?.rejection?.message ?? '';
      const isChunkError = /Loading chunk \d+ failed/i.test(message) || /ChunkLoadError/i.test(message);
      if (isChunkError) {
        this.handleChunkError();
        return;
      }
      // If it is not a chunk error, trigger the catch block flow to throw it
      throw error;
    } catch (err) {
      // Preserve the default browser error with stack trace
      setTimeout(() => {
        throw err;
      });
    }
  }

  private handleChunkError(): void {
    if (sessionStorage.getItem('chunk-reloaded')) {
      sessionStorage.removeItem('chunk-reloaded');
      return;
    }
    sessionStorage.setItem('chunk-reloaded', 'true');
    window.location.replace(window.location.href);
  }
}
