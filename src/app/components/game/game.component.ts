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
  imports: [ CommonModule, MatButtonModule, MatChipsModule, MatCardModule ],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  gameId: string = '';
  players: { name: string }[] = [];
  scores: number[] = [];
  currentPlayerIndex: number = 0;
  dice: number[] = [1, 2, 3, 4, 5, 6];
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
    const interval = setInterval(() => {
      this.dice = this.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      this.dice = this.dice.map(() => Math.floor(Math.random() * 6) + 1);
      this.rolling = false;
    }, rollDuration);
  }
}
