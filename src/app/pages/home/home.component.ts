import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, collectionData, deleteDoc, doc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewGameModalComponent } from '../../components/new-game-modal/new-game-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Game } from '../../interfaces/game';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    FormsModule,
    MatDialogModule,
    MatIconModule
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
    const dialogRef = this.dialog.open(NewGameModalComponent, {
      width: '464px',
      maxWidth: '464px',
    });
    dialogRef.afterClosed().subscribe(gameData => {
      if (gameData) {
        this.router.navigate(['/new-game'], { queryParams: { mode: gameData.mode, playerName: gameData.playerName } });
      }
    });
  }

  getPlayerInfo(game: Game): string {
    return game.players?.map((p, i) => `${p.name} (${p.score})`).join(', ') || '';
  }

  getStartDate(game: Game): string {
    const date = game.createdAt?.toDate?.() || new Date();
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  confirmDelete(game: Game) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        const gameRef = doc(this.firestore, 'games', game.id);
        deleteDoc(gameRef);
      }
    });
  }

  getInProgressGames(games: Game[]): Game[] {
    return games.filter(game => !game.gameIsFinished);
  }

  getFinishedGames(games: Game[]): Game[] {
    return games.filter(game => game.gameIsFinished);
  }
}

@Component({
  selector: 'confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2>Are you sure?</h2>
    <p>This cannot be undone.</p>
    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
      <button mat-raised-button color="warn" (click)="dialogRef.close('confirm')">
        Yes, delete this game permanently
      </button>
      <button mat-button (click)="dialogRef.close()">Cancel, do not delete</button>
    </div>
  `
})
export class ConfirmDeleteDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmDeleteDialog>) {}
}
