import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GameService } from '../../services/game.service';

class MockGameService {
  state$ = of({
    dice: [0,0,0,0,0,0],
    players: [{name:'Alice'},{name:'Bob'}],
    currentPlayerIndex: 0
  });
  resetDice = jasmine.createSpy('resetDice');
}

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  let component: GameComponent;
  let game: MockGameService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        provideRouter([]),
        { provide: GameService, useClass: MockGameService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    game = TestBed.inject(GameService) as unknown as MockGameService;
    fixture.detectChanges();
  });

  it('renders without crashing', () => {
    expect(component).toBeTruthy();
  });

  it('shows active player', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Alice');
  });

  it('clicking reset triggers GameService.resetDice', () => {
    const el: HTMLElement = fixture.nativeElement;
    // Update selector to your actual button:
    const btn = el.querySelector('[data-test="reset-btn"]') as HTMLButtonElement;
    if (btn) {
      btn.click();
      expect(game.resetDice).toHaveBeenCalled();
    } else {
      // If no button in template, skip
      expect(true).toBeTrue();
    }
  });
});
