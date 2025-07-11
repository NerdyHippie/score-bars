import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, NgIf, NgFor, FormsModule]
})
export class GameComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);

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

  goHome() {
    this.router.navigate(['/home']);
  }

  resetDice(reroll: boolean = false) {
    this.dice = reroll ? Array(6).fill(0).map(() => this.randomDie()) : Array(6).fill(0);
    this.bankedDice = [];
    if (!reroll) {
      this.turnScore = 0;
      this.hasRolled = false;
    }
    this.scoringOptions = [];
    this.noScoreMessage = false;
    this.allDiceScoredMessage = false;
  }

  rollDice() {
    if (this.rolling || (this.hasRolled && this.bankedDice.length === 0)) return;

    this.rolling = true;
    this.hasRolled = true;
    this.noScoreMessage = false;
    this.allDiceScoredMessage = false;

    const diceToRoll = 6 - this.bankedDice.length;
    const newRoll = Array(diceToRoll).fill(0).map(() => this.randomDie());

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

  randomDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  calculateScoringOptions() {
    this.scoringOptions = [];
    const counts = Array(7).fill(0);
    this.dice.forEach(d => counts[d]++);

    const pairCount = counts.filter(c => c === 2).length;
    if (this.dice.length === 6 && pairCount === 3) {
      this.scoringOptions.push({ label: '3 Pairs', score: 1250, dice: [...this.dice] });
      return;
    }

    if (this.dice.length === 6 && [1, 2, 3, 4, 5, 6].every(n => this.dice.includes(n))) {
      this.scoringOptions.push({ label: '1-6 Straight', score: 5000, dice: [...this.dice] });
      return;
    }

    for (let i = 1; i <= 6; i++) {
      if (counts[i] >= 3) {
        let score = i === 1 ? 1000 : i * 100;
        if (counts[i] === 4) score = i === 1 ? 2000 : 1500;
        if (counts[i] === 5) score = i === 1 ? 3000 : 2500;
        if (counts[i] === 6) score = i === 1 ? 4000 : 3500;
        this.scoringOptions.push({ label: `${counts[i]} x ${i}'s`, score, dice: Array(counts[i]).fill(i) });
      } else if (i === 1 || i === 5) {
        for (let j = 0; j < counts[i]; j++) {
          const score = i === 1 ? 100 : 50;
          this.scoringOptions.push({ label: `${i}`, score, dice: [i] });
        }
      }
    }
  }

  bank(option: { label: string, score: number, dice: number[] }) {
    this.turnScore += option.score;
    option.dice.forEach(val => {
      const index = this.dice.indexOf(val);
      if (index > -1) this.dice.splice(index, 1);
      this.bankedDice.push(val);
    });
    this.calculateScoringOptions();

    if (this.bankedDice.length === 6) {
      this.allDiceScoredMessage = true;
      this.resetDice(true);
    }
  }

  async endTurn() {
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
    await updateDoc(gameRef, {
      scores: this.scores,
      turns: arrayUnion(turnData),
      lastPlayer: this.currentPlayerIndex
    });

    // Final round logic
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

        // Set gameIsFinished flag in Firestore
        await updateDoc(gameRef, { gameIsFinished: true });
        return;
      }
    }

    this.turnScore = 0;
    this.bankedDice = [];
    this.hasRolled = false;

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (this.eliminatedPlayers.has(this.currentPlayerIndex));

    this.resetDice();
  }
}
