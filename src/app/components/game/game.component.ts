import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  gameId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id');
  }
}
