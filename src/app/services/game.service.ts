import {inject, Injectable} from '@angular/core';
import {GameState} from '../interfaces/game-state';
import {DiceService} from './dice.service';
import {ScoringService} from './scoring.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);

  public gameState: BehaviorSubject<GameState> = new BehaviorSubject<GameState>({
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
  });

  constructor() { }

  getActivePlayerName() {
    const gameState = this.gameState.getValue();
    if (!gameState.gameId) {
      return 'loading'
    }
    console.log(`[GameService] getActivePlayerName(): ${gameState.gameId} | ${gameState.currentPlayerIndex} : ${gameState.players[gameState.currentPlayerIndex]?.name}`, gameState.players);
    return gameState.players[gameState.currentPlayerIndex]?.name || 'error'
  }

  resetDice(reroll: boolean = false) {
    const gameState = this.gameState.getValue();
    gameState.dice = this.diceService.getReadyDice();
    console.log(`[GameService] firing resetDice().  Reroll: ${reroll} | Dice: ${JSON.stringify(gameState.dice)}`);
    if (!reroll) {
      gameState.bankedDice = [];
      gameState.turnScore = 0;
      gameState.hasRolled = false;
      gameState.allDiceScoredMessage = false;
    }
    gameState.scoringOptions = [];
    gameState.noScoreMessage = false;
    gameState.bankedSinceLastRoll = false;
    this.gameState.next(gameState);
  }

  calculateScoringOptions() {
    const gameState = this.gameState.getValue();
    gameState.scoringOptions = this.scoringService.getScoringOptions(gameState.dice);
    this.gameState.next(gameState);
  }
}
