import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventStatusTrackingComponent } from './event-status-tracking.component';

describe('EventStatusTrackingComponent', () => {
  let component: EventStatusTrackingComponent;
  let fixture: ComponentFixture<EventStatusTrackingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventStatusTrackingComponent]
    });
    fixture = TestBed.createComponent(EventStatusTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
