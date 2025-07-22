import {Player} from './player';

export interface Game {
  id: string;
  players: Player[];
  createdAt: any;
  gameIsFinished?: boolean;
}
