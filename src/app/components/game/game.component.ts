import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, updateDoc, arrayUnion, docData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrettyJsonPipe } from '../../pipes/pretty-json-pipe';
import { DiceService } from '../../services/dice.service';
import { ScoringService } from '../../services/scoring.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import {Player} from '../../interfaces/player';
import {ScoreOption} from '../../interfaces/score-option';
import {GameState} from '../../interfaces/game-state';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, NgIf, NgFor, FormsModule, PrettyJsonPipe],
  providers: [DiceService, ScoringService]
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly TARGET_SCORE = 10000;
  private readonly ENTRY_THRESHOLD = 500;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);
  private authService = inject(AuthService);

  gameSub!: Subscription;

  gameState: GameState = {
    gameId: '',
    gameMode: '',
    players: [],
    scores: [],
    currentPlayerIndex: 0,
    currentPlayerId: '',
    myPlayerId: '',
    myTurn: true,
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
    finalRoundStarterIndex: null,
    gameOver: false,
    winnerName: '',
    bankedSinceLastRoll: false,
  }



  ngOnInit() {
    this.gameState.gameOver = false;
    this.gameState.winnerName = '';
    this.gameState.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameRef = doc(this.firestore, `games/${this.gameState.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      this.gameState.gameMode = data.mode;

      if (!this.gameState.myPlayerId) {
        this.gameState.myPlayerId = this.gameState.gameMode === 'local' ? '1' : this.authService.getCurrentUserId();
      }

      this.gameState.players = data.players;
      this.gameState.scores = data.scores || Array(this.gameState.players.length).fill(0);
      this.gameState.currentPlayerIndex = data.currentPlayerIndex ?? 0;
      this.gameState.currentPlayerId = data.currentPlayerId ?? 'not set';
      this.gameState.finalRound = data.finalRound || false;
      this.gameState.finalRoundStarterIndex = data.finalRoundStarterIndex ?? null;
      this.gameState.gameOver = data.gameOver || false;
      this.gameState.winnerName = data.winnerName || '';
      this.gameState.myTurn = this.gameState.gameMode === 'local' || this.gameState.currentPlayerId === this.gameState.myPlayerId;

      this.gameState.dice = data.activeDice || [];
      this.gameState.bankedThisTurn = data.activeBankedDice || [];
      this.gameState.scoringOptions = data.activeScoringOptions || [];

      if (!this.gameState.hasRolled) {
        if (this.gameState.myTurn) {
          this.resetDice();
        } else {
          this.gameState.dice = this.diceService.getWaitingDice();
        }

      }
    });
  }

  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }
  getDebugData(): string {
    const debugData = {
      allDiceScoredMessage: this.gameState.allDiceScoredMessage,
      rolling: this.gameState.rolling,
      hasRolled: this.gameState.hasRolled,
      turnScore: this.gameState.turnScore,
      bankedDice: this.gameState.bankedDice,
      scoringOptions: this.gameState.scoringOptions,
      scores: this.gameState.scores,
      dice: this.gameState.dice,
    };
    return JSON.stringify(debugData);
  }
  goHome() {
    this.router.navigate(['/home']);
  }
  getActivePlayerName() {
    return this.gameState.players[this.gameState.currentPlayerIndex]?.name || 'error'
  }



  resetDice(reroll: boolean = false) {
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

  isRollAgainBlocked(): boolean {
    return (!this.gameState.myTurn || this.gameState.rolling || (this.gameState.hasRolled && !this.gameState.bankedSinceLastRoll && !this.gameState.allDiceScoredMessage));
  }

  rollDice() {
    if (this.gameState.gameOver || this.isRollAgainBlocked()) return;

    const diceToRoll = Math.max(0,
      this.gameState.allDiceScoredMessage ? 6 :
        this.gameState.dice.length === 0 ? 6 :
          6 - this.gameState.bankedDice.length
    );
    const newRoll = this.diceService.rollDice(diceToRoll);
    this.gameState.rolling = true;
    this.gameState.hasRolled = true;
    this.gameState.noScoreMessage = false;
    this.gameState.allDiceScoredMessage = false;
    this.gameState.bankedSinceLastRoll = false;

    setTimeout(() => {
      this.gameState.dice = newRoll;
      this.gameState.rolling = false;
      this.calculateScoringOptions();
      if (this.gameState.myTurn && this.gameState.gameMode === 'remote') {
        updateDoc(doc(this.firestore, `games/${this.gameState.gameId}`), {
          activeDice: this.gameState.dice,
          activeScoringOptions: this.gameState.scoringOptions
        });
      }

      if (this.gameState.scoringOptions.length === 0) {
        this.gameState.noScoreMessage = true;
        this.gameState.turnScore = 0;
      }
    }, 800);
  }

  calculateScoringOptions() {
    console.log(`[calculateScoringOptions] dice: ${this.gameState.dice}`);
    this.gameState.scoringOptions = this.scoringService.getScoringOptions(this.gameState.dice);
  }

  bank(option: { label: string, score: number, dice: number[] }) {
    if (this.gameState.gameOver || !this.gameState.myTurn || this.gameState.bankedDice.length + option.dice.length > 6) return;

    this.gameState.turnScore += option.score;
    console.log(`[bank] turnScore: ${this.gameState.turnScore} (${option.dice})`);
    option.dice.forEach(val => {
      const index = this.gameState.dice.indexOf(val);
      if (index > -1) this.gameState.dice.splice(index, 1);
      this.gameState.bankedDice.push(val);
    });
    console.log(`[bank] dice: ${this.gameState.dice}`);
    console.log(`[bank] bankedDice: ${this.gameState.bankedDice}`);

    this.calculateScoringOptions();

    console.log(`[bank] scoringOptions: ${JSON.stringify(this.gameState.scoringOptions)}`);

    if (this.gameState.myTurn && this.gameState.gameMode === 'remote') {
      this.gameState.bankedThisTurn.push(option.dice.join('|'))
      console.log(`[bank] bankedThisTurn: ${this.gameState.bankedThisTurn}`)
      updateDoc(doc(this.firestore, `games/${this.gameState.gameId}`), {
        activeDice: this.gameState.dice,
        activeBankedDice: this.gameState.bankedThisTurn,
        activeScoringOptions: this.gameState.scoringOptions
      });
    }
    this.gameState.bankedSinceLastRoll = true;

    if (this.gameState.bankedDice.length === 6) {
      console.log(`[bank] roll again`)
      this.resetDice(true);
      this.gameState.bankedDice = [];
      this.gameState.allDiceScoredMessage = true;
    }
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
    if (this.gameState.gameOver || !this.gameState.myTurn || (this.gameState.turnScore === 0 && this.gameState.scoringOptions.length > 0)) return;

    const player = this.gameState.players[this.gameState.currentPlayerIndex];
    const shouldScore = this.gameState.scores[this.gameState.currentPlayerIndex] > 0 || this.gameState.turnScore >= this.ENTRY_THRESHOLD;
    const appliedScore = shouldScore ? this.gameState.turnScore : 0;

    this.gameState.scores[this.gameState.currentPlayerIndex] += appliedScore;

    const turnData = {
      player: player.name,
      score: appliedScore,
      timestamp: new Date()
    };

    this.gameState.bankedThisTurn = [];

    const gameRef = doc(this.firestore, `games/${this.gameState.gameId}`);
    const gameUpdate: any = {
      scores: this.gameState.scores,
      turns: arrayUnion(turnData),
      lastPlayer: this.gameState.currentPlayerIndex,
      activeBankedDice: this.gameState.bankedThisTurn
    };

    if (!this.gameState.finalRound && this.gameState.scores[this.gameState.currentPlayerIndex] >= this.TARGET_SCORE) {
      this.gameState.finalRound = true;
      this.gameState.finalRoundStarterIndex = this.gameState.currentPlayerIndex;
    } else if (this.gameState.finalRound) {

      const totalPlayers = this.gameState.players.length;
      const lastIndexInRound = (this.gameState.finalRoundStarterIndex! + totalPlayers - 1) % totalPlayers;
      const justFinishedLastFinalTurn = this.gameState.currentPlayerIndex === lastIndexInRound;

      const highestScore = Math.max(...this.gameState.scores);
      const myScore = this.gameState.scores[this.gameState.currentPlayerIndex];

      if (myScore < highestScore) {
        player.eliminated = true;
        gameUpdate.players = this.gameState.players;
      }

    }

    const nextUp = this.getNextPlayer();
    const nextIndex = nextUp.nextIndex;


    const remainingPlayers = this.gameState.players.filter(player => !player.eliminated);

    if (remainingPlayers.length === 1) {
      this.gameState.gameOver = true;

      const winningPlayer = remainingPlayers[0];

      this.gameState.winnerName = winningPlayer.name;
      gameUpdate.gameIsFinished = true;
      gameUpdate.gameOver = true;
      gameUpdate.winnerName = this.gameState.winnerName;
    }

    gameUpdate.finalRound = this.gameState.finalRound;
    gameUpdate.finalRoundStarterIndex = this.gameState.finalRoundStarterIndex;
    gameUpdate.currentPlayerIndex = nextIndex;
    gameUpdate.currentPlayerId = this.gameState.players[nextIndex].uid;

    console.log(' --- gameUpdate --- ');
    console.log(gameUpdate);

    await updateDoc(gameRef, gameUpdate);

    this.gameState.turnScore = 0;
    this.gameState.bankedDice = [];
    this.gameState.hasRolled = false;
    this.gameState.bankedSinceLastRoll = false;
    this.gameState.currentPlayerIndex = nextIndex;
    this.resetDice();
  }
}
