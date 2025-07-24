import { Component, OnInit, QueryList, ViewChildren, ElementRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  onSnapshot
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {AuthService} from '../../services/auth.service';
import {Player} from '../../interfaces/player';

@Component({
  selector: 'app-new-game',
  standalone: true,
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class NewGameComponent implements OnInit {
  loading: boolean = false;
  errorMessage: string = '';
  @ViewChildren('playerInput') playerInputs!: QueryList<ElementRef>;

  gameMode: 'remote' | 'local' | 'solo' | null = null;
  playerName: string = '';
  gameId: string = '';
  players: Player[] = [ { name: 'Player 1', uid: '1', score: 0, eliminated: false }, { name: 'Player 2', uid: '2', score: 0, eliminated: false } ];
  joinedPlayers: Player[] = [];
  shareLink: string = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.gameMode = this.route.snapshot.queryParamMap.get('mode') as any;
    this.playerName = this.route.snapshot.queryParamMap.get('playerName') ?? 'Player';

    if (this.gameMode === 'remote') {
      this.gameId = doc(collection(this.firestore, 'games')).id;
      this.shareLink = `${window.location.origin}/join-game?mode=remote&gameId=${this.gameId}`;

      const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
      setDoc(lobbyRef, {
        players: [{ name: this.playerName, uid: this.authService.getCurrentUserId(), score: 0, eliminated: false }],
        createdAt: serverTimestamp(),
        gameMode: 'remote'
      });

      // Real-time sync of joined players
      onSnapshot(lobbyRef, (snapshot) => {
        const data = snapshot.data();
        this.joinedPlayers = data?.['players'] ?? [];
      });
    } else if (this.gameMode === 'solo') {
      this.players = [{ name: this.playerName, uid: this.authService.getCurrentUserId(), score: 0, eliminated: false }];
    }
  }

  addPlayerField() {
    const newPlayerNum = this.players.length + 1;
    this.players.push({ name: `Player ${newPlayerNum}`, uid: `${newPlayerNum}`, score: 0, eliminated: false });
    setTimeout(() => {
      const inputs = this.playerInputs.toArray();
      const lastInput = inputs[inputs.length - 1];
      lastInput?.nativeElement?.focus();
    }, 100);
  }

  createGame(gameMode: string) {
    this.errorMessage = '';

    const newGameId = (gameMode === 'remote') ? this.gameId : doc(collection(this.firestore, 'games')).id;
    const gameRef = doc(this.firestore, `games/${newGameId}`);

    const players = gameMode === 'remote' ? this.joinedPlayers : this.players;
    const firstPlayerId = players[0]?.uid ?? null;

    setDoc(gameRef, {
      players: players,
      createdAt: serverTimestamp(),
      createdBy: this.authService.getCurrentUserId(),
      gameMode,
      currentPlayerIndex: 0,
      currentPlayerId: firstPlayerId
    }).then(() => {
      if (gameMode === 'remote') {
        const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
        updateDoc(lobbyRef, { started: true }).then(() => this.router.navigate(['/game', this.gameId]));

      } else {
        this.router.navigate(['/game', newGameId])
      }
    }).catch((err) => {
      console.error('Error starting game:', err);
      this.errorMessage = 'Failed to start game. Please try again.';
    }).finally(() => {
      this.loading = false;
    });
  }

  submitLocalGame() {
    if (this.players.length >= 2) {
      this.createGame('local');
    } else {
      this.errorMessage = 'Please add another player before starting.'
    }
  }

  submitSoloGame() {
    this.createGame('solo');
  }

  startRemoteGame() {
    this.loading = true;
    this.createGame('remote')
  }
}
