import { Component } from '@angular/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NewGameModalComponent } from './new-game-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [MatDialogModule]
})
export class HomeComponent {
  constructor(private dialog: MatDialog, private router: Router) {}

  openNewGameDialog() {
    const dialogRef = this.dialog.open(NewGameModalComponent);

    dialogRef.afterClosed().subscribe(mode => {
      if (mode) {
        this.router.navigate(['/new-game'], { queryParams: { mode } });
      }
    });
  }
}
