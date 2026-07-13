import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appNoSpace]'
})
export class NoSpaceDirective {

  @HostListener('keydown', ['$event'])
  onInputChange($event) {
      if ($event.target.value.length === 0 && $event.keyCode === 32) {
        event.preventDefault();
      }
    }

}
