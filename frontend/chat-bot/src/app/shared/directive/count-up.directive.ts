import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { animationFrameScheduler, interval, ReplaySubject } from 'rxjs';
import { map, takeUntil, takeWhile } from 'rxjs/operators';

@Directive({
  selector: '[countUp]',
})
export class CountUpDirective implements OnInit, OnDestroy {
  private readonly destroySubject$ = new ReplaySubject<void>(1);

  @Input() eventTime?: string;
  @Input() authorizeTimer?: number;
  @Input() duration?: number;
  @Input() durationUnit: 's' | 'min' = 's';

  constructor(private readonly elementRef: ElementRef, private readonly renderer: Renderer2) {}

  ngOnInit(): void {
    let totalDurationMs = this.calculateTotalDurationMs();
    if (totalDurationMs > 0) {
      this.startSmoothCountdown(totalDurationMs);
    } else {
      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', '0');
    }
  }

  private calculateTotalDurationMs(): number {
    if (this.eventTime && this.authorizeTimer !== undefined) {
      const eventDate = new Date(this.eventTime).getTime();
      const futureTargetTime = eventDate + this.authorizeTimer * 60000;
      return Math.max(futureTargetTime - Date.now(), 0); // Ensure non-negative time
    } else if (this.duration !== undefined) {
      return this.duration * (this.durationUnit === 'min' ? 60000 : 1000);
    }
    return 0;
  }

  private startSmoothCountdown(totalTime: number): void {
    const interval$ = interval(1000, animationFrameScheduler).pipe(
      map((elapsed) => totalTime - elapsed * 1000),
      takeWhile((remaining) => remaining >= 0),
      takeUntil(this.destroySubject$)
    );

    interval$.subscribe((remainingTime) => {
      if (remainingTime > 60000) {
        const minutes = Math.floor(remainingTime / 60000);
        this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', `${minutes}`);
      } else {
        const seconds = Math.floor(remainingTime / 1000);
        this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', `${seconds}`);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroySubject$.next();
    this.destroySubject$.complete();
  }
}
