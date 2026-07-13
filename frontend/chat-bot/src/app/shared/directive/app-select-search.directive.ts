
import { 
  Directive, ElementRef, AfterViewInit, OnDestroy
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[matSelectSearch]'
})
export class MatSelectSearchDirective implements AfterViewInit, OnDestroy {

  searchCtrl = new FormControl('');
  private sub!: Subscription;
  private searchInput: HTMLInputElement | null = null;

  constructor(private readonly matSelect: MatSelect, private readonly el: ElementRef) { }

  ngAfterViewInit() {
    // Wait panel to open
    this.matSelect.openedChange.subscribe((opened) => {
      if (opened) {
        this.addSearchBox();
      }
    });

    // Filter logic
    this.sub = this.searchCtrl.valueChanges.subscribe(value => {
      this.filterOptions(value);
    });
  }

  addSearchBox() {
    const panel = this.matSelect.panel?.nativeElement;
    if (!panel) return;

    // ⭐ Reset filter and show all options
    this.searchCtrl.setValue('', { emitEvent: false });
    this.matSelect.options.forEach(opt => {
      const el = opt._getHostElement();
      el.style.display = '';
    });

    // Remove old search box
    panel.querySelectorAll('.custom-search-box').forEach(el => el.remove());

    const div = document.createElement('div');
    div.classList.add('custom-search-box');
    div.style.padding = '8px';
    div.style.background = '#fff';
    div.style.position = 'sticky';
    div.style.top = '0';
    div.style.zIndex = '1';

    const input = document.createElement('input');
    input.placeholder = 'Search...';
    input.style.width = 'calc(100% - 10px)';
    input.style.padding = '6px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';

    div.appendChild(input);
    panel.prepend(div);

    // Bind
    input.addEventListener('input', (event: any) => {
      this.searchCtrl.setValue(event.target.value, { emitEvent: true });
    });

    input.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation(); // Important fix
    });
    this.searchInput = input;
    setTimeout(() => {
      input.focus();
    }, 0);
  }


  filterOptions(searchValue: string) {
   const options = this.matSelect.options;

  // ⭐ If search contains ONLY spaces, show everything
  if (!searchValue || searchValue.trim() === '') {
    options.forEach(option => {
      const el = option._getHostElement();
      el.style.display = '';
    });
    return;
  }

  const search = searchValue.toLowerCase();

  options.forEach(option => {
    const value = option.viewValue.toLowerCase();
    const match = value.includes(search);

    const element = option._getHostElement();
    element.style.display = match ? '' : 'none';
  });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
