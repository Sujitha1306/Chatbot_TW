import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageShiftMasterComponent } from './manage-shift-master.component';

describe('ManageShiftMasterComponent', () => {
  let component: ManageShiftMasterComponent;
  let fixture: ComponentFixture<ManageShiftMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageShiftMasterComponent]
    });
    fixture = TestBed.createComponent(ManageShiftMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
