import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
  standalone: true,
  imports: [ CommonModule, FormsModule ]
})
export class NewGameComponent implements OnInit {
  mode: 'remote' | 'local' | 'solo' | null = null;
  playerNames: string[] = ['',''];
  gameId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') as any;

    if (this.mode === 'solo') {
      this.createGame(['Solo Player']);
    } else if (this.mode === 'remote') {
      this.createGame([]); // no players yet, waiting for invite
    }
    // local mode will show the form
  }

  addPlayerField() {
    this.playerNames.push('');
  }

  async submitLocalGame() {
    const names = this.playerNames.filter(name => name.trim());
    if (names.length < 2) return alert('Please enter at least 2 player names.');
    await this.createGame(names);
  }

  async createGame(players: string[]) {
    const gamesCollection = collection(this.firestore, 'games');
    const docRef = await addDoc(gamesCollection, {
      players,
      createdAt: new Date(),
      mode: this.mode
    });
    this.gameId = docRef.id;
    this.router.navigate(['/game', this.gameId]);
  }
}
