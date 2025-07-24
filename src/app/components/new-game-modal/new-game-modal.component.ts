import { Component, OnInit, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-new-game-modal',
  templateUrl: './new-game-modal.component.html',
  styleUrls: ['./new-game-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ]
})
export class NewGameModalComponent implements OnInit {
  playerName: string = '';
  gameMode: 'remote' | 'local' | 'solo' = 'local';

  private auth = inject(Auth);

  constructor(private dialogRef: MatDialogRef<NewGameModalComponent>) {}

  ngOnInit() {
    const displayName = this.auth.currentUser?.displayName;
    if (displayName) {
      this.playerName = displayName.trim();
    }
  }

  startGame() {
    if (!this.playerName || !this.gameMode) return;
    this.dialogRef.close({ gameMode: this.gameMode, playerName: this.playerName });
  }
}
