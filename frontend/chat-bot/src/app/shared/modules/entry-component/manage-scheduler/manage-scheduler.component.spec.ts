import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSchedulerComponent } from './manage-scheduler.component';

describe('ManageSchedulerComponent', () => {
  let component: ManageSchedulerComponent;
  let fixture: ComponentFixture<ManageSchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageSchedulerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
