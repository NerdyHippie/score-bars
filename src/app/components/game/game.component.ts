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
import {ScoreOption} from '../../interfaces/score-option';
import {GameState} from '../../interfaces/game-state';
import {Player} from '../../interfaces/player';
import {DiceDisplay} from '../dice-display/dice-display';
import {BankedDiceDisplay} from '../banked-dice-display/banked-dice-display';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss', '../../shared-styles/sharedStyles.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, NgIf, NgFor, FormsModule, PrettyJsonPipe, DiceDisplay, BankedDiceDisplay],
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

  myPlayerId: string = '';
  myTurn = true;

  gameState: GameState = {
    gameId: '',
    gameMode: '',
    players: [],
    scores: [],
    currentPlayerId: '',
    currentPlayerIndex: 0,
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
    finalRoundStarterIndex: 0,
    gameOver: false,
    winnerName: '',
    bankedSinceLastRoll: true,
  }

  displayDice: number[] = []; // used for randomized visuals

  ngOnInit() {
    this.gameState.gameOver = false;
    this.gameState.winnerName = '';
    this.gameState.gameId = this.route.snapshot.paramMap.get('id') ?? '';
    const gameRef = doc(this.firestore, `games/${this.gameState.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      this.gameState.gameMode = data.mode;

      if (!this.myPlayerId) {
        this.myPlayerId = this.gameState.gameMode === 'local' ? '1' : this.authService.getCurrentUserId();
      }

      this.updateGameState(data);

      this.myTurn = this.gameState.gameMode === 'local' || this.gameState.currentPlayerId === this.myPlayerId;


      if (!this.gameState.hasRolled) {
        if (this.myTurn) {
          this.resetDice();
        } else {

          // TODO: Need to make sure we're not over-writing correct dice values here

          this.gameState.dice = this.diceService.getWaitingDice();
        }
      }
      // this.displayDice = [...this.gameState.dice];
    });
  }

  updateGameState(data: any) {
    this.gameState.players = data.players;
    // this.gameState.scores = data.scores || Array(this.gameState.players.length).fill(0);
    this.gameState.currentPlayerIndex = data.currentPlayerIndex ?? 0;
    this.gameState.currentPlayerId = data.currentPlayerId ?? 'not set';
    this.gameState.finalRound = data.finalRound || false;
    this.gameState.finalRoundStarterIndex = data.finalRoundStarterIndex ?? null;
    this.gameState.gameOver = data.gameOver || false;
    this.gameState.winnerName = data.winnerName || '';


    this.gameState.dice = data.activeDice || [];
    this.gameState.bankedThisTurn = data.activeBankedDice || [];
    this.gameState.scoringOptions = data.activeScoringOptions || [];
  }





  ngOnDestroy() {
    this.gameSub?.unsubscribe();
  }
  getDebugData(): string {

    return JSON.stringify(this.gameState);
  }
  getDieImage(value: number) {
    return this.diceService.getDieImage(value);
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
    return (!this.myTurn || this.gameState.rolling || (this.gameState.hasRolled && !this.gameState.bankedSinceLastRoll && !this.gameState.allDiceScoredMessage));
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

    // this.startRandomizingDice();

    setTimeout(() => {
      // this.stopRandomizingDice();
      this.gameState.dice = newRoll;
      this.displayDice = [...newRoll];
      this.gameState.rolling = false;
      this.calculateScoringOptions();

      if (this.myTurn && this.gameState.gameMode === 'remote') {
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

  persistGameState() {
    console.log('[persistGameState] saving dice, bankedDice, scoringOptions');
    updateDoc(doc(this.firestore, `games/${this.gameState.gameId}`), {
      activeDice: this.gameState.dice,
      activeBankedDice: this.gameState.bankedThisTurn,
      activeScoringOptions: this.gameState.scoringOptions
    });
  }

  bank(option: ScoreOption) {
    if (this.gameState.gameOver || !this.myTurn || this.gameState.bankedDice.length + option.dice.length > 6) return;

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

    if (this.myTurn) {
      this.gameState.bankedThisTurn.push(option)
      console.log(`[bank] bankedThisTurn: ${this.gameState.bankedThisTurn}`)

      if (this.gameState.gameMode === 'remote') {
        this.persistGameState();
      }
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
    if (this.gameState.gameOver || !this.myTurn || (this.gameState.turnScore === 0 && this.gameState.scoringOptions.length > 0)) return;

    const player = this.gameState.players[this.gameState.currentPlayerIndex];
    const shouldScore = player.score > 0 || this.gameState.turnScore >= this.ENTRY_THRESHOLD;
    const appliedScore = shouldScore ? this.gameState.turnScore : 0;

    player.score += appliedScore;

    const turnData = {
      player: player.name,
      score: appliedScore,
      timestamp: new Date()
    };

    this.gameState.bankedThisTurn = [];

    const gameRef = doc(this.firestore, `games/${this.gameState.gameId}`);
    const gameUpdate: any = {
      players: this.gameState.players,
      turns: arrayUnion(turnData),
      lastPlayer: this.gameState.currentPlayerIndex,
      activeBankedDice: this.gameState.bankedThisTurn
    };

    if (!this.gameState.finalRound && player.score >= this.TARGET_SCORE) {
      this.gameState.finalRound = true;
      this.gameState.finalRoundStarterIndex = this.gameState.currentPlayerIndex;
    } else if (this.gameState.finalRound) {

      const totalPlayers = this.gameState.players.length;
      const lastIndexInRound = (this.gameState.finalRoundStarterIndex! + totalPlayers - 1) % totalPlayers;
      const justFinishedLastFinalTurn = this.gameState.currentPlayerIndex === lastIndexInRound;


      // TODO: Figure out how to calculate highestScore based on player.score
      // const highestScore = Math.max(...this.gameState.scores);
      const highestScore = Math.max(...this.gameState.players.map(p => p.score))
      console.log(`Highest score: ${highestScore}`);

      const myScore = this.gameState.players[this.gameState.currentPlayerIndex].score;

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
