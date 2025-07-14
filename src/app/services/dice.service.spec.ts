import { TestBed } from '@angular/core/testing';

import { DiceService } from './dice.service';

describe('DiceService', () => {
  let service: DiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('rollDie returns value between 1 and 6', () => {
    const value = service.rollDie();
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(6);
  });

  it('rollDice returns requested number of dice', () => {
    const result = service.rollDice(4);
    expect(result.length).toBe(4);
    result.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    });
  });

  it('rollAllDice returns six dice', () => {
    const result = service.rollAllDice();
    expect(result.length).toBe(6);
  });

  it('getReadyDice returns six zeros', () => {
    expect(service.getReadyDice()).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
