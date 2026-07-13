import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaNotificationComponent } from './pwa-notification.component';

describe('PwaNotificationComponent', () => {
  let component: PwaNotificationComponent;
  let fixture: ComponentFixture<PwaNotificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PwaNotificationComponent]
    });
    fixture = TestBed.createComponent(PwaNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
