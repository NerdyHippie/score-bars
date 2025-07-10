import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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

  async ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameDoc = await getDoc(doc(this.firestore, `games/${this.gameId}`));
    const data: any = gameDoc.data();
    this.players = data.players;
    this.scores = Array(this.players.length).fill(0);
    this.resetDice();
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  resetDice() {
    this.dice = Array(6).fill(0).map(() => this.randomDie());
    this.bankedDice = [];
    this.turnScore = 0;
    this.scoringOptions = [];
    this.hasRolled = false;
  }

  rollDice() {
    if (this.rolling) return;
    this.rolling = true;
    this.hasRolled = true;

    // Animate dice visually only
    const diceToRoll = 6 - this.bankedDice.length;
    const newRoll = Array(diceToRoll).fill(0).map(() => this.randomDie());

    setTimeout(() => {
      this.dice = newRoll;
      this.rolling = false;
      this.calculateScoringOptions();
    }, 800);
  }

  randomDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  calculateScoringOptions() {
    this.scoringOptions = [];
    const counts = Array(7).fill(0);
    this.dice.forEach(d => counts[d]++);

    // Straight
    if (this.dice.length === 6 && [1, 2, 3, 4, 5, 6].every(n => this.dice.includes(n))) {
      this.scoringOptions.push({ label: '1-6 Straight', score: 5000, dice: [...this.dice] });
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

    // All 6 banked? Reset roll opportunity
    if (this.bankedDice.length === 6) {
      this.dice = Array(6).fill(0).map(() => this.randomDie());
      this.bankedDice = [];
      this.calculateScoringOptions();
    }
  }

  endTurn() {
    this.scores[this.currentPlayerIndex] += this.turnScore;
    this.turnScore = 0;
    this.bankedDice = [];
    this.hasRolled = false;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.resetDice();
  }
}
