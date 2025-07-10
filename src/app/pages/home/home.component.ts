import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {NewGameModalComponent} from './new-game-modal.component';
// import { NewGameModalComponent } from '../new-game-modal/new-game-modal.component';

interface Game {
  id: string;
  players: { name: string }[];
  createdAt: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  games$: Observable<Game[]>;
  private dialog = inject(MatDialog);

  constructor(private firestore: Firestore, private router: Router) {
    const gamesRef = collection(this.firestore, 'games');
    this.games$ = collectionData(gamesRef, { idField: 'id' }) as Observable<Game[]>;
  }

  ngOnInit(): void {}

  goToGame(gameId: string) {
    this.router.navigate(['/game', gameId]);
  }

  startNewGame() {
    const dialogRef = this.dialog.open(NewGameModalComponent);
    dialogRef.afterClosed().subscribe(mode => {
      if (mode) {
        this.router.navigate(['/new-game'], { queryParams: { mode } });
      }
    });
  }

  getPlayerNames(game: Game): string {
    return game.players?.map(p => p.name).join(', ') || '';
  }
}
