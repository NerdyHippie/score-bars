import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  // Calculates the score of a single scoring option (e.g., [1, 5, 5])
  calculateScore(dice: number[]): number {
    const counts = this.getCounts(dice);
    let score = 0;

    for (const [die, count] of Object.entries(counts)) {
      const dieNum = Number(die);

      if (count >= 3) {
        score += dieNum === 1 ? 1000 : dieNum * 100;
        if (count > 3) {
          score += (count - 3) * (dieNum === 1 ? 100 : 50);
        }
      } else {
        if (dieNum === 1) score += count * 100;
        if (dieNum === 5) score += count * 50;
      }
    }

    return score;
  }

  // Returns all subsets of dice that are valid scoring options
  getScoringOptions(dice: number[]): number[][] {
    const options: number[][] = [];

    // Generate all non-empty subsets
    const generateSubsets = (arr: number[], start: number, subset: number[]) => {
      if (subset.length > 0 && this.calculateScore(subset) > 0) {
        options.push([...subset]);
      }
      for (let i = start; i < arr.length; i++) {
        subset.push(arr[i]);
        generateSubsets(arr, i + 1, subset);
        subset.pop();
      }
    };

    generateSubsets(dice, 0, []);
    return options;
  }

  // Helper: counts occurrences of each die face
  private getCounts(dice: number[]): Record<number, number> {
    return dice.reduce((acc, die) => {
      acc[die] = (acc[die] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }
}
