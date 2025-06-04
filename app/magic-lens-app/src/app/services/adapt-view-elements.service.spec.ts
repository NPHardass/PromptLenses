import { TestBed } from '@angular/core/testing';

import { AdaptViewElementsService } from './adapt-view-elements.service';

describe('AdaptViewElementsService', () => {
  let service: AdaptViewElementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdaptViewElementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
