import { Component } from '@angular/core';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-new-game-modal',
  template: `
    <h2 mat-dialog-title>Start a New Game</h2>
    <mat-dialog-content>
      <button mat-button (click)="choose('remote')">Play with a friend remotely</button>
      <button mat-button (click)="choose('local')">Play with a friend locally</button>
      <button mat-button (click)="choose('solo')">Practice alone</button>
    </mat-dialog-content>
  `,
  standalone: true,
  imports: [MatDialogModule]
})
export class NewGameModalComponent {
  constructor(private dialogRef: MatDialogRef<NewGameModalComponent>) {}

  choose(mode: 'remote' | 'local' | 'solo') {
    this.dialogRef.close(mode);
  }
}
