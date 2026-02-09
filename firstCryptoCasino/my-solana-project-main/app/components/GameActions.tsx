"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGameContext } from "../contexts/GameContext";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { findAllTokenAccounts } from "../utils/checkTokenAccount";
import { useTimer } from "../hooks/useTimer";
import { useAdmin } from "../hooks/useAdmin";
import { X, Zap, Trophy, Play, Pause, AlertCircle, CheckCircle2, MoreVertical } from "lucide-react";

export function GameActions() {
  const { game, startGame, makeMove, claimWin, pauseGame, refresh } = useGameContext();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { isExpired } = useTimer(game);
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allTokenAccounts, setAllTokenAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Храним ссылки на таймауты для очистки
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Проверяем, что компонент смонтирован (для portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Сбрасываем состояние при закрытии модального окна
  const handleCloseModal = () => {
    // Очищаем все таймауты
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Полностью сбрасываем все состояния
    setLoading(false);
    setError(null);
    setSuccess(null);
    setIsModalOpen(false);
  };

  // Блокируем скролл страницы когда модальное окно открыто
  useEffect(() => {
    if (isModalOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      // Блокируем скролл
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
      
      return () => {
        // Восстанавливаем скролл при закрытии
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

  // Сбрасываем состояние загрузки при закрытии модального окна
  useEffect(() => {
    if (!isModalOpen) {
      // Очищаем таймауты при закрытии
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      // Сбрасываем состояния
      setLoading(false);
      setError(null);
      setSuccess(null);
    }
  }, [isModalOpen]);

  // Автоматически закрываем модальное окно после успешной ставки через 3 секунды
  // (чтобы показать мотивирующий текст перед закрытием)
  useEffect(() => {
    if (success && isModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
        setLoading(false);
      }, 3000); // 3 секунды для показа мотивирующего текста
      return () => clearTimeout(timer);
    } else if (success && !isModalOpen) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, isModalOpen]);

  // Автоматически скрываем сообщения об ошибках через 10 секунд
  useEffect(() => {
    if (error && !isModalOpen) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, isModalOpen]);

  // Проверяем все токен аккаунты пользователя (только если кошелек подключен)
  useEffect(() => {
    if (!connected || !publicKey || !connection) {
      setAllTokenAccounts([]);
      return;
    }

    const checkAccounts = async () => {
      try {
        // Добавляем небольшую задержку чтобы избежать rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        const accounts = await findAllTokenAccounts(connection, publicKey);
        setAllTokenAccounts(accounts || []);
      } catch (err: any) {
        // Не логируем ошибки rate limiting (429)
        if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
          console.error("Error checking token accounts:", err);
        }
        setAllTokenAccounts([]);
      }
    };

    checkAccounts();
  }, [connected, publicKey, connection]);

  const handleMakeMove = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!game?.isActive) {
      setError("Game is not active");
      return;
    }

    if (game.isPaused) {
      setError("Game is paused");
      return;
    }

    // Очищаем предыдущие таймауты, если они есть
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Не устанавливаем loading сразу, чтобы кошелек мог открыться
    setError(null);
    setSuccess(null);

    try {
      // Вызываем makeMove БЕЗ установки loading - кошелек должен открыться сразу
      // Устанавливаем loading только после того, как транзакция начнет обрабатываться
      const txPromise = makeMove();
      
      // Устанавливаем loading через небольшую задержку, чтобы дать кошельку время открыться
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(true);
      }, 300);

      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setError("Transaction timeout. Please try again.");
        timeoutRef.current = null;
      }, 120000);

      const tx = await txPromise;
      
      // Отменяем таймаут установки loading, так как транзакция уже обрабатывается
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoading(true); // Устанавливаем loading после начала обработки транзакции
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (tx) {
        setSuccess(`Move successful! TX: ${tx.slice(0, 8)}...`);
        // Обновляем состояние игры в фоне
        refresh().catch(err => {
          // Игнорируем ошибки обновления - игра обновится при следующем polling
          if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
            console.error("Failed to refresh game state:", err);
          }
        });
        // НЕ закрываем модальное окно - показываем мотивирующий текст
          setLoading(false);
      }
    } catch (err: any) {
      // Очищаем таймауты при ошибке
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      console.error("Make move error:", err);
      
      const errorMessage = err.message || String(err);
      const isUserRejected = 
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("User canceled") ||
        errorMessage.includes("reject") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("4001") ||
        errorMessage.includes("User declined");
      
      if (isUserRejected) {
        setError("Transaction cancelled. Please try again when ready.");
      } else {
        setError(errorMessage || "Failed to make move");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWin = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    // Проверяем, есть ли невыплаченный выигрыш от предыдущей игры
    const hasUnclaimedWin = game && 
      !game.previousWinnerClaimed && 
      game.previousWinnerAmount > 0 &&
      game.previousWinner !== "11111111111111111111111111111111";

    if (hasUnclaimedWin) {
      // Клейм выигрыша от предыдущей игры (работает даже если новая игра активна)
      if (publicKey.toString() !== game.previousWinner) {
        setError("You are not the previous winner");
        return;
      }
    } else {
      // Старая логика: клейм текущей игры (если игра еще не перезапустилась)
      if (!game?.isActive) {
        setError("Game is not active");
        return;
      }

      if (publicKey.toString() !== game.lastPlayer) {
        setError("You are not the winner");
        return;
      }
    }

    // Очищаем предыдущие таймауты
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Таймаут для сброса состояния загрузки (2 минуты)
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Transaction timeout. Please try again.");
      timeoutRef.current = null;
    }, 120000);

    try {
      const tx = await claimWin();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (tx) {
        setSuccess(`Win claimed! TX: ${tx.slice(0, 8)}...`);
        // Обновляем состояние игры в фоне (не блокируем закрытие модального окна)
        refresh().catch(err => {
          // Игнорируем ошибки обновления - игра обновится при следующем polling
          if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
            console.error("Failed to refresh game state:", err);
          }
        });
        // Закрываем модальное окно после успешного клейма (если оно открыто)
        if (isModalOpen) {
          setTimeout(() => {
            setIsModalOpen(false);
            setLoading(false);
            setSuccess(null);
          }, 1500); // Уменьшили время до 1.5 секунд для более быстрого закрытия
        }
      }
    } catch (err: any) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      console.error("Claim win error:", err);
      
      const errorMessage = err.message || String(err);
      const isUserRejected = 
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("User canceled") ||
        errorMessage.includes("reject") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("4001") ||
        errorMessage.includes("User declined");
      
      if (isUserRejected) {
        setError("Transaction cancelled. Please try again when ready.");
      } else {
        setError(errorMessage || "Failed to claim win");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGame = async (pause: boolean) => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can pause/unpause the game");
      return;
    }

    // Очищаем предыдущие таймауты
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Таймаут для сброса состояния загрузки (1 минута)
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Transaction timeout. Please try again.");
      timeoutRef.current = null;
    }, 60000);

    try {
      await pauseGame(pause);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSuccess(`Game ${pause ? "paused" : "resumed"} successfully`);
      await refresh();
    } catch (err: any) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setError(err.message || "Failed to pause/resume game");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can start the game");
      return;
    }

    if (!game) {
      setError("Game not initialized");
      return;
    }

    if (game.isActive && !isExpired) {
      setError("Game is already active");
      return;
    }

    if (game.isActive && isExpired) {
      if (game.currentRound === 0 && game.lastPlayer === "11111111111111111111111111111111") {
      } else {
        setError("Game active but timer expired. If you are the last player - click 'Claim Win' to finish the game.");
        return;
      }
    }

    // Очищаем предыдущие таймауты
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Таймаут для сброса состояния загрузки (1 минута)
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Transaction timeout. Please try again.");
      timeoutRef.current = null;
    }, 60000);

    try {
      const carryOver = game?.jackpotAmount || 0;
      const tx = await startGame(carryOver);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSuccess(`Game started! TX: ${tx.slice(0, 8)}... Carry-over: ${(carryOver / 1_000_000).toFixed(2)} USDC`);
      await refresh();
    } catch (err: any) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setError(err.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  // Проверяем возможность клейма:
  // 1. Клейм выигрыша от предыдущей игры (работает даже если новая игра активна)
  // 2. Клейм текущей игры (если игра активна, таймер истек, и пользователь - победитель)
  const hasUnclaimedPreviousWin = game && 
    !game.previousWinnerClaimed && 
    game.previousWinnerAmount > 0 &&
    game.previousWinner !== "11111111111111111111111111111111" &&
    publicKey &&
    publicKey.toString() === game.previousWinner;

  const canClaimCurrentWin = game?.isActive &&
    connected &&
    publicKey &&
    publicKey.toString() === game.lastPlayer &&
    isExpired;

  const canClaimWin = hasUnclaimedPreviousWin || canClaimCurrentWin;

  const canMakeMove =
    game?.isActive && !game.isPaused && connected && publicKey;

  const canStartGame =
    connected && 
    publicKey && 
    isAdmin && 
    (!game?.isActive || (game.isActive && isExpired && game.currentRound === 0 && game.lastPlayer === "11111111111111111111111111111111"));

    // Рассчитываем стоимость хода для отображения на кнопке
    const costKeys = game ? Math.floor((game.currentRound - 1) / 5) + 1 : 1;
    const costUsdc = costKeys;
    
    return (
    <>
      {/* Кнопка "Make Move" - всегда в DOM, но скрыта когда модальное окно открыто */}
      <div className={`flex justify-center transition-opacity duration-300 ${isModalOpen ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'}`}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="pulse-make-move group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(139,92,246,0.8)] hover:scale-105"
        >
          {/* Постоянное пульсирующее свечение вокруг кнопки */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-60 animate-pulse" />
          
          {/* Анимированный градиентный фон */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Shimmer эффект */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          {/* Пульсирующее свечение внутри */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-purple-500/50 rounded-2xl blur-xl opacity-50 animate-pulse" />
          
          <span className="relative font-bold text-white text-lg uppercase tracking-wider flex items-center gap-2 z-10">
            <Zap className="w-5 h-5 animate-pulse" />
            Make Move
            {canMakeMove && (
              <span className="text-sm font-normal normal-case opacity-80 ml-2">
                ({costUsdc} USDC)
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Модальное окно - рендерится через Portal в body */}
      {mounted && isModalOpen && createPortal(
    <>
          {/* Backdrop с красивым затемнением */}
      <div 
            className="fixed inset-0 z-[9999] transition-all duration-500 overflow-hidden"
        onClick={handleCloseModal}
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {/* Дополнительные эффекты затемнения */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-purple-900/5" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

      {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none overflow-hidden">
        <div 
              className="relative w-full max-w-2xl mx-auto pointer-events-auto max-h-[90vh] overflow-y-auto overflow-x-hidden transition-all duration-500"
          style={{
            opacity: isModalOpen ? 1 : 0,
                transform: isModalOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)'
              }}
            >
              {/* Animated glow effects вокруг модального окна */}
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-purple-500/40 blur-3xl rounded-3xl animate-pulse" />
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-blue-500/30 blur-2xl rounded-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Main card */}
              <div className="relative bg-gradient-to-br from-gray-900/99 via-gray-900/98 to-black/99 border-2 border-white/30 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Анимированная граница с градиентом */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 opacity-60 animate-pulse" />
                <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-black" />
            
            {/* Header */}
                <div className="relative p-6 border-b border-white/20 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5" />
                  <div className="relative flex items-center justify-between">
                <div className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full animate-pulse" />
                          <Zap className="relative w-7 h-7 text-purple-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                          Make Your Move
                  </h2>
                      </div>
                      <p className="text-sm text-gray-300 mt-2 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Ready to place your bet and compete for the jackpot
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full text-purple-300">
                      Admin
                    </span>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-110 hover:rotate-90 group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto overflow-x-hidden">
              {/* Welcome Message / Motivational Message */}
              {!error && (
                <div className="relative rounded-2xl border-2 border-purple-400/30 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 p-6 backdrop-blur-sm animate-fade-in">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl blur-sm" />
                  <div className="relative text-center space-y-3">
                    {loading ? (
                      <>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Processing Your Move...
                          </h3>
                        </div>
                        <p className="text-base text-gray-200 leading-relaxed font-semibold">
                          Your bet is being processed! ⏳
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Please confirm the transaction in your wallet. This will only take a moment!
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs text-purple-400">
                            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span>Confirm in wallet</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-400">
                            <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
                            <span>Almost there!</span>
                          </div>
                        </div>
                      </>
                    ) : success ? (
                      <>
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
                          <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            You're Almost There!
                          </h3>
                        </div>
                        <p className="text-base text-gray-200 leading-relaxed font-semibold">
                          Take one more step and claim the jackpot! 🎯
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Each bet brings you closer to victory. Don't stop now!
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs text-yellow-400">
                            <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
                            <span>The jackpot awaits you!</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-purple-400">
                            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span>Keep playing</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Ready to Make Your Move?
                          </h3>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Place your bet and reset the timer. Each move increases the jackpot and brings you closer to victory!
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span>Win the jackpot</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <span>Reset timer</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
      {error && (
                <div className="relative rounded-2xl border-2 border-red-400/30 bg-red-500/10 p-5 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-2xl blur-sm" />
                  <div className="relative flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="flex-1 text-red-100 text-sm">{error}</p>
                  </div>
        </div>
      )}

      {success && (
                <div className="relative rounded-2xl border-2 border-emerald-400/30 bg-emerald-500/10 p-5 backdrop-blur-sm animate-slide-in-up">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-600/10 rounded-2xl blur-sm" />
                  <div className="relative flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-emerald-100 text-sm font-semibold mb-1">Bet successfully placed!</p>
                      <p className="text-emerald-200/80 text-xs">{success}</p>
                    </div>
        </div>
        </div>
      )}

              {/* Buttons */}
              <div className="flex gap-3 flex-wrap justify-center">
        {isAdmin && canStartGame && (
          <button
            onClick={handleStartGame}
            disabled={loading}
                    className="group relative px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[180px] animate-pulse-glow"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative font-bold text-white flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Start Game
                        </>
                      )}
                    </span>
          </button>
        )}

        {isAdmin && game?.isActive && (
          <button
            onClick={() => handlePauseGame(!game.isPaused)}
            disabled={loading}
                    className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[180px] flex items-center justify-center gap-2 font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : game.isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume Game
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause Game
                      </>
                    )}
          </button>
        )}

        {canMakeMove && (() => {
          // Рассчитываем стоимость хода: для тестов 5 раундов на стадию
          const costKeys = game ? Math.floor((game.currentRound - 1) / 5) + 1 : 1;
          const costUsdc = costKeys;
          const jackpotUsdc = game ? (game.jackpotAmount / 1_000_000).toFixed(2) : "0.00";
          
          return (
            <div className="w-full flex flex-col items-center gap-4 animate-slide-in-up">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="relative rounded-xl border-2 border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-xl" />
                  <div className="relative">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Cost per move
                    </p>
                    <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                  {costUsdc} USDC
                </p>
                <p className="text-xs text-gray-500 mt-1">({costKeys} {costKeys === 1 ? 'key' : 'keys'})</p>
                  </div>
                </div>
                
                <div className="relative rounded-xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-green-600/5 p-4 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded-xl" />
                  <div className="relative">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Current Jackpot
                    </p>
                    <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                      ${parseFloat(jackpotUsdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">90% to winner</p>
                  </div>
                </div>
              </div>

              {/* Make Move Button */}
          <button
            onClick={handleMakeMove}
            disabled={loading}
                className="group relative w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse-strong"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative font-bold text-white flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Transaction...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 animate-pulse" />
                      Make Move Now
                    </>
                  )}
                </span>
          </button>
            </div>
          );
        })()}

        {canClaimWin && (
          <button
            onClick={handleClaimWin}
            disabled={loading}
                    className="group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[180px] animate-pulse-glow"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative font-bold text-white flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5" />
                          Claim Win
                        </>
                      )}
                    </span>
          </button>
        )}
      </div>

      {!connected && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">
          Connect your wallet to play
        </p>
                </div>
      )}

              {/* Token accounts info */}
      {allTokenAccounts.length > 0 && (
                <div className="relative rounded-2xl border-2 border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl" />
                  <div className="relative">
                    <div className="text-center mb-4">
                      <p className="text-sm font-semibold text-white">
                        📊 Token Accounts ({allTokenAccounts.length})
                      </p>
                    </div>
                    <div className="text-xs space-y-3 text-white/70 max-h-60 overflow-y-auto">
            {allTokenAccounts.map((account, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200">
                          <div className="space-y-1">
                            <p className="text-white/90"><strong>Address:</strong> <span className="font-mono">{account.address.slice(0, 8)}...{account.address.slice(-8)}</span></p>
                            <p className="text-white/90"><strong>Mint:</strong> <span className="font-mono text-xs">{account.mint.slice(0, 8)}...{account.mint.slice(-8)}</span></p>
                            <p className="text-white/90"><strong>Balance:</strong> {account.amount?.toFixed(2) || "0"} tokens</p>
                {account.mint === game?.usdcMint && (
                              <div className="mt-3 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                                <p className="text-emerald-200 font-semibold text-xs">
                                  ✅ Correct mint! Balance: {account.amount?.toFixed(2)} USDC
                  </p>
                              </div>
                )}
                          </div>
              </div>
            ))}
          </div>
            </div>
        </div>
      )}

      {allTokenAccounts.length === 0 && connected && (
                <div className="relative rounded-2xl border-2 border-yellow-400/30 bg-yellow-500/10 p-5 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-sm" />
                  <div className="relative text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto" />
                    <p className="text-sm font-semibold text-yellow-100">
                      No token accounts found
                    </p>
                    <p className="text-xs text-yellow-100/80">
                      Get USDC on devnet or create a token account.
                    </p>
                  </div>
        </div>
      )}
            </div>
          </div>
        </div>
    </div>
        </>,
        document.body
      )}
    </>
  );
}
