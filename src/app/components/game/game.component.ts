import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, updateDoc, arrayUnion, docData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { PrettyJsonPipe } from '../../pipes/pretty-json-pipe';
import { DiceService } from '../../services/dice.service';
import { ScoringService } from '../../services/scoring.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import {GameState} from '../../interfaces/game-state';
import {Player} from '../../interfaces/player';
import {DiceDisplay} from '../dice-display/dice-display';
import {BankedDiceDisplay} from '../banked-dice-display/banked-dice-display';
import {ScoreOptionsDisplay} from '../score-options-display/score-options-display';
import {GameService} from '../../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, FormsModule, PrettyJsonPipe, DiceDisplay, BankedDiceDisplay, ScoreOptionsDisplay],
  providers: [DiceService, ScoringService]
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly TARGET_SCORE = 10000;
  private readonly ENTRY_THRESHOLD = 500;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private authService = inject(AuthService);
  private gameService = inject(GameService)

  gameSub!: Subscription;

  myPlayerId: string = '';
  myTurn = true;

  gameState: GameState = this.gameService.gameState.value

  displayDice: number[] = []; // used for randomized visuals

  ngOnInit() {
    this.gameService.gameState.subscribe(state => this.gameState = state);
    const state = this.gameService.gameState.value;
    state.gameOver = false;
    state.winnerName = '';
    state.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    this.gameService.gameState.next(state);
    const gameRef = doc(this.firestore, `games/${state.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      const state = this.gameService.gameState.value;
      state.gameMode = data.gameMode;

      if (!this.myPlayerId) {
        this.myPlayerId = state.gameMode === 'local' ? '1' : this.authService.getCurrentUserId();
      }

      this.updateGameState(data);

      this.myTurn = state.gameMode === 'local' || state.currentPlayerId === this.myPlayerId;

      console.log(`[game] hasRolled: ${state.hasRolled}`);
      console.log(`[game] myTurn: ${this.myTurn}`);
      if (!state.hasRolled) {
        if (this.myTurn) {
          this.resetDice();
        } else {
          state.dice = this.diceService.getWaitingDice();
        }
      }
      this.gameService.gameState.next(state);
      // this.displayDice = [...this.gameState.dice];
    });
  }

  updateGameState(data: any) {
    const state = this.gameService.gameState.value;
    state.players = data.players;
    // state.scores = data.scores || Array(state.players.length).fill(0);
    state.currentPlayerIndex = data.currentPlayerIndex ?? 0;
    state.currentPlayerId = data.currentPlayerId ?? 'not set';
    state.finalRound = data.finalRound || false;
    state.finalRoundStarterIndex = data.finalRoundStarterIndex ?? null;
    state.gameOver = data.gameOver || false;
    state.winnerName = data.winnerName || '';

    state.dice = data.activeDice || [];
    state.bankedThisTurn = data.activeBankedDice || [];
    state.scoringOptions = data.activeScoringOptions || [];
    this.gameService.gameState.next(state);
  }





  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }
  getDebugData(): string {

    return JSON.stringify(this.gameState);
  }
  goHome() {
    this.router.navigate(['/home']);
  }
  getActivePlayerName() {
    return this.gameService.getActivePlayerName()
  }



  resetDice(reroll: boolean = false) {
    this.gameService.resetDice(reroll);
  }

  isRollAgainBlocked(): boolean {
    return (!this.myTurn || this.gameState.rolling || (this.gameState.hasRolled && !this.gameState.bankedSinceLastRoll && !this.gameState.allDiceScoredMessage));
  }

  rollDice() {
    const state = this.gameService.gameState.value;
    if (state.gameOver || this.isRollAgainBlocked()) return;

    const diceToRoll = Math.max(0,
      state.allDiceScoredMessage ? 6 :
        state.dice.length === 0 ? 6 :
          6 - state.bankedDice.length
    );
    const newRoll = this.diceService.rollDice(diceToRoll);
    state.rolling = true;
    state.hasRolled = true;
    state.noScoreMessage = false;
    state.allDiceScoredMessage = false;
    state.bankedSinceLastRoll = false;
    this.gameService.gameState.next(state);

    // this.startRandomizingDice();

    console.log(`[game] start rolling`);
    setTimeout(() => {
      // this.stopRandomizingDice();
      console.log(`[game] stop rolling ${JSON.stringify(newRoll)}`);
      const s = this.gameService.gameState.value;
      s.dice = newRoll;
      this.displayDice = [...newRoll];
      s.rolling = false;
      this.calculateScoringOptions();

      if (this.myTurn && s.gameMode === 'remote') {
        updateDoc(doc(this.firestore, `games/${s.gameId}`), {
          activeDice: s.dice,
          activeScoringOptions: s.scoringOptions
        });
      }

      if (s.scoringOptions.length === 0) {
        s.noScoreMessage = true;
        s.turnScore = 0;
      }
      this.gameService.gameState.next(s);
    }, 800);
  }




  calculateScoringOptions() {
    this.gameService.calculateScoringOptions();
  }



  getNextPlayer(): { nextIndex: number, nextPlayer: Player} {
    const playerCount = this.gameState.players.length;
    const currentIndex = this.gameState.players.findIndex(p => p.uid === this.gameState.currentPlayerId);

    for (let i = 1; i <= playerCount; i++) {
      const nextIndex = (currentIndex + i) % playerCount;
      const nextPlayer = this.gameState.players[nextIndex];
      if (!nextPlayer.eliminated) {
        return {nextIndex, nextPlayer};
      }
    }

    throw ('No players found');
  }

  async endTurn() {
    const state = this.gameService.gameState.value;
    if (state.gameOver || !this.myTurn || (state.turnScore === 0 && state.scoringOptions.length > 0)) return;

    const player = state.players[state.currentPlayerIndex];
    const shouldScore = player.score > 0 || state.turnScore >= this.ENTRY_THRESHOLD;
    const appliedScore = shouldScore ? state.turnScore : 0;

    player.score += appliedScore;

    const turnData = {
      player: player.name,
      score: appliedScore,
      timestamp: new Date()
    };

    state.bankedThisTurn = [];

    const gameRef = doc(this.firestore, `games/${state.gameId}`);
    const gameUpdate: any = {
      players: state.players,
      turns: arrayUnion(turnData),
      lastPlayer: state.currentPlayerIndex,
      activeBankedDice: state.bankedThisTurn
    };

    if (!state.finalRound && player.score >= this.TARGET_SCORE) {
      state.finalRound = true;
      state.finalRoundStarterIndex = state.currentPlayerIndex;
    } else if (state.finalRound) {

      const totalPlayers = state.players.length;
      const lastIndexInRound = (state.finalRoundStarterIndex! + totalPlayers - 1) % totalPlayers;
      const justFinishedLastFinalTurn = state.currentPlayerIndex === lastIndexInRound;


      // TODO: Figure out how to calculate highestScore based on player.score
      // const highestScore = Math.max(...this.gameState.scores);
      const highestScore = Math.max(...state.players.map(p => p.score))
      console.log(`Highest score: ${highestScore}`);

      const myScore = state.players[state.currentPlayerIndex].score;

      if (myScore < highestScore) {
        player.eliminated = true;
        gameUpdate.players = state.players;
      }

    }

    const nextUp = this.getNextPlayer();
    const nextIndex = nextUp.nextIndex;


    const remainingPlayers = state.players.filter(player => !player.eliminated);

    if (remainingPlayers.length === 1) {
      state.gameOver = true;

      const winningPlayer = remainingPlayers[0];

      state.winnerName = winningPlayer.name;
      gameUpdate.gameIsFinished = true;
      gameUpdate.gameOver = true;
      gameUpdate.winnerName = state.winnerName;
    }

    gameUpdate.finalRound = state.finalRound;
    gameUpdate.finalRoundStarterIndex = state.finalRoundStarterIndex;
    gameUpdate.currentPlayerIndex = nextIndex;
    gameUpdate.currentPlayerId = state.players[nextIndex].uid;

    console.log(' --- gameUpdate --- ');
    console.log(gameUpdate);

    await updateDoc(gameRef, gameUpdate);

    state.turnScore = 0;
    state.bankedDice = [];
    state.hasRolled = false;
    state.bankedSinceLastRoll = false;
    state.currentPlayerIndex = nextIndex;
    this.gameService.gameState.next(state);
    this.resetDice();
  }
}
