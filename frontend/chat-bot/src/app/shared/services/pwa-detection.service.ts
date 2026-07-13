import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaDetectionService {

  constructor() { }

  isPwa(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://') ||
           document.referrer.includes('ios-app://');
  }
}
