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

  gameId: string = '';
  gameMode: string = '';
  players: { name: string, uid?: string, eliminated: boolean }[] = [];
  scores: number[] = [];
  currentPlayerIndex: number = 0;
  currentPlayerId: string = '';
  myPlayerId: string = '';
  myTurn = true;
  gameSub!: Subscription;

  dice: number[] = [];
  rolling = false;
  hasRolled = false;

  turnScore = 0;
  scoringOptions: { label: string, score: number, dice: number[] }[] = [];
  bankedDice: number[] = [];
  bankedThisTurn: string[] = [];
  noScoreMessage = false;
  allDiceScoredMessage = false;

  finalRound = false;
  finalRoundStarterIndex: number | null = null;
  eliminatedPlayers: Set<number> = new Set();
  gameOver = false;
  winnerName: string = '';

  private bankedSinceLastRoll = false;

  ngOnInit() {
    this.gameOver = false;
    this.winnerName = '';
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameRef = doc(this.firestore, `games/${this.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      this.gameMode = data.mode;

      if (!this.myPlayerId) {
        this.myPlayerId = this.gameMode === 'local' ? '1' : this.authService.getCurrentUserId();
      }

      this.players = data.players;
      this.scores = data.scores || Array(this.players.length).fill(0);
      this.currentPlayerIndex = data.currentPlayerIndex ?? 0;
      this.currentPlayerId = data.currentPlayerId ?? 'not set';
      this.finalRound = data.finalRound || false;
      this.finalRoundStarterIndex = data.finalRoundStarterIndex ?? null;
      this.gameOver = data.gameOver || false;
      this.winnerName = data.winnerName || '';
      this.myTurn = this.gameMode === 'local' || this.currentPlayerId === this.myPlayerId;

      this.dice = data.activeDice || [];
      this.bankedThisTurn = data.activeBankedDice || [];
      this.scoringOptions = data.activeScoringOptions || [];

      if (this.myTurn && !this.hasRolled) {
        this.resetDice();
      }
    });
  }

  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }
  getDebugData(): string {
    const debugData = {
      allDiceScoredMessage: this.allDiceScoredMessage,
      rolling: this.rolling,
      hasRolled: this.hasRolled,
      turnScore: this.turnScore,
      bankedDice: this.bankedDice,
      scoringOptions: this.scoringOptions,
      scores: this.scores,
      dice: this.dice,
    };
    return JSON.stringify(debugData);
  }
  goHome() {
    this.router.navigate(['/home']);
  }
  getActivePlayerName() {
    return this.players[this.currentPlayerIndex]?.name || 'error'
  }

  resetDice(reroll: boolean = false) {
    this.dice = this.diceService.getReadyDice();
    if (!reroll) {
      this.bankedDice = [];
      this.turnScore = 0;
      this.hasRolled = false;
      this.allDiceScoredMessage = false;
    }
    this.scoringOptions = [];
    this.noScoreMessage = false;
    this.bankedSinceLastRoll = false;
  }

  isRollAgainBlocked(): boolean {
    return (!this.myTurn || this.rolling || (this.hasRolled && !this.bankedSinceLastRoll && !this.allDiceScoredMessage));
  }

  rollDice() {
    if (this.gameOver || this.isRollAgainBlocked()) return;

    const diceToRoll = Math.max(0,
      this.allDiceScoredMessage ? 6 :
        this.dice.length === 0 ? 6 :
          6 - this.bankedDice.length
    );
    const newRoll = this.diceService.rollDice(diceToRoll);
    this.rolling = true;
    this.hasRolled = true;
    this.noScoreMessage = false;
    this.allDiceScoredMessage = false;
    this.bankedSinceLastRoll = false;

    setTimeout(() => {
      this.dice = newRoll;
      this.rolling = false;
      this.calculateScoringOptions();
      if (this.myTurn && this.gameMode === 'remote') {
        updateDoc(doc(this.firestore, `games/${this.gameId}`), {
          activeDice: this.dice,
          activeScoringOptions: this.scoringOptions
        });
      }

      if (this.scoringOptions.length === 0) {
        this.noScoreMessage = true;
        this.turnScore = 0;
      }
    }, 800);
  }

  calculateScoringOptions() {
    this.scoringOptions = this.scoringService.getScoringOptions(this.dice);
  }

  bank(option: { label: string, score: number, dice: number[] }) {
    if (this.gameOver || !this.myTurn || this.bankedDice.length + option.dice.length > 6) return;

    this.turnScore += option.score;
    option.dice.forEach(val => {
      const index = this.dice.indexOf(val);
      if (index > -1) this.dice.splice(index, 1);
      this.bankedDice.push(val);
    });
    this.calculateScoringOptions();
    if (this.myTurn && this.gameMode === 'remote') {
      console.log(this.bankedThisTurn)
      this.bankedThisTurn.push(option.dice.join('|'))
      console.log(this.bankedThisTurn)
      updateDoc(doc(this.firestore, `games/${this.gameId}`), {
        activeBankedDice: this.bankedThisTurn,
        activeScoringOptions: this.scoringOptions
      });
    }
    this.bankedSinceLastRoll = true;

    if (this.bankedDice.length === 6) {
      this.resetDice(true);
      this.bankedDice = [];
      this.allDiceScoredMessage = true;
    }
  }

  getNextPlayer(): { nextIndex: number, nextPlayer: { name: string; uid?: string; eliminated: boolean }} {
    const playerCount = this.players.length;
    const currentIndex = this.players.findIndex(p => p.uid === this.currentPlayerId);

    for (let i = 1; i <= playerCount; i++) {
      const nextIndex = (currentIndex + i) % playerCount;
      const nextPlayer = this.players[nextIndex];
      if (!nextPlayer.eliminated) {
        return {nextIndex, nextPlayer};
      }
    }

    throw ('No players found');
  }

  async endTurn() {
    if (this.gameOver || !this.myTurn || (this.turnScore === 0 && this.scoringOptions.length > 0)) return;

    const player = this.players[this.currentPlayerIndex];
    const shouldScore = this.scores[this.currentPlayerIndex] > 0 || this.turnScore >= this.ENTRY_THRESHOLD;
    const appliedScore = shouldScore ? this.turnScore : 0;

    this.scores[this.currentPlayerIndex] += appliedScore;

    const turnData = {
      player: player.name,
      score: appliedScore,
      timestamp: new Date()
    };

    const gameRef = doc(this.firestore, `games/${this.gameId}`);
    const gameUpdate: any = {
      scores: this.scores,
      turns: arrayUnion(turnData),
      lastPlayer: this.currentPlayerIndex
    };

    if (!this.finalRound && this.scores[this.currentPlayerIndex] >= this.TARGET_SCORE) {
      this.finalRound = true;
      this.finalRoundStarterIndex = this.currentPlayerIndex;
    } else if (this.finalRound) {

      const totalPlayers = this.players.length;
      const lastIndexInRound = (this.finalRoundStarterIndex! + totalPlayers - 1) % totalPlayers;
      const justFinishedLastFinalTurn = this.currentPlayerIndex === lastIndexInRound;

      const highestScore = Math.max(...this.scores);
      const myScore = this.scores[this.currentPlayerIndex];

      if (myScore < highestScore) {
        player.eliminated = true;
        gameUpdate.players = this.players;
      }

    }

    const nextUp = this.getNextPlayer();
    const nextIndex = nextUp.nextIndex;


    const remainingPlayers = this.players.filter(player => !player.eliminated);

    if (remainingPlayers.length === 1) {
      this.gameOver = true;

      const winningPlayer = remainingPlayers[0];

      this.winnerName = winningPlayer.name;
      gameUpdate.gameIsFinished = true;
      gameUpdate.gameOver = true;
      gameUpdate.winnerName = this.winnerName;
    }

    gameUpdate.finalRound = this.finalRound;
    gameUpdate.finalRoundStarterIndex = this.finalRoundStarterIndex;
    gameUpdate.currentPlayerIndex = nextIndex;
    gameUpdate.currentPlayerId = this.players[nextIndex].uid;

    await updateDoc(gameRef, gameUpdate);

    this.turnScore = 0;
    this.bankedDice = [];
    this.hasRolled = false;
    this.bankedSinceLastRoll = false;
    this.currentPlayerIndex = nextIndex;
    this.resetDice();
  }
}
