import {Player} from './player';
import {Subscription} from 'rxjs';
import {ScoreOption} from './score-option';

export interface GameState {
  gameId: string,
  gameMode: string,
  players: Player[],
  scores: number[],
  currentPlayerIndex: number,
  currentPlayerId: string,
  myPlayerId: string,
  myTurn: boolean,

  dice: number[],
  rolling: boolean,
  hasRolled: boolean,

  turnScore: number,
  scoringOptions: ScoreOption[],
  bankedDice: number[],
  bankedThisTurn: string[],
  noScoreMessage: string | boolean,
  allDiceScoredMessage: string | boolean,

  finalRound: boolean;
  finalRoundStarterIndex: number | null,
  gameOver: boolean,
  winnerName: string,

  bankedSinceLastRoll: boolean,
}
