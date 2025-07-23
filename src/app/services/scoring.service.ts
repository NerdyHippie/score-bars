import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScoringService {

  getScoringOptions(dice: number[]): { label: string, score: number, dice: number[] }[] {

    console.log(`[ScoringService] firing getScoringOptions() dice: ${dice}`);

    const options: { label: string, score: number, dice: number[] }[] = [];
    const counts = Array(7).fill(0);
    dice.forEach(d => counts[d]++);

    const pairCount = counts.filter(c => c === 2).length;
    if (dice.length === 6 && pairCount === 3) {
      options.push({ label: '3 Pairs', score: 1250, dice: [...dice] });
      return options;
    }

    if (dice.length === 6 && [1, 2, 3, 4, 5, 6].every(n => dice.includes(n))) {
      options.push({ label: '1-6 Straight', score: 5000, dice: [...dice] });
      return options;
    }

    for (let i = 1; i <= 6; i++) {
      if (counts[i] >= 3) {
        let score = i === 1 ? 1000 : i * 100;
        if (counts[i] === 4) score = i === 1 ? 2000 : 1500;
        if (counts[i] === 5) score = i === 1 ? 3000 : 2500;
        if (counts[i] === 6) score = i === 1 ? 4000 : 3500;
        options.push({ label: `${counts[i]} x ${i}'s`, score, dice: Array(counts[i]).fill(i) });
      } else if (i === 1 || i === 5) {
        for (let j = 0; j < counts[i]; j++) {
          const score = i === 1 ? 100 : 50;
          options.push({ label: `${i}`, score, dice: [i] });
        }
      }
    }

    return options;
  }
}
