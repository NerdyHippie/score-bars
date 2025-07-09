import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {NewGameModalComponent} from './new-game-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  firstName = '';

  constructor(private authService: AuthService, private dialog: MatDialog, private router: Router) {
    this.firstName = this.authService.UserData?.firstName || this.authService.UserData?.displayName?.split(' ')[0] || 'User';
  }

  openNewGameDialog() {
    const dialogRef = this.dialog.open(NewGameModalComponent);

    dialogRef.afterClosed().subscribe(mode => {
      if (mode) {
        this.router.navigate(['/new-game'], { queryParams: { mode } });
      }
    });
  }
}
