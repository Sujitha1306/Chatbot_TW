import { TestBed } from '@angular/core/testing';

import { FloatNotificationManageService } from './float-notification-manage.service';

describe('FloatNotificationManageService', () => {
  let service: FloatNotificationManageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FloatNotificationManageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
