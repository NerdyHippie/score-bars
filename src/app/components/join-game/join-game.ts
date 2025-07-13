import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion
} from '@angular/fire/firestore';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-join-game',
  standalone: true,
  templateUrl: './join-game.html',
  styleUrls: ['./join-game.scss'],
  imports: [CommonModule, FormsModule],
})
export class JoinGameComponent implements OnInit {
  playerName = '';
  gameId = '';
  joining = false;
  errorMessage = '';
  joinedPlayers: { name: string }[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.gameId = this.route.snapshot.queryParamMap.get('gameId') ?? '';
    if (!this.gameId) return;

    const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);

    onSnapshot(lobbyRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        this.joinedPlayers = data['players'] ?? [];
        const started = data['started'];
        if (started) {
          this.router.navigate(['/game/' + this.gameId]);
        }
      }
    });
  }

  signInAnonymously() {
    signInAnonymously(this.auth).catch((err) => {
      this.errorMessage = 'Unable to authenticate anonymously.';
    });
  }

  async markReady() {
    if (!this.playerName || !this.gameId) return;
    this.joining = true;
    this.errorMessage = '';

    try {
      await signInAnonymously(this.auth);
      const lobbyRef = doc(this.firestore, `lobbies/${this.gameId}`);
      const lobbySnap = await getDoc(lobbyRef);
      if (!lobbySnap.exists()) {
        throw new Error('Lobby not found.');
      }

      const existing = lobbySnap.data()?.['players'] ?? [];
      const nameTaken = existing.some((p: any) => p.name.toLowerCase() === this.playerName.toLowerCase());
      if (nameTaken) throw new Error('That name is already taken.');

      await updateDoc(lobbyRef, {
        players: arrayUnion({ name: this.playerName })
      });
    } catch (err: any) {
      console.error('[JoinGame] Error in markReady:', err);
      this.errorMessage = err.message ?? 'Something went wrong.';
    } finally {
      this.joining = false;
    }
  }
}
