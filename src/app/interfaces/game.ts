import {Player} from './player';

export interface GameState {
  id: string;
  players: Player[];
  createdAt: any;
  createdBy: string;
  gameIsFinished?: boolean;
}
