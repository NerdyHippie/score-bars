import { TestBed } from '@angular/core/testing';

import { ScoringService } from './scoring.service';

describe('Scoring', () => {
  let service: ScoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
