import {Player} from './player';

export interface Game {
  id: string;
  players: Player[];
  createdAt: any;
  createdBy: string;
  gameIsFinished?: boolean;
}
