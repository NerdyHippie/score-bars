import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DiceService} from '../../services/dice.service';
// import {ScoreOption} from '../../interfaces/score-option';
import {GameState} from '../../interfaces/game-state';
import {CommonModule} from '@angular/common';
import {ScoreOption} from '../../interfaces/score-option';
import {doc, Firestore, updateDoc} from '@angular/fire/firestore';

@Component({
  selector: 'app-score-options-display',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './score-options-display.html',
  styleUrls: ['./score-options-display.scss', '../../shared-styles/sharedStyles.scss']
})
export class ScoreOptionsDisplay {
  private diceService = inject(DiceService);
  private firestore = inject(Firestore);

  @Input() gameState!: GameState
  @Input() myTurn: boolean = false;
  @Output() calcScores = new EventEmitter<void>();
  @Output() diceReset = new EventEmitter<boolean | void>();


  getDieImage(value: number) {
    return this.diceService.getDieImage(value);
  }

  bank(option: ScoreOption) {
    if (this.gameState.gameOver || !this.myTurn || this.gameState.bankedDice.length + option.dice.length > 6) return;

    this.gameState.turnScore += option.score;
    console.log(`[bank] turnScore: ${this.gameState.turnScore} (${option.dice})`);
    option.dice.forEach(val => {
      const index = this.gameState.dice.indexOf(val);
      if (index > -1) this.gameState.dice.splice(index, 1);
      this.gameState.bankedDice.push(val);
    });
    console.log(`[bank] dice: ${this.gameState.dice}`);
    console.log(`[bank] bankedDice: ${this.gameState.bankedDice}`);

    this.calcScores.emit(); // this.calculateScoringOptions();

    console.log(`[bank] scoringOptions: ${JSON.stringify(this.gameState.scoringOptions)}`);

    if (this.myTurn) {
      this.gameState.bankedThisTurn.push(option)
      console.log(`[bank] bankedThisTurn: ${this.gameState.bankedThisTurn}`)

      if (this.gameState.gameMode === 'remote') {
        this.persistGameState();
      }
    }
    this.gameState.bankedSinceLastRoll = true;

    if (this.gameState.bankedDice.length === 6) {
      console.log(`[bank] roll again`)
      this.diceReset.emit(true);  //this.resetDice(true);
      this.gameState.bankedDice = [];
      this.gameState.allDiceScoredMessage = true;
    }
  }



  persistGameState() {
    console.log('[persistGameState] saving dice, bankedDice, scoringOptions');
    updateDoc(doc(this.firestore, `games/${this.gameState.gameId}`), {
      activeDice: this.gameState.dice,
      activeBankedDice: this.gameState.bankedThisTurn,
      activeScoringOptions: this.gameState.scoringOptions
    });
  }

}
