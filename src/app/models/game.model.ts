export interface Game {
  players: { name: string }[];
  scores: number[];
  turns?: {
    playerIndex: number;
    score: number;
    dice: number[];
    bankedDice: number[];
  }[];
}
