import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { DiceService } from './dice.service';
import { ScoringService } from './scoring.service';
import { Firestore } from '@angular/fire/firestore';

class MockDiceService {
  getReadyDice = jasmine.createSpy('getReadyDice').and.returnValue([0,0,0,0,0,0]);
}
class MockScoringService {
  getScoringOptions = jasmine.createSpy('getScoringOptions').and.returnValue([
    { label: '1', score: 100, dice: [1] }
  ]);
}
class MockDebugService {
  msg(..._args: any[]) { /* no-op */ }
}

describe('GameService', () => {
  let service: GameService;
  let dice: MockDiceService;
  let scoring: MockScoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: DiceService, useClass: MockDiceService },
        { provide: ScoringService, useClass: MockScoringService },
        { provide: Firestore, useValue: {} }, // not used directly in these tests
        { provide: (window as any).DebugService ?? 'DebugService', useClass: MockDebugService }
      ]
    });
    service = TestBed.inject(GameService);
    dice = TestBed.inject(DiceService) as unknown as MockDiceService;
    scoring = TestBed.inject(ScoringService) as unknown as MockScoringService;
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('updateGameState merges patch and emits', () => {
    // @ ts-expect-error accessing private for test: you likely have BehaviorSubject inside
    const subj = (service as any).gameStateSubject;
    const emissions: any[] = [];
    subj.subscribe((s: any) => emissions.push(s));

    service['updateGameState']({ gameId: 'ABC', currentPlayerIndex: 0 } as any);
    service['updateGameState']({ currentPlayerIndex: 1 } as any);

    expect(emissions.at(-1)).toEqual(jasmine.objectContaining({
      gameId: 'ABC',
      currentPlayerIndex: 1
    }));
  });

  it('resetDice uses DiceService.getReadyDice()', () => {
    // @ ts-expect-error private access for test
    service.resetDice(false);
    expect(dice.getReadyDice).toHaveBeenCalled();
    // And it should put zeros into state.dice
    // @ ts-expect-error private access for test
    const latest = (service as any).gameStateSubject.value;
    expect(latest.dice).toEqual([0,0,0,0,0,0]);
  });

  it('calculateScoringOptions delegates to ScoringService and updates state', () => {
    // Seed dice into state first
    service['updateGameState']({ dice: [1,2,3,4,5,6] } as any);
    // Call
    service['calculateScoringOptions']();
    expect(scoring.getScoringOptions).toHaveBeenCalledWith([1,2,3,4,5,6]);

    const latest = (service as any).gameStateSubject.value;
    expect(latest.scoringOptions).toEqual([
      { label: '1', score: 100, dice: [1] }
    ]);
  });

  it('getActivePlayerName returns the current player’s name or "error"', () => {
    service['updateGameState']({
      players: [{id:'1', name:'Alice'}, {id:'2', name:'Bob'}],
      currentPlayerIndex: 1
    } as any);

    expect(service.getActivePlayerName()).toBe('Bob');

    service['updateGameState']({ currentPlayerIndex: 99 } as any);
    expect(service.getActivePlayerName()).toBe('error');
  });
});
