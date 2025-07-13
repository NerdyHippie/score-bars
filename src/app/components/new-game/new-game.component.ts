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
  players: { name: string }[] = [ { name: '' }, { name: '' } ];
  joinedPlayers: { name: string }[] = [];
  shareLink: string = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);

  ngOnInit(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;
    this.playerName = this.route.snapshot.queryParamMap.get('playerName') ?? 'Player';

    if (this.mode === 'remote') {
      this.gameId = doc(collection(this.firestore, 'games')).id;
      this.shareLink = `${window.location.origin}/join-game?mode=remote&gameId=${this.gameId}`;

      const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
      setDoc(lobbyRef, {
        players: [{ name: this.playerName }],
        createdAt: serverTimestamp(),
        mode: 'remote'
      });

      // Real-time sync of joined players
      onSnapshot(lobbyRef, (snapshot) => {
        const data = snapshot.data();
        this.joinedPlayers = data?.['players'] ?? [];
      });
    }
  }

  addPlayerField() {
    this.players.push({ name: '' });
    setTimeout(() => {
      const inputs = this.playerInputs.toArray();
      const lastInput = inputs[inputs.length - 1];
      lastInput?.nativeElement?.focus();
    }, 100);
  }

  submitLocalGame() {
    const filled = this.players.filter(p => p.name.trim());
    if (filled.length >= 2) {
      const newGameId = doc(collection(this.firestore, 'games')).id;
      const gameRef = doc(this.firestore, `games/${newGameId}`);
      setDoc(gameRef, {
        players: filled,
        createdAt: serverTimestamp(),
        mode: 'local'
      }).then(() => this.router.navigate(['/game', newGameId]));
    }
  }

  submitSoloGame() {
    const newGameId = doc(collection(this.firestore, 'games')).id;
    const gameRef = doc(this.firestore, `games/${newGameId}`);
    setDoc(gameRef, {
      players: [{ name: this.playerName }],
      createdAt: serverTimestamp(),
      mode: 'solo'
    }).then(() => this.router.navigate(['/game', newGameId]));
  }

  startRemoteGame() {
    const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
    const gameRef = doc(this.firestore, `games/${this.gameId}`);
    this.loading = true;
    this.errorMessage = '';

    setDoc(gameRef, {
      players: this.joinedPlayers,
      createdAt: serverTimestamp(),
      mode: 'remote'
    })
      .then(() => updateDoc(lobbyRef, { started: true }).then(() => this.router.navigate(['/game', this.gameId])))
      .catch((err) => {
        console.error('Error starting game:', err);
        this.errorMessage = 'Failed to start game. Please try again.';
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
