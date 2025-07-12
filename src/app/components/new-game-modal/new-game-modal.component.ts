import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-new-game-modal',
  templateUrl: './new-game-modal.component.html',
  styleUrls: ['./new-game-modal.component.scss'],
  standalone: true,
  imports: [ MatDialogModule, FormsModule, NgIf, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule ]
})
export class NewGameModalComponent {
  playerName: string = '';
  gameMode: 'remote' | 'local' | 'solo' = 'local';

  constructor(private dialogRef: MatDialogRef<NewGameModalComponent>) {}

  startGame() {
    if (!this.playerName || !this.gameMode) return;
    this.dialogRef.close({ mode: this.gameMode, playerName: this.playerName });
  }
}
