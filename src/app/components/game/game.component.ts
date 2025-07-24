import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, updateDoc, arrayUnion, docData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { PrettyJsonPipe } from '../../pipes/pretty-json-pipe';
import { DiceService } from '../../services/dice.service';
import { ScoringService } from '../../services/scoring.service';
import { AuthService } from '../../services/auth.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {GameState} from '../../interfaces/game-state';
import {Player} from '../../interfaces/player';
import {DiceDisplay} from '../dice-display/dice-display';
import {BankedDiceDisplay} from '../banked-dice-display/banked-dice-display';
import {ScoreOptionsDisplay} from '../score-options-display/score-options-display';
import {GameService} from '../../services/game.service';

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  imports: [CommonModule, MatButtonModule, MatChipsModule, FormsModule, PrettyJsonPipe, DiceDisplay, BankedDiceDisplay, ScoreOptionsDisplay],
  providers: [DiceService, ScoringService]
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly TARGET_SCORE = 10000;
  private readonly ENTRY_THRESHOLD = 500;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private diceService = inject(DiceService);
  private authService = inject(AuthService);
  private gameService = inject(GameService)

  gameSub!: Subscription;

  myPlayerId: string = '';
  myTurn = true;

  gameState: BehaviorSubject<GameState> = this.gameService.gameState

  displayDice: number[] = []; // used for randomized visuals

  ngOnInit() {
    this.gameService.gameState.subscribe(gameState => {
      const gameId = this.route.snapshot.paramMap.get('id') ?? '';
      if (gameId !== gameState.gameId) {
        this.resetGame(gameId);
      }
    })




    /*this.gameState.gameOver = false;
    this.gameState.winnerName = '';
    this.gameState.gameId = this.route.snapshot.paramMap.get('id') ?? '';*/

  }

  resetGame(gameId: string): void {
    const gameState = {
      ...this.gameState.getValue(),
      gameOver: false,
      winnerName: '',
    }
    this.gameState.next(gameState);

    const gameRef = doc(this.firestore, `games/${this.gameState.gameId}`);

    this.gameSub = docData(gameRef).subscribe((data: any) => {
      console.log('[Game] game data in ngOnInit', data);
      this.gameState.gameMode = data.gameMode;

      if (!this.myPlayerId) {
        this.myPlayerId = this.gameState.gameMode === 'local' ? '1' : this.authService.getCurrentUserId();
      }

      this.updateGameState(data);

      this.myTurn = this.gameState.gameMode === 'local' || this.gameState.currentPlayerId === this.myPlayerId;

      console.log(`[game] hasRolled: ${this.gameState.hasRolled}`);
      console.log(`[game] myTurn: ${this.myTurn}`);
      if (!this.gameState.hasRolled) {
        if (this.myTurn) {
          this.resetDice();
        } else {
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
  goHome() {
    this.router.navigate(['/home']);
  }
  getActivePlayerName() {
    return this.gameService.getActivePlayerName()
  }



  resetDice(reroll: boolean = false) {
    this.gameService.resetDice(reroll);
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

    console.log(`[game] start rolling`);
    setTimeout(() => {
      // this.stopRandomizingDice();
      console.log(`[game] stop rolling ${JSON.stringify(newRoll)}`);
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
    this.gameService.calculateScoringOptions();
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
