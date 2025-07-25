import {Component, EventEmitter, inject, Input, Output, OnInit} from '@angular/core';
import {DiceService} from '../../services/dice.service';
// import {ScoreOption} from '../../interfaces/score-option';
import {GameState} from '../../interfaces/game-state';
import {CommonModule} from '@angular/common';
import {ScoreOption} from '../../interfaces/score-option';
import {doc, Firestore, updateDoc} from '@angular/fire/firestore';
import {GameService} from '../../services/game.service';

@Component({
  selector: 'app-score-options-display',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './score-options-display.html',
  styleUrls: ['./score-options-display.scss', '../../shared-styles/sharedStyles.scss']
})
export class ScoreOptionsDisplay implements OnInit {
  private diceService = inject(DiceService);
  private firestore = inject(Firestore);
  private gameService = inject(GameService);

  //@Input() gameState!: GameState
  @Input() myTurn: boolean = false;
  /*@Output() calcScores = new EventEmitter<void>();
  @Output() diceReset = new EventEmitter<boolean | void>();*/

  gameState: GameState = this.gameService.gameState.value

  ngOnInit(): void {
    this.gameService.gameState.subscribe(state => this.gameState = state);
  }

  getDieImage(value: number) {
    return this.diceService.getDieImage(value);
  }

  bank(option: ScoreOption) {
    const state = this.gameService.gameState.value;
    if (state.gameOver || !this.myTurn || state.bankedDice.length + option.dice.length > 6) return;

    state.turnScore += option.score;
    console.log(`[bank] turnScore: ${state.turnScore} (${option.dice})`);
    option.dice.forEach(val => {
      const index = state.dice.indexOf(val);
      if (index > -1) state.dice.splice(index, 1);
      state.bankedDice.push(val);
    });
    console.log(`[bank] dice: ${state.dice}`);
    console.log(`[bank] bankedDice: ${state.bankedDice}`);

    this.gameService.calculateScoringOptions();
    console.log(`[bank] scoringOptions: ${JSON.stringify(state.scoringOptions)}`);

    if (this.myTurn) {
      state.bankedThisTurn.push(option)
      console.log(`[bank] bankedThisTurn: ${state.bankedThisTurn}`)

      if (state.gameMode === 'remote') {
        this.persistGameState();
      }
    }
    state.bankedSinceLastRoll = true;

    if (state.bankedDice.length === 6) {
      console.log(`[bank] roll again`)
      this.gameService.resetDice(true);
      state.bankedDice = [];
      state.allDiceScoredMessage = true;
    }
    this.gameService.gameState.next(state);
  }



  persistGameState() {
    console.log('[persistGameState] saving dice, bankedDice, scoringOptions');
    const state = this.gameService.gameState.value;
    updateDoc(doc(this.firestore, `games/${state.gameId}`), {
      activeDice: state.dice,
      activeBankedDice: state.bankedThisTurn,
      activeScoringOptions: state.scoringOptions
    });
  }

}
