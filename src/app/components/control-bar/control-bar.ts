import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameState } from '../../interfaces/game-state';

@Component({
  selector: 'app-control-bar',
  imports: [],
  templateUrl: './control-bar.html',
  styleUrl: './control-bar.scss'
})
export class ControlBar {
  @Input() gameState!: GameState;

  @Output() rollDice = new EventEmitter<void>();
}
