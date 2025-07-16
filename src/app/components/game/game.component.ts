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
import { DiceDisplayComponent } from '../dice-display/dice-display';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    NgIf,
    NgFor,
    FormsModule,
    PrettyJsonPipe,
    DiceDisplayComponent
  ],
  providers: [DiceService, ScoringService]
})
export class GameComponent implements OnInit, OnDestroy {
  gameId!: string;
  gameDoc: any;
  gameSubscription!: Subscription;

  players: any[] = [];
  scores: number[] = [];
  eliminated: boolean[] = [];
  dice: number[] = [];
  displayDice: number[] = [];
  bankedDice: number[][] = [];
  scoringOptions: any[] = [];
  bankedThisTurn: number[][] = [];

  turnScore: number = 0;
  rolling: boolean = false;
  currentPlayerIndex: number = 0;
  gameMode: 'local' | 'remote' = 'local';
  myPlayerId: string = '';
  randomizeInterval: any;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private scoringService = inject(ScoringService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.gameId = params.get('id') ?? '';
      if (!this.gameId) return;

      const gameRef = doc(this.firestore, 'games', this.gameId);
      this.gameDoc = gameRef;

      this.gameSubscription = docData(gameRef).subscribe((game: any) => {
        this.players = game.players || [];
        this.scores = game.scores || [];
        this.eliminated = game.eliminated || [];
        this.dice = game.dice || [];
        this.displayDice = [...this.dice];
        this.bankedDice = game.bankedDice || [];
        this.currentPlayerIndex = game.currentPlayerIndex || 0;
        this.turnScore = game.turnScore || 0;
        this.bankedThisTurn = game.bankedThisTurn || [];
        this.scoringOptions = this.scoringService.getScoringOptions(this.dice);
        this.rolling = game.rolling;
        this.myPlayerId = this.auth.getCurrentUserId();
      });
    });
  }

  ngOnDestroy(): void {
    this.gameSubscription?.unsubscribe();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  getActivePlayerName(): string {
    const player = this.players[this.currentPlayerIndex];
    return player ? player.name : '';
  }

  rollDice() {
    if (this.rolling) return;
    this.rolling = true;
    this.startRandomizingDice();
    setTimeout(() => {
      this.dice = this.diceService.rollDice(this.dice.length);
      this.displayDice = [...this.dice];
      this.rolling = false;
      this.scoringOptions = this.scoringService.getScoringOptions(this.dice);
    }, 1000);
  }

  bank(option: number[]) {
    this.bankedThisTurn.push(option);
    this.turnScore += this.scoringService.calculateScore(option);
    this.scoringOptions = this.scoringService.getScoringOptions(
      this.diceService.getUnbankedDice(this.dice, this.bankedThisTurn)
    );
  }

  endTurn() {
    this.bankedDice[this.currentPlayerIndex] = [];
    this.scores[this.currentPlayerIndex] += this.turnScore;
    this.turnScore = 0;
    this.bankedThisTurn = [];
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.dice = [];
    this.displayDice = [];
    this.scoringOptions = [];
  }

  startRandomizingDice() {
    this.randomizeInterval = setInterval(() => {
      this.displayDice = this.dice.map(() => Math.floor(Math.random() * 6) + 1);
    }, 75);
  }

  stopRandomizingDice() {
    clearInterval(this.randomizeInterval);
    this.randomizeInterval = null;
  }

  onAnimationDone() {
    this.stopRandomizingDice();
    this.dice = this.displayDice;
  }
}
