import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, getDocs, doc, deleteDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import {Observable, of, switchMap, map, from, filter, tap} from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewGameModalComponent } from '../../components/new-game-modal/new-game-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { Game } from '../../interfaces/game';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private firestore: Firestore,
    private router: Router,
    private authService: AuthService
  ) {
    this.games$ = this.authService.UserData.pipe(
      // tap(user => console.log('[DEBUG] UserData emitted:', user)),
      filter(user => !!user?.uid),
      switchMap(async user => {
        const gamesRef = collection(this.firestore, 'games');

        const createdByQuery = query(gamesRef, where('createdBy', '==', user!.uid));
        // const playerUidsQuery = query(gamesRef, where('playerUids', 'array-contains', user!.uid));

        const [createdBySnap/*, playerUidsSnap*/] = await Promise.all([
          getDocs(createdByQuery),
          // getDocs(playerUidsQuery)
        ]);

        const gamesMap = new Map<string, Game>();

        createdBySnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() } as Game));
        // playerUidsSnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() } as Game));

        return Array.from(gamesMap.values());
      }),
      switchMap(games => from(Promise.resolve(games)))
    );
  }

  ngOnInit(): void {

    // console.log('usrData',this.authService.UserData.value)
  }

  goToGame(gameId: string): void {
    this.router.navigate(['/game', gameId]);
  }

  startNewGame() {
    const dialogRef = this.dialog.open(NewGameModalComponent, {
      width: '464px',
      maxWidth: '464px',
    });
    dialogRef.afterClosed().subscribe(gameData => {
      if (gameData) {
        this.router.navigate(['/new-game'], { queryParams: { gameMode: gameData.gameMode, playerName: gameData.playerName } });
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
