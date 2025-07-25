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

  describe('getScoringOptions', () => {
    it('detects a 1-6 straight', () => {
      const dice = [1, 2, 3, 4, 5, 6];
      const options = service.getScoringOptions(dice);
      expect(options).toEqual([
        { label: '1-6 Straight', score: 5000, dice: dice }
      ]);
    });

    it('detects 3 pairs', () => {
      const dice = [1, 1, 2, 2, 3, 3];
      const options = service.getScoringOptions(dice);
      expect(options).toEqual([
        { label: '3 Pairs', score: 1250, dice: dice }
      ]);
    });

    it('detects triples and singles', () => {
      const dice = [1, 1, 1, 5];
      const options = service.getScoringOptions(dice);
      expect(options).toContainEqual({ label: "3 x 1's", score: 1000, dice: [1, 1, 1] });
      expect(options).toContainEqual({ label: '5', score: 50, dice: [5] });
    });

    it('returns empty array when no score possible', () => {
      const options = service.getScoringOptions([2, 3, 4]);
      expect(options).toEqual([]);
    });
  });
});
