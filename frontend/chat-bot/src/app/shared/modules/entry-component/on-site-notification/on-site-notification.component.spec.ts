import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnSiteNotificationComponent } from './on-site-notification.component';

describe('OnSiteNotificationComponent', () => {
  let component: OnSiteNotificationComponent;
  let fixture: ComponentFixture<OnSiteNotificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OnSiteNotificationComponent]
    });
    fixture = TestBed.createComponent(OnSiteNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
