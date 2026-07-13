import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  private offlineSubject = new BehaviorSubject<boolean>(!navigator.onLine);
    offline$ = this.offlineSubject.pipe(
      distinctUntilChanged(),
      debounceTime(500)
    );

  constructor(private ngZone: NgZone) {
    window.addEventListener('offline', () => {
      console.log('%c🔥 WINDOW OFFLINE EVENT', 'color:red;font-size:16px');
      this.ngZone.run(() => {
        this.offlineSubject.next(true);
      });
    });

    window.addEventListener('online', () => {
        console.log('%c✔ markOnline() called', 'color:green;font-size:14px');
      this.ngZone.run(() => {
        this.offlineSubject.next(false);
      });
    });
  }

  markOffline(): void {
      console.log('%c💚 WINDOW ONLINE EVENT', 'color:green;font-size:16px');
    this.offlineSubject.next(true);
  }

  markOnline(): void {
    console.log('%c✔ markOnline() called', 'color:green;font-size:14px');
    this.offlineSubject.next(false);
  }

  isOffline(): boolean {
    return this.offlineSubject.value;
  }
}
