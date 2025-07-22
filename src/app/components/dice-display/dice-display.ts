import {Component, inject, Input, SimpleChanges} from '@angular/core';
import { GameState } from '../../interfaces/game-state';
import {NgForOf} from '@angular/common';
import {DiceService} from '../../services/dice.service';

@Component({
  selector: 'app-dice-display',
  imports: [
    NgForOf
  ],
  standalone: true,
  templateUrl: './dice-display.html',
  styleUrl: './dice-display.scss'
})
export class DiceDisplay {
  private diceService = inject(DiceService);
  private randomizeInterval: any = null;

  @Input() dice!: number[];
  @Input() rolling: boolean = false;
  // @Input() gameState!: GameState;

  displayDice: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[ngOnChanges]', changes);

    if (changes['rolling']) {
      if (this.rolling) {
        this.startRandomizingDice();
      } else {
        this.stopRandomizingDice();
      }
    }

    /*if (changes['gameState']) {
      console.log(`[ngOnChanges] previous dice: ${changes['gameState'].previousValue}`)
      console.log(`[ngOnChanges] current dice: ${changes['gameState'].currentValue.dice}`, [...changes['gameState'].currentValue.dice]);
      if (changes['gameState'].currentValue['dice'] !== changes['gameState'].previousValue?.dice) {
        this.displayDice = this.gameState.dice;
        console.log('[ngOnChanges] dice were changed', this.displayDice)
        console.log('[ngOnChanges] dice were changed', this.displayDice)
      }
    }*/
  }

  getDieImage(value: number) {
    return this.diceService.getDieImage(value);
  }

  startRandomizingDice() {
    this.randomizeInterval = setInterval(() => {
      this.displayDice = this.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }, 75);
  }

  stopRandomizingDice() {
    clearInterval(this.randomizeInterval);
    this.randomizeInterval = null;
  }
}

