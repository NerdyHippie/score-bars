import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-dice-display',
  standalone: true,
  imports: [CommonModule, NgFor],
  /*templateUrl: './dice-display.html',
  styleUrl: './dice-display.scss',*/
  template: `
    <div class="dice-container">
      <img
        *ngFor="let die of dice; let i = index"
        [src]="getDieImage(die)"
        [class.rolling]="rolling"
        [alt]="'Die ' + die"
        (animationend)="onDieAnimationEnd(i)"
      />
    </div>
  `,
  styles: [
    `
      .dice-container {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 20px;
      }

      img {
        width: 60px;
        height: 60px;
        transition: transform 0.2s ease;
      }

      img.rolling {
        animation: roll 1s ease-in-out;
      }

      @keyframes roll {
        0% { transform: rotate(0); }
        25% { transform: rotate(90deg); }
        50% { transform: rotate(180deg); }
        75% { transform: rotate(270deg); }
        100% { transform: rotate(360deg); }
      }
    `
  ]
})
export class DiceDisplayComponent {
  @Input() dice: number[] = [];
  @Input() rolling: boolean = false;
  @Output() animationComplete = new EventEmitter<void>();

  private animationsFinished: Set<number> = new Set();

  getDieImage(value: number): string {
    return `assets/dice/die-${value}.png`;
  }

  onDieAnimationEnd(index: number): void {
    this.animationsFinished.add(index);
    if (this.animationsFinished.size === this.dice.length) {
      this.animationsFinished.clear();
      this.animationComplete.emit();
    }
  }
}
