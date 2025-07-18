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

  mode: 'remote' | 'local' | 'solo' | null = null;
  playerName: string = '';
  gameId: string = '';
  players: { name: string, uid: string }[] = [ { name: 'Player 1', uid: '1' }, { name: 'Player 2', uid: '2' } ];
  joinedPlayers: { name: string, uid: string, }[] = [];
  shareLink: string = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;
    this.playerName = this.route.snapshot.queryParamMap.get('playerName') ?? 'Player';

    if (this.mode === 'remote') {
      this.gameId = doc(collection(this.firestore, 'games')).id;
      this.shareLink = `${window.location.origin}/join-game?mode=remote&gameId=${this.gameId}`;

      const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
      setDoc(lobbyRef, {
        players: [{ name: this.playerName, uid: this.authService.getCurrentUserId() }],
        createdAt: serverTimestamp(),
        mode: 'remote'
      });

      // Real-time sync of joined players
      onSnapshot(lobbyRef, (snapshot) => {
        const data = snapshot.data();
        this.joinedPlayers = data?.['players'] ?? [];
      });
    } else if (this.mode === 'solo') {
      this.players = [{ name: this.playerName, uid: this.authService.getCurrentUserId() }];
    }
  }

  addPlayerField() {
    const newPlayerNum = this.players.length + 1;
    this.players.push({ name: `Player ${newPlayerNum}`, uid: `${newPlayerNum}` });
    setTimeout(() => {
      const inputs = this.playerInputs.toArray();
      const lastInput = inputs[inputs.length - 1];
      lastInput?.nativeElement?.focus();
    }, 100);
  }

  createGame(mode: string) {
    this.errorMessage = '';

    const newGameId = (mode === 'remote') ? this.gameId : doc(collection(this.firestore, 'games')).id;
    const gameRef = doc(this.firestore, `games/${newGameId}`);

    const players = mode === 'remote' ? this.joinedPlayers : this.players;
    const firstPlayerId = players[0]?.uid ?? null;

    setDoc(gameRef, {
      players: players,
      createdAt: serverTimestamp(),
      mode,
      scores: Array(players.length).fill(0),
      currentPlayerIndex: 0,
      currentPlayerId: firstPlayerId
    }).then(() => {
      if (mode === 'remote') {
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
