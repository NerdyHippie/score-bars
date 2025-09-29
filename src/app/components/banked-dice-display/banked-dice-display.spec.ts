import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BankedDiceDisplay } from './banked-dice-display';
import { DiceService } from '../../services/dice.service';
import { ScoreOption } from '../../interfaces/score-option';

class MockDiceService {
  getDieImage = jasmine.createSpy('getDieImage').and.callFake((v: number) => `assets/mock-${v}.svg`);
}

describe('BankedDiceDisplay', () => {
  let fixture: ComponentFixture<BankedDiceDisplay>;
  let component: BankedDiceDisplay;
  let dice: MockDiceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankedDiceDisplay],
      providers: [{ provide: DiceService, useClass: MockDiceService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BankedDiceDisplay);
    component = fixture.componentInstance;
    dice = TestBed.inject(DiceService) as unknown as MockDiceService;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when no banked dice', () => {
    component.bankedThisTurn = [];
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent?.includes('Banked This Turn')).toBeFalse();
  });

  it('renders each banked option with its dice images and score', () => {
    const banked: ScoreOption[] = [
      { label: "3 x 1's", score: 1000, dice: [1, 1, 1] } as any,
      { label: '5', score: 50, dice: [5] } as any,
    ];
    component.bankedThisTurn = banked;

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;

    // Header shows up
    expect(el.textContent).toContain('Banked This Turn');

    // Dice images count = 4 total
    const imgs = el.querySelectorAll('img.scoring-die');
    expect(imgs.length).toBe(4);

    // Uses DiceService.getDieImage for each die value
    expect(dice.getDieImage).toHaveBeenCalledTimes(4);
    expect((imgs[0] as HTMLImageElement).src).toContain('assets/mock-1.svg');

    // Scores render
    const scoreLabels = Array.from(el.querySelectorAll('.score-label')).map(n => n.textContent?.trim());
    expect(scoreLabels).toEqual(['1000', '50']);
  });
});
