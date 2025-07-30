import {Component, inject, Input, SimpleChanges} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DiceService} from '../../services/dice.service';
import {DebugService} from '../../services/debug.service';

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
  private debug = inject(DebugService);
  private randomizeInterval: any = null;

  @Input() dice!: number[];
  @Input() rolling: boolean = false;
  // @Input() gameState!: GameState;

  displayDice: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.debug.msg('[ngOnChanges]', changes);

    if (changes['rolling']) {
      if (this.rolling) {
        this.startRandomizingDice();
      } else {
        this.stopRandomizingDice();
      }
    }

    if (changes['dice']) {
      this.displayDice = changes['dice'].currentValue;
    }
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

