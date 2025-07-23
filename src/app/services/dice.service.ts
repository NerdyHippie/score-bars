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

  /*rollAllDice(): number[] {
    return this.rollDice(6);
  }*/

  getDieImage(value: number) {
    const dieNum: number | string = (value === 0) ? "ready" : (value === 9) ? "wait" : value;
    return `assets/images/die-${dieNum}.svg`;
  }

  getReadyDice(): number[] {
    console.log(`[DiceService] getting Ready dice`);
    return Array(6).fill(0); // 0 means "ready" state
  }

  getWaitingDice(): number[] {
    console.log(`[DiceService] getting Wait dice`);
    return Array(6).fill(9);

  }
}
