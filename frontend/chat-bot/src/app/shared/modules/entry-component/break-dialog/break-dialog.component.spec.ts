import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakDialogComponent } from './break-dialog.component';

describe('BreakDialogComponent', () => {
  let component: BreakDialogComponent;
  let fixture: ComponentFixture<BreakDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreakDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreakDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
