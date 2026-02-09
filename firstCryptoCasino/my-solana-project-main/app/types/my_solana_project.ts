// Автоматически сгенерированные типы из IDL
// Можно сгенерировать через: anchor ts
// Пока используем базовую структуру

export interface MySolanaProject {
  address: string;
  metadata: {
    name: string;
    version: string;
  };
}

export interface Game {
  currentRound: number;
  jackpotAmount: number;
  lastMoveTimestamp: number;
  lastPlayer: string;
  timerDuration: number;
  isActive: boolean;
  isPaused: boolean;
  platformFeeAccount: string;
  usdcMint: string;
  bump: number;
  // Поля для предыдущего победителя (для непрерывного геймплея)
  previousWinner: string;           // адрес предыдущего победителя
  previousWinnerAmount: number;      // сумма выигрыша (90% от джекпота)
  previousWinnerClaimed: boolean;   // флаг: забрал ли победитель выигрыш
}

export interface GameStarted {
  round: number;
  jackpot: number;
}

export interface MoveMade {
  player: string;
  round: number;
  amount: number;
}

export interface TimerReduced {
  round: number;
  oldTimer: number;
  newTimer: number;
}

export interface GameEnded {
  winner: string;
  winnerAmount: number;
  carryOver: number;
}

export interface FeesWithdrawn {
  amount: number;
  admin: string;
}
