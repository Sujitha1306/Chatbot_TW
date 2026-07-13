import { Directive, EventEmitter, HostListener,  OnDestroy, OnInit, Output } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

@Directive({
  selector: '[appkeyupHit]'
})
export class KeyupDirectiveService implements OnInit, OnDestroy {
  public keyCode = null;
  public curType = null;
  public prevType = null;
  @HostListener('keyup', ['$event'])
  typeEvent(event) {
    this.keyCode = event.keyCode;
    this.curType = event.target.id;
    event.preventDefault();
    event.stopPropagation();
    this.types.next(event.target.value);
  }
  @Output() keyupHit = new EventEmitter();

  private readonly types = new Subject();

  searchstring: any[] = [];
  private subscription: Subscription;
  list: any;

  constructor() { }
  ngOnInit(): void {
    let toHit;
    this.subscription = this.types.
      pipe(
        debounceTime(1000),
        switchMap(text => {
          if (text != "" && text != undefined && this.keyCode !== 32) {
            this.searchstring.push(text);
            if (this.curType !== this.prevType || (this.searchstring[this.searchstring.length - 1].length > 2)) {
              toHit = true;
              const keyCode = this.keyCode;
              const type = this.curType;
              this.keyupHit.emit({ text, toHit, type, keyCode });
              this.prevType = this.curType;
              return interval(1000).pipe();
            }
            else {
              toHit = false;
              const keyCode = this.keyCode;
              const type = this.curType;
              this.keyupHit.emit({ text, toHit, type, keyCode });
              this.prevType = this.curType;
              return interval(1000).pipe();
            }
          } else {
            toHit = false;
            const keyCode = this.keyCode;
            const type = this.curType;
            this.keyupHit.emit({ text, toHit, type, keyCode });
            this.prevType = this.curType;
            return [];
          }

        })

      ).subscribe();
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
