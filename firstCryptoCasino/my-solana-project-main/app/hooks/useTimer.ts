import { useEffect, useState, useCallback } from "react";
import { Game } from "../types/my_solana_project";

export function useTimer(game: Game | null) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    if (!game || !game.isActive) {
      setTimeRemaining(null);
      setIsExpired(false);
      return;
    }

    // lastMoveTimestamp уже в секундах (Unix timestamp)
    const now = Math.floor(Date.now() / 1000);
    
    // Если lastMoveTimestamp = 0, значит игра только что запущена, используем текущее время
    const startTime = game.lastMoveTimestamp > 0 ? game.lastMoveTimestamp : now;
    const elapsed = now - startTime;
    const remaining = game.timerDuration - elapsed;

    if (remaining <= 0) {
      setTimeRemaining(0);
      setIsExpired(true);
    } else {
      setTimeRemaining(remaining);
      setIsExpired(false);
    }
  }, [game]);

  useEffect(() => {
    // Сразу вычисляем время при изменении игры
    calculateTimeRemaining();

    // Если игра не активна, не запускаем интервал
    if (!game || !game.isActive) {
      return;
    }

    // Обновляем каждую секунду, даже если таймер истек (чтобы показывать 0:00:00)
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [game, calculateTimeRemaining]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    timeRemaining,
    isExpired,
    formattedTime: timeRemaining !== null ? formatTime(timeRemaining) : "--:--",
    hours: timeRemaining !== null ? Math.floor(timeRemaining / 3600) : 0,
    minutes: timeRemaining !== null ? Math.floor((timeRemaining % 3600) / 60) : 0,
    seconds: timeRemaining !== null ? timeRemaining % 60 : 0,
  };
}
