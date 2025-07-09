import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Player {
  name: string;
}

@Component({
  selector: 'app-new-game',
  standalone: true,
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
  imports: [CommonModule, FormsModule],
})
export class NewGameComponent implements OnInit {
  mode: 'remote' | 'local' | 'solo' | null = null;
  players: Player[] = [{ name: 'Player 1' }, { name: 'Player 2' }];
  gameId: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  ngOnInit(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;

    if (this.mode === 'solo') {
      this.createGame([{ name: 'Solo Player' }]);
    } else if (this.mode === 'remote') {
      this.createGame([]); // wait for players to join remotely
    }
  }

  addPlayerField() {
    this.players.push({ name: `Player ${this.players.length + 1}` });
  }

  async submitLocalGame() {
    const filteredPlayers = this.players
      .map(p => ({ name: p.name.trim() }))
      .filter(p => p.name);

    if (filteredPlayers.length < 2) return alert('Please enter at least 2 player names.');

    await this.createGame(filteredPlayers);
  }

  async createGame(players: Player[]) {
    const uid = this.auth.currentUser?.uid ?? 'anonymous';
    const gamesRef = collection(this.firestore, 'games');
    const newGame = await addDoc(gamesRef, {
      createdBy: uid,
      players: players,
      scores: players.map(() => 0),
      createdAt: new Date(),
      mode: this.mode
    });
    this.router.navigate(['/game', newGame.id]);
  }
}
