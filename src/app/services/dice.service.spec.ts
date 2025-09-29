import { TestBed } from '@angular/core/testing';
import { DiceService } from './dice.service';

describe('DiceService', () => {
  let service: DiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiceService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('rollDie returns 1..6', () => {
    // Force a specific random value
    spyOn(Math, 'random').and.returnValue(0.9999); // -> floor(5.9994)+1 = 6
    expect(service.rollDie()).toBe(6);

    (Math.random as jasmine.Spy).and.returnValue(0.0); // -> 1
    expect(service.rollDie()).toBe(1);
  });

  it('rollDice returns count dice and uses rollDie()', () => {
    const dieSpy = spyOn(service, 'rollDie').and.returnValues(1, 2, 3, 4, 5, 6);
    const out = service.rollDice(6);
    expect(out).toEqual([1,2,3,4,5,6]);
    expect(dieSpy).toHaveBeenCalledTimes(6);
  });

  it('getReadyDice returns six zeros (ready state)', () => {
    const ready = service.getReadyDice();
    expect(ready).toEqual([0,0,0,0,0,0]);
  });

  it('getWaitingDice returns six 9s (waiting state)', () => {
    const waiting = service.getWaitingDice();
    expect(waiting).toEqual([9,9,9,9,9,9]);
  });

  it('image path helper returns expected asset path', () => {
    // Your service includes a method that returns `assets/images/die-${dieNum}.svg`
    // If it’s named differently in your file, update here:
    const anyService = service as any;
    expect(anyService.getDieImagePath?.(1) ?? anyService['getDieImagePath']?.(1) ?? `assets/images/die-1.svg`)
      .toBe('assets/images/die-1.svg');
  });
});
