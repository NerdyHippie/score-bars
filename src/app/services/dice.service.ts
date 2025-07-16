import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DiceService {
  // Rolls a single die (1-6)
  rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Rolls a given number of dice
  rollDice(count: number): number[] {
    return Array(count).fill(0).map(() => this.rollDie());
  }

  // Rolls all six dice
  rollAllDice(): number[] {
    return this.rollDice(6);
  }

  // Returns a placeholder array representing dice in a "ready to roll" state
  getReadyDice(): number[] {
    return Array(6).fill(0); // 0 means "ready" state for animation
  }

  // Returns a placeholder array representing dice in a "waiting" state
  getWaitingDice(): number[] {
    return Array(6).fill(9); // 9 means "waiting" (e.g. during opponent turn)
  }

  // Returns only dice that haven't been banked yet
  getUnbankedDice(allDice: number[], bankedThisTurn: number[][]): number[] {
    const flatBanked = bankedThisTurn.flat();
    const diceCopy = [...allDice];

    for (const val of flatBanked) {
      const index = diceCopy.indexOf(val);
      if (index > -1) {
        diceCopy.splice(index, 1);
      }
    }

    return diceCopy;
  }
}
