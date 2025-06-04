import { TestBed } from '@angular/core/testing';

import { DrawingHelpService } from './drawing-help.service';

describe('DrawingHelpService', () => {
  let service: DrawingHelpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DrawingHelpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
