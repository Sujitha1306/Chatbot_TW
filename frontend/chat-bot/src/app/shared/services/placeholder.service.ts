
import { Directive, ElementRef, Input, Renderer2, Optional, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSelect } from '@angular/material/select';

@Directive({
  selector: '[appPlaceholder]'
})
export class AutoPlaceholderDirective implements AfterViewInit, OnChanges {
  @Input() showPlaceholder: boolean = true;
  @Input() placeholderText: string = '';

  private observer: MutationObserver | null = null;

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
    @Optional() private readonly matSelect: MatSelect
  ) { }

  ngAfterViewInit(): void {
    this.applyPlaceholderLogic();
    if (!this.matSelect) {
      this.renderer.listen(this.el.nativeElement, 'input', () => {
        this.applyFontStyle(this.el.nativeElement.value);
      });
      setTimeout(() => {
        this.applyFontStyle(this.el.nativeElement.value);
      });
      this.observer = new MutationObserver(() => {
        this.applyFontStyle(this.el.nativeElement.value);
      });

      this.observer.observe(this.el.nativeElement, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.applyPlaceholderLogic();
  }

  private applyPlaceholderLogic() {
    const placeholder = this.showPlaceholder ? this.placeholderText : '';

    if (this.matSelect) {
      this.matSelect.placeholder = placeholder;

      setTimeout(() => {
        const placeholderEl = this.el.nativeElement.querySelector('.mat-select-placeholder');
        if (placeholderEl) {
          this.renderer.setStyle(placeholderEl, 'font-style', this.showPlaceholder ? 'italic' : 'normal');
        }
      });
    } else {
      this.renderer.setAttribute(this.el.nativeElement, 'placeholder', placeholder);

      this.applyFontStyle(this.el.nativeElement.value);
    }
  }

  private applyFontStyle(value: string) {
    if (!value && this.showPlaceholder) {
      this.renderer.setStyle(this.el.nativeElement, 'font-style', 'italic');
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'font-style', 'normal');
    }
  }
}