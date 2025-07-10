// src/app/components/game/game.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';

import { MatChipsModule } from '@angular/material/chips';
import { Game } from '../../models/game.model';
import { generateDice, getScoreOptions } from '../../utils/scoring';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [ CommonModule, MatChipsModule ],
})
export class GameComponent implements OnInit {
  gameId!: string;
  game!: Game;
  players: any[] = [];
  scores: number[] = [];
  currentPlayerIndex = 0;
  dice: number[] = [];
  rolling = false;
  turnScore = 0;
  hasRolled = false;
  scoreOptions: any[] = [];
  bankedDice: number[] = [];
  noScoreMessage = false;
  allDiceScoredMessage = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private router: Router
  ) {}

  async ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('id')!;
    const ref = doc(this.firestore, 'games', this.gameId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      this.game = snap.data() as Game;
      this.players = this.game.players || [];
      this.scores = this.game.scores || Array(this.players.length).fill(0);
    }
    this.resetTurn();
  }

  resetTurn() {
    this.turnScore = 0;
    this.dice = generateDice();
    this.scoreOptions = [];
    this.bankedDice = [];
    this.hasRolled = false;
    this.rolling = false;
    this.noScoreMessage = false;
    this.allDiceScoredMessage = false;
  }

  rollDice() {
    if (this.rolling || (this.hasRolled && this.bankedDice.length === 0)) return;

    this.rolling = true;
    this.dice = generateDice(this.bankedDice.length === 6 ? [] : this.dice.filter(d => !this.bankedDice.includes(d)));
    setTimeout(() => {
      this.rolling = false;
      this.hasRolled = true;
      this.bankedDice = [];
      this.scoreOptions = getScoreOptions(this.dice);
      if (this.scoreOptions.length === 0) {
        this.noScoreMessage = true;
      } else if (this.scoreOptions.reduce((acc, opt) => acc + opt.dice.length, 0) === 6) {
        this.allDiceScoredMessage = true;
      }
    }, 800);
  }

  bank(option: any) {
    this.bankedDice.push(...option.dice);
    this.turnScore += option.score;
    this.scoreOptions = getScoreOptions(this.dice.filter(d => !this.bankedDice.includes(d)));
    this.noScoreMessage = this.scoreOptions.length === 0;
    this.allDiceScoredMessage = this.bankedDice.length === 6 && this.scoreOptions.length > 0;
  }

  async endTurn() {
    if (this.noScoreMessage) {
      this.turnScore = 0;
    }

    if (this.turnScore >= 500 || this.scores[this.currentPlayerIndex] > 0) {
      this.scores[this.currentPlayerIndex] += this.turnScore;
    }

    const ref = doc(this.firestore, 'games', this.gameId);
    await updateDoc(ref, {
      scores: this.scores,
      turns: arrayUnion({
        playerIndex: this.currentPlayerIndex,
        score: this.turnScore,
        dice: this.dice,
        bankedDice: this.bankedDice
      })
    });

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.resetTurn();
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
