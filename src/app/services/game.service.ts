import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
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

  public gameStateSubject = new BehaviorSubject<GameState>(this.initialState);
  public gameState$ = this.gameStateSubject.asObservable();

  private gameSub!: Subscription

  constructor() { }

  get gameState(): GameState {
    return this.gameStateSubject.value;
  }

  updateGameState(patch: Partial<GameState>) {
    console.log('[GameService | updateGameState] patch data:', patch);
    const newState = { ...this.gameState, ...patch };
    this.gameStateSubject.next(newState);
  }

  getActivePlayerName() {
    const state = this.gameStateSubject.value;
    return state.players[state.currentPlayerIndex]?.name || 'error'
  }

  calculateScoringOptions() {
    const state = this.gameStateSubject.value;
    state.scoringOptions = this.scoringService.getScoringOptions(state.dice);
    console.log('[gameState update] from calculateScoringOptions', state.dice);
    this.updateGameState(state);
  }

  loadGame(gameId: string) {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    this.gameSub = docData(gameRef).subscribe(gameData => {
      console.log('[GameService | loadGame] gameData', gameData);
      if (gameData) {
        if (!gameData['gameId']) {
          console.log('[GameService | loadGame] gameId not found, do setup');
          gameData['gameId'] = gameId;
          this.setupGameState(gameData);
        } else {
          console.log(`[GameService | loadGame] gameId is ${gameId}, load without setup`);
          this.updateGameState(gameData as Partial<GameState>);
        }

      }

    });
  }

  setupGameState(data: any) {
    console.log('[updateGameState]');
    /*console.log(JSON.stringify({...data}));
    console.log(JSON.stringify({...this.gameService.gameState}));*/

    const updatePackage = { ...data }

    /*const updatedState = { ...this.gameService.gameState, ...data };
    console.log('== Dice', updatedState.dice);*/
    updatePackage.currentPlayerIndex = updatePackage.currentPlayerIndex ?? 0;
    updatePackage.currentPlayerId = updatePackage.currentPlayerId ?? 'not set';
    updatePackage.finalRound = updatePackage.finalRound || false;
    updatePackage.finalRoundStarterIndex = updatePackage.finalRoundStarterIndex ?? null;
    updatePackage.gameOver = updatePackage.gameOver || false;
    updatePackage.winnerName = updatePackage.winnerName || '';

    // updatedState.dice = updatedState.dice || [];
    updatePackage.bankedThisTurn = updatePackage.activeBankedDice || [];
    updatePackage.scoringOptions = updatePackage.activeScoringOptions || [];

    console.log('[GameService | setupGameState] updatePackage', updatePackage);
    this.updateGameState(updatePackage);
  }

  resetDice(reroll: boolean = false) {

    let updatePkg = {
      dice: this.diceService.getReadyDice(),
      scoringOptions: [],
      noScoreMessage: false,
      bankedSinceLastRoll: false,
    }
    console.log(`[GameService] firing resetDice().  Reroll: ${reroll} | Dice: ${JSON.stringify(updatePkg.dice)}`);
    if (!reroll) {
      const rerollData = {
        bankedDice: [],
        turnScore: 0,
        hasRolled: false,
        allDiceScoredMessage: false,
      }
      updatePkg = { ...updatePkg, ...rerollData}
    }

    console.log('-- updating gameState from resetDice()', updatePkg);
    this.updateGameState(updatePkg);
  }

  resetGame(gameId?:string): void {
    const newState = { ...this.initialState };
    if (gameId) {
      newState.gameId = gameId;
    }

    console.log('[gameState update] from resetGame', newState.dice);
    this.updateGameState(newState);
  }
}
