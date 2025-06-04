import { TestBed } from '@angular/core/testing';

import { KeyWordExplanationService } from './key-word-explanation.service';

describe('KeyWordExplanationService', () => {
  let service: KeyWordExplanationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyWordExplanationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
