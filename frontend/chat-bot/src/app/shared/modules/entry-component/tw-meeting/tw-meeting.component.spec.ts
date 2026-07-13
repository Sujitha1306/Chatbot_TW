import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwMeetingComponent } from './tw-meeting.component';

describe('TwMeetingComponent', () => {
  let component: TwMeetingComponent;
  let fixture: ComponentFixture<TwMeetingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TwMeetingComponent]
    });
    fixture = TestBed.createComponent(TwMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
