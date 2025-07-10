export function generateDice(existing: number[] = []): number[] {
  const diceToRoll = 6 - existing.length;
  const newDice = Array.from({ length: diceToRoll }, () => Math.floor(Math.random() * 6) + 1);
  return [...existing, ...newDice];
}

export function getScoreOptions(dice: number[]): { label: string; score: number; dice: number[] }[] {
  const options: { label: string; score: number; dice: number[] }[] = [];
  const counts: Record<number, number> = {};

  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

  const diceSorted = [...dice].sort();

  // Check for 1-6 straight
  if ([1, 2, 3, 4, 5, 6].every(n => counts[n] === 1)) {
    options.push({
      label: '1–6 Straight',
      score: 5000,
      dice: [1, 2, 3, 4, 5, 6],
    });
    return options; // Highest priority, no other combos needed
  }

  // Check for 3 pairs
  const pairs = Object.entries(counts).filter(([_, count]) => count === 2);
  if (pairs.length === 3) {
    options.push({
      label: 'Three Pairs',
      score: 1250,
      dice: diceSorted,
    });
    return options;
  }

  for (let value = 1; value <= 6; value++) {
    const count = counts[value] || 0;

    if (count >= 3) {
      let score = 0;
      let diceUsed: number[] = [];

      if (value === 1) {
        if (count === 3) score = 1000;
        else if (count === 4) score = 2000;
        else if (count === 5) score = 3000;
        else if (count === 6) score = 4000;
      } else {
        if (count === 3) score = value * 100;
        else if (count === 4) score = 1500;
        else if (count === 5) score = 2500;
        else if (count === 6) score = 3500;
      }

      diceUsed = dice.filter(d => d === value).slice(0, count);
      options.push({
        label: `${count} of a kind (${value})`,
        score,
        dice: diceUsed,
      });
    }
  }

  // Individual 1s and 5s
  const remaining = dice.filter(d =>
    !options.some(opt => opt.dice.includes(d))
  );

  const scored = new Set(options.flatMap(opt => opt.dice));

  for (const d of dice) {
    if (scored.has(d)) continue;
    if (d === 1) {
      options.push({ label: 'Single 1', score: 100, dice: [d] });
      scored.add(d);
    }
    if (d === 5) {
      options.push({ label: 'Single 5', score: 50, dice: [d] });
      scored.add(d);
    }
  }

  return options;
}
