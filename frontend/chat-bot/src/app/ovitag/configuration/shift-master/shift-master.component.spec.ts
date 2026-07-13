import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftMasterComponent } from './shift-master.component';

describe('ShiftMasterComponent', () => {
  let component: ShiftMasterComponent;
  let fixture: ComponentFixture<ShiftMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShiftMasterComponent]
    });
    fixture = TestBed.createComponent(ShiftMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
