import {inject, Injectable} from '@angular/core';
import {GameState} from '../interfaces/game-state';
import {DiceService} from './dice.service';
import {ScoringService} from './scoring.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);

  public gameState: GameState = {
    gameId: '',
    gameMode: '',
    players: [],
    scores: [],
    currentPlayerId: '',
    currentPlayerIndex: 0,
    dice: [],
    rolling: false,
    hasRolled: false,
    turnScore: 0,
    scoringOptions: [],
    bankedDice: [],
    bankedThisTurn: [],
    noScoreMessage: false,
    allDiceScoredMessage: false,
    finalRound: false,
    finalRoundStarterIndex: 0,
    gameOver: false,
    winnerName: '',
    bankedSinceLastRoll: true,
  };

  constructor() { }

  getActivePlayerName() {
    return this.gameState.players[this.gameState.currentPlayerIndex]?.name || 'error'
  }

  resetDice(reroll: boolean = false) {
    console.log(`[GameService] firing resetDice().  Reroll: ${reroll}`);
    this.gameState.dice = this.diceService.getReadyDice();
    if (!reroll) {
      this.gameState.bankedDice = [];
      this.gameState.turnScore = 0;
      this.gameState.hasRolled = false;
      this.gameState.allDiceScoredMessage = false;
    }
    this.gameState.scoringOptions = [];
    this.gameState.noScoreMessage = false;
    this.gameState.bankedSinceLastRoll = false;
  }

  calculateScoringOptions() {
    this.gameState.scoringOptions = this.scoringService.getScoringOptions(this.gameState.dice);
  }
}
