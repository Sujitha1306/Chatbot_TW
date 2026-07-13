import {
  Directive,
  Input,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appAutoCompleteDirective]'
})
export class AutoCompleteDirective implements AfterViewInit, OnDestroy, OnChanges {

  @Input() autoOptions: any[] = [];
  @Input() displayKey!: string;
  @Input() valueKey!: string;

  private sub = new Subscription();

  constructor(
    private ngControl: NgControl,
    private trigger: MatAutocompleteTrigger,
    private el: ElementRef
  ) {}

  ngAfterViewInit(): void {

    const control = this.ngControl.control;

    // Dropdown selection
    const selectionSub = this.trigger.optionSelections.subscribe(event => {

      const selectedId = event.source.value;

      if (!selectedId) return;

      const match = this.autoOptions.find(
        item => item[this.valueKey] === selectedId
      );

      if (match) {
        control?.setValue(selectedId, { emitEvent: false });
        this.trigger.writeValue(match[this.displayKey]);
      }

    });

    // Value set from TS
    const valueChangeSub = control?.valueChanges.subscribe(() => {
      this.updateDisplay();
    });

    this.sub.add(selectionSub);
    if (valueChangeSub) this.sub.add(valueChangeSub);

    // initial check
    setTimeout(() => this.updateDisplay());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['autoOptions']) {
      setTimeout(() => {
        this.updateDisplay();
      });
    }
  }

  private updateDisplay() {

    const control = this.ngControl.control;

    if (!control) return;

    const value = control.value;

    if (!value || !this.autoOptions?.length) return;

    const match = [...this.autoOptions]
    .reverse().find(item => item[this.valueKey] === value);

    if (match) {
      setTimeout(() => {
        const input = this.el.nativeElement as HTMLInputElement;
        input.value = match[this.displayKey];
      });
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}