import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageHolidayComponent } from './manage-holiday.component';

describe('ManageHolidayComponent', () => {
  let component: ManageHolidayComponent;
  let fixture: ComponentFixture<ManageHolidayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageHolidayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageHolidayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
