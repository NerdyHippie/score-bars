import { TestBed } from '@angular/core/testing';
import { ScoringService } from './scoring.service';

function optionLabels(opts: {label:string,score:number,dice:number[]}[]) {
  return opts.map(o => o.label).sort();
}
function findOption(opts: any[], label: string, score: number, dice: number[]) {
  return opts.some(o =>
    o.label === label &&
    o.score === score &&
    JSON.stringify(o.dice) === JSON.stringify(dice)
  );
}

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoringService);
  });

  it('scores single 1s and 5s', () => {
    const dice = [1, 2, 3, 4, 5, 6];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, '1', 100, [1])).toBeTrue();
    expect(findOption(opts, '5', 50, [5])).toBeTrue();
  });

  it('scores triple 1s specially (1000)', () => {
    const dice = [1, 1, 1, 2, 3, 4];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, "3 x 1's", 1000, [1,1,1])).toBeTrue();
  });

  it('scores triple non-1s as 100 * face', () => {
    const dice = [5, 5, 5, 1, 2, 3];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, "3 x 5's", 500, [5,5,5])).toBeTrue();
  });

  it('detects a straight (1-6) as 1500', () => {
    const dice = [1, 2, 3, 4, 5, 6];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, 'Straight', 1500, [1,2,3,4,5,6])).toBeTrue();
  });

  it('detects three pairs as 1500', () => {
    const dice = [1,1,2,2,3,3];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, 'Three Pairs', 1500, [1,1,2,2,3,3])).toBeTrue();
  });

  it('detects full house (3+2 + single scoring die) as 1500', () => {
    // Example that hits the full house branch in your logic
    const dice = [2,2,2,3,3,1];
    const opts = service.getScoringOptions(dice);
    expect(findOption(opts, 'Full House', 1500, [2,2,2,3,3,1])).toBeTrue();
  });

  it('scores 4/5/6 of a kind with correct 1s exception', () => {
    const fourOnes = [1,1,1,1,2,3];
    const fiveOnes = [1,1,1,1,1,3];
    const sixOnes  = [1,1,1,1,1,1];

    const fourNon = [4,4,4,4,2,3];
    const fiveNon = [3,3,3,3,3,2];
    const sixNon  = [6,6,6,6,6,6];

    let opts = service.getScoringOptions(fourOnes);
    expect(findOption(opts, "4 x 1's", 2000, [1,1,1,1])).toBeTrue();

    opts = service.getScoringOptions(fiveOnes);
    expect(findOption(opts, "5 x 1's", 3000, [1,1,1,1,1])).toBeTrue();

    opts = service.getScoringOptions(sixOnes);
    expect(findOption(opts, "6 x 1's", 4000, [1,1,1,1,1,1])).toBeTrue();

    opts = service.getScoringOptions(fourNon);
    expect(findOption(opts, "4 x 4's", 1500, [4,4,4,4])).toBeTrue();

    opts = service.getScoringOptions(fiveNon);
    expect(findOption(opts, "5 x 3's", 2500, [3,3,3,3,3])).toBeTrue();

    opts = service.getScoringOptions(sixNon);
    expect(findOption(opts, "6 x 6's", 3500, [6,6,6,6,6,6])).toBeTrue();
  });

  it('returns multiple line items for repeated singles (1s and 5s)', () => {
    const dice = [1,1,5,5,2,3];
    const opts = service.getScoringOptions(dice);
    // Two separate singles for 1s and 5s
    const labels = optionLabels(opts);
    const singleOnes = labels.filter(l => l === '1').length;
    const singleFives = labels.filter(l => l === '5').length;
    expect(singleOnes).toBeGreaterThanOrEqual(2);
    expect(singleFives).toBeGreaterThanOrEqual(2);
  });
});
