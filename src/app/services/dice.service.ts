import {inject, Injectable} from '@angular/core';
import {DebugService} from './debug.service';

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  private debug = inject(DebugService);

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
    this.debug.msg(`[DiceService] getting Ready dice`);
    return Array(6).fill(0); // 0 means "ready" state
  }

  getWaitingDice(): number[] {
    this.debug.msg(`[DiceService] getting Wait dice`);
    return Array(6).fill(9);

  }
}
