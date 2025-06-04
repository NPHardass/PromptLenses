import { TestBed } from '@angular/core/testing';

import { AuthorChartService } from './author-chart.service';

describe('AuthorChartService', () => {
  let service: AuthorChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
