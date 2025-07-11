import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  rollDice(count: number): number[] {
    return Array(count).fill(0).map(() => this.rollDie());
  }

  rollAllDice(): number[] {
    return this.rollDice(6);
  }

  getReadyDice(): number[] {
    return Array(6).fill(0); // 0 means "ready" state
  }
}
