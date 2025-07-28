import {inject, Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {GameState} from '../interfaces/game-state';
import {DiceService} from './dice.service';
import {ScoringService} from './scoring.service';
import {doc, docData, Firestore} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);
  private firestore = inject(Firestore);


  private initialState: GameState = {
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

  public gameState = new BehaviorSubject<GameState>(this.initialState);

  constructor() { }

  getActivePlayerName() {
    const state = this.gameState.value;
    return state.players[state.currentPlayerIndex]?.name || 'error'
  }

  calculateScoringOptions() {
    const state = this.gameState.value;
    state.scoringOptions = this.scoringService.getScoringOptions(state.dice);
    this.gameState.next(state);
  }

  loadGame(gameId: string) {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    return docData(gameRef);
  }

  resetDice(reroll: boolean = false) {
    const state = this.gameState.value;
    state.dice = this.diceService.getReadyDice();
    console.log(`[GameService] firing resetDice().  Reroll: ${reroll} | Dice: ${JSON.stringify(state.dice)}`);
    if (!reroll) {
      state.bankedDice = [];
      state.turnScore = 0;
      state.hasRolled = false;
      state.allDiceScoredMessage = false;
    }
    state.scoringOptions = [];
    state.noScoreMessage = false;
    state.bankedSinceLastRoll = false;
    console.log('-- updating gameState from resetDice()', state.dice);
    this.gameState.next(state);
  }

  resetGame(gameId?:string): void {
    const newState = { ...this.initialState };
    if (gameId) {
      newState.gameId = gameId;
    }
    this.gameState.next(newState);
  }
}
