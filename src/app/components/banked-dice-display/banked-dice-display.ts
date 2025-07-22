import {Component, inject, Input} from '@angular/core';
import {ScoreOption} from '../../interfaces/score-option';
import {DiceService} from '../../services/dice.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-banked-dice-display',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './banked-dice-display.html',
  styleUrls: ['./banked-dice-display.scss', '../../shared-styles/sharedStyles.scss']
})
export class BankedDiceDisplay {
  private diceService = inject(DiceService);

  @Input() bankedThisTurn!: ScoreOption[];

  getDieImage(value: number) {
    return this.diceService.getDieImage(value);
  }
}
