import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion, docData } from '@angular/fire/firestore';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);
  private authService = inject(AuthService);

  gameId: string = '';
  gameMode: string = '';
  players: { name: string, uid?: string }[] = [];
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
  noScoreMessage = false;
  allDiceScoredMessage = false;

  finalRound = false;
  finalRoundStarterIndex: number | null = null;
  eliminatedPlayers: Set<number> = new Set();
  gameOver = false;
  winnerName: string = '';

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameRef = doc(this.firestore, `games/${this.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      this.gameMode = data.mode;

      if (!this.myPlayerId) {
        if (this.gameMode === 'local') {
          this.myPlayerId = '1';
        } else {
          this.myPlayerId = this.authService.getCurrentUserId();
        }
      }

      this.players = data.players;
      this.scores = data.scores || Array(this.players.length).fill(0);
      this.currentPlayerIndex = data.currentPlayerIndex ?? 0;
      this.currentPlayerId = data.currentPlayerId ?? 'not set';

      this.myTurn = this.gameMode === 'local' || this.currentPlayerId === this.myPlayerId;

// If it's my turn and I haven't rolled yet, reset dice to start turn
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
  }

  rollDice() {
    if (!this.myTurn || this.rolling || (this.hasRolled && this.bankedDice.length === 0 && !this.allDiceScoredMessage)) return;

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

    setTimeout(() => {
      this.dice = newRoll;
      this.rolling = false;
      this.calculateScoringOptions();

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
    if (!this.myTurn) return;
    if (this.bankedDice.length + option.dice.length > 6) return;

    this.turnScore += option.score;
    option.dice.forEach(val => {
      const index = this.dice.indexOf(val);
      if (index > -1) this.dice.splice(index, 1);
      this.bankedDice.push(val);
    });
    this.calculateScoringOptions();

    if (this.bankedDice.length === 6) {
      this.resetDice(true);
      this.bankedDice = [];
      this.allDiceScoredMessage = true;
    }
  }

  async endTurn() {
    if (!this.myTurn) return;

    const player = this.players[this.currentPlayerIndex];
    const shouldScore = this.scores[this.currentPlayerIndex] > 0 || this.turnScore >= 500;
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


    // TODO: Debug Win conditions for final round, currently not working correctly
    if (!this.finalRound && this.scores[this.currentPlayerIndex] >= 10000) {
      this.finalRound = true;
      this.finalRoundStarterIndex = this.currentPlayerIndex;
    } else if (this.finalRound) {
      const highestScore = Math.max(...this.scores);
      this.players.forEach((_, i) => {
        if (i !== this.finalRoundStarterIndex && this.scores[i] < highestScore) {
          this.eliminatedPlayers.add(i);
        }
      });

      if (this.players.filter((_, i) => !this.eliminatedPlayers.has(i)).length === 1) {
        this.gameOver = true;
        const winnerIndex = this.scores.indexOf(Math.max(...this.scores));
        this.winnerName = this.players[winnerIndex].name;
        gameUpdate.gameIsFinished = true;
      }
    }


    let nextIndex = this.currentPlayerIndex;
    do {
      nextIndex = (nextIndex + 1) % this.players.length;
    } while (this.eliminatedPlayers.has(nextIndex));

    gameUpdate.currentPlayerIndex = nextIndex;
    gameUpdate.currentPlayerId = this.players[nextIndex].uid;


    await updateDoc(gameRef, gameUpdate);

    this.turnScore = 0;
    this.bankedDice = [];
    this.hasRolled = false;


    this.currentPlayerIndex = nextIndex;

    this.resetDice();
  }
}
