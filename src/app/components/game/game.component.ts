

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrettyJsonPipe } from '../../pipes/pretty-json-pipe';
import { DiceService } from '../../services/dice.service';
import { ScoringService } from '../../services/scoring.service';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, NgIf, NgFor, FormsModule, PrettyJsonPipe ],
  providers: [DiceService, ScoringService]
})
export class GameComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);

  gameId: string = '';
  players: { name: string }[] = [];
  scores: number[] = [];
  currentPlayerIndex: number = 0;

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

  async ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameDoc = await getDoc(doc(this.firestore, `games/${this.gameId}`));
    const data: any = gameDoc.data();
    this.players = data.players;
    this.scores = data.scores || Array(this.players.length).fill(0);
    if (typeof data.lastPlayer === 'number') {
      this.currentPlayerIndex = (data.lastPlayer + 1) % this.players.length;
    }
    this.resetDice();
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
      this.allDiceScoredMessage = false; // only clear when not rerolling
    }
    this.scoringOptions = [];
    this.noScoreMessage = false;
  }

  rollDice() {
    console.log('[rollDice] START');
    console.log('[rollDice] rolling:', this.rolling);
    console.log('[rollDice] hasRolled:', this.hasRolled);
    console.log('[rollDice] bankedDice:', this.bankedDice);
    console.log('[rollDice] allDiceScoredMessage:', this.allDiceScoredMessage);
    console.log('[rollDice] dice before roll:', this.dice);

    if (this.rolling || (this.hasRolled && this.bankedDice.length === 0 && !this.allDiceScoredMessage)) {
      console.log('[rollDice] Exit: conditions unmet for reroll');
      return;
    }

    const diceToRoll = Math.max(0,
      this.allDiceScoredMessage ? 6 :
        this.dice.length === 0 ? 6 :
          6 - this.bankedDice.length
    );

    console.log('[rollDice] diceToRoll:', diceToRoll);

    const newRoll = this.diceService.rollDice(diceToRoll);
    this.rolling = true;
    this.hasRolled = true;
    this.noScoreMessage = false;
    this.allDiceScoredMessage = false;

    setTimeout(() => {
      this.dice = newRoll;
      this.rolling = false;
      this.calculateScoringOptions();

      console.log('[rollDice] new dice:', this.dice);
      console.log('[rollDice] scoringOptions:', this.scoringOptions);

      if (this.scoringOptions.length === 0) {
        this.noScoreMessage = true;
        this.turnScore = 0;
        console.log('[rollDice] No scoring options, setting noScoreMessage to true');
      }
    }, 800);
  }


  calculateScoringOptions() {
    this.scoringOptions = this.scoringService.getScoringOptions(this.dice);
  }

  bank(option: { label: string, score: number, dice: number[] }) {
    if (this.bankedDice.length + option.dice.length > 6) {
      console.warn('[bank] Attempted to bank more than 6 dice');
      return;
    }

    this.turnScore += option.score;
    option.dice.forEach(val => {
      const index = this.dice.indexOf(val);
      if (index > -1) this.dice.splice(index, 1);
      this.bankedDice.push(val);
    });
    this.calculateScoringOptions();

    if (this.bankedDice.length === 6) {
      this.resetDice(true);              // refresh dice
      this.bankedDice = [];             // reset for fresh reroll
      this.allDiceScoredMessage = true; // flag for next roll
    }

  }

  endTurn() {
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

    // Check for game end logic
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

    updateDoc(gameRef, gameUpdate);

    this.turnScore = 0;
    this.bankedDice = [];
    this.hasRolled = false;

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (this.eliminatedPlayers.has(this.currentPlayerIndex));

    this.resetDice();
  }
}
