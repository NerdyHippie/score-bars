import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatChipsModule, MatCardModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  gameId: string = '';
  players: { name: string }[] = [];
  scores: number[] = [];
  currentPlayerIndex: number = 0;
  dice: number[] = [1, 2, 3, 4, 5, 6];
  finalRoll: number[] = [];
  rolling = false;

  constructor(private route: ActivatedRoute, private router: Router, private firestore: Firestore) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id') || '';
    const gameRef = doc(this.firestore, 'games', this.gameId);
    getDoc(gameRef).then(snapshot => {
      const data: any = snapshot.data();
      if (data) {
        this.players = data.players || [];
        this.scores = data.scores || [];
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  rollDice() {
    this.rolling = true;
    const rollDuration = 500 + Math.random() * 1000;

    // Generate final dice values once at the beginning
    this.finalRoll = this.dice.map(() => Math.floor(Math.random() * 6) + 1);

    const interval = setInterval(() => {
      this.dice = this.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      this.dice = [...this.finalRoll]; // display the final roll
      this.rolling = false;
      const score = this.calculateScore(this.finalRoll);
      this.scores[this.currentPlayerIndex] += score;
    }, rollDuration);
  }

  calculateScore(dice: number[]): number {
    const counts: { [key: number]: number } = {};
    for (const die of dice) {
      counts[die] = (counts[die] || 0) + 1;
    }

    const isStraight = [1, 2, 3, 4, 5, 6].every(n => counts[n] === 1);
    if (isStraight) return 5000;

    let score = 0;

    for (const num in counts) {
      const value = parseInt(num);
      const count = counts[value];

      if (count === 6) {
        score += value === 1 ? 4000 : 3500;
      } else if (count === 5) {
        score += value === 1 ? 3000 : 2500;
      } else if (count === 4) {
        score += value === 1 ? 2000 : 1500;
      } else if (count === 3) {
        score += value === 1 ? 1000 : value * 100;
      } else if (value === 1 || value === 5) {
        const individualValue = value === 1 ? 100 : 50;
        const remainder = count % 3;
        score += individualValue * remainder;
      }
    }

    return score;
  }
}
