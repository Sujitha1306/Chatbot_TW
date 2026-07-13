import { TestBed } from '@angular/core/testing';

import { PwaDetectionService } from './pwa-detection.service';

describe('PwaDetectionService', () => {
  let service: PwaDetectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaDetectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
