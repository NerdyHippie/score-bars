import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);

  ngOnInit(): void {
    this.gameId = this.route.snapshot.queryParamMap.get('gameId') ?? '';
  }

  async joinGame() {
    if (!this.playerName || !this.gameId) return;
    this.joining = true;
    this.errorMessage = '';

    try {
      const gameRef = doc(this.firestore, `games/${this.gameId}`);
      const gameSnap = await getDoc(gameRef);
      if (!gameSnap.exists()) throw new Error('Game not found.');

      const data = gameSnap.data();
      const existingPlayers = (data?.['players'] ?? []) as { name: string }[];
      const nameTaken = existingPlayers.some(p => p.name.toLowerCase() === this.playerName.toLowerCase());
      if (nameTaken) throw new Error('That name is already taken. Please choose a different one.');

      await updateDoc(gameRef, {
        players: arrayUnion({ name: this.playerName })
      });

      this.router.navigate(['/game', this.gameId]);
    } catch (err: any) {
      this.errorMessage = err.message ?? 'Something went wrong.';
    } finally {
      this.joining = false;
    }
  }
}
