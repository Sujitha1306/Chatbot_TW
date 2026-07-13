import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolidaySchedulerComponent } from './holiday-scheduler.component';

describe('HolidaySchedulerComponent', () => {
  let component: HolidaySchedulerComponent;
  let fixture: ComponentFixture<HolidaySchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HolidaySchedulerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HolidaySchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
