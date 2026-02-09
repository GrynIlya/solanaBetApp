import { useEffect, useState, useCallback } from "react";
import { useProgram, getGamePda, PROGRAM_ID } from "../lib/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  GameStarted,
  MoveMade,
  TimerReduced,
  GameEnded,
  FeesWithdrawn,
} from "../types/my_solana_project";

export function useEvents() {
  const program = useProgram();
  const { connection } = useConnection();
  const [events, setEvents] = useState<{
    gameStarted?: GameStarted;
    movesMade: MoveMade[];
    timerReduced: TimerReduced[];
    gameEnded?: GameEnded;
    feesWithdrawn: FeesWithdrawn[];
  }>({
    movesMade: [],
    timerReduced: [],
    feesWithdrawn: [],
  });

  useEffect(() => {
    if (!program || !connection) return;

    const [gamePda] = getGamePda(PROGRAM_ID);

    // Подписка на события через web3.js
    const eventSubscriptions: number[] = [];

    // Подписка на события MoveMade
    const moveMadeListener = connection.onLogs(
      gamePda,
      (logs, context) => {
        // Парсинг событий из логов (упрощенная версия)
        // В реальности нужно парсить данные из logs
        console.log("MoveMade event:", logs, context);
      },
      "confirmed"
    );
    eventSubscriptions.push(moveMadeListener);

    // Подписка на события GameEnded
    const gameEndedListener = connection.onLogs(
      gamePda,
      (logs, context) => {
        console.log("GameEnded event:", logs, context);
      },
      "confirmed"
    );
    eventSubscriptions.push(gameEndedListener);

    return () => {
      eventSubscriptions.forEach((id) => {
        connection.removeOnLogsListener(id);
      });
    };
  }, [program, connection]);

  return events;
}
