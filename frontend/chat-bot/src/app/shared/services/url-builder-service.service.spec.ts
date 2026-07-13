import { TestBed } from '@angular/core/testing';

import { UrlBuilderServiceService } from './url-builder-service.service';

describe('UrlBuilderServiceService', () => {
  let service: UrlBuilderServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UrlBuilderServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
