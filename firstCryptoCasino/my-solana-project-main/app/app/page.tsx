"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { LogOut } from "lucide-react";
import { GameActions } from "../components/GameActions";
import { InitializeGame } from "../components/InitializeGame";
import { useGameContext } from "../contexts/GameContext";
import { useTimer } from "../hooks/useTimer";
import { useAdmin } from "../hooks/useAdmin";
import { PROGRAM_ID, getGamePda, useProgram } from "../lib/anchor";
import { Clock, TrendingUp, User, Key, Activity, Trophy, Users, Wallet, RotateCw, Zap, RefreshCw, ArrowRight, Timer, Pencil } from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { AnimatedSection } from "../components/AnimatedSection";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { NameModal } from "../components/NameModal";
import { useEffect, useState, useMemo, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getPlayerName as getPlayerNameUtil, setPlayerNameOnChain } from "../utils/playerProfile";

// Функция для определения текущей стадии (правильная математика: 50 раундов на стадию)
function getCurrentStage(round: number) {
  const roundsPerStage = 50;
  
  if (round <= 0) return { minRound: 1, maxRound: 50, keys: 1, timer: 43200 }; // 12 часов
  
  // Определяем номер стадии (0-11)
  const stage = Math.floor((round - 1) / roundsPerStage);
  
  if (stage >= 12) {
    // После 600 раундов (стадия 12+): таймер остается 1 час, ключи 12
    return { minRound: 601, maxRound: Infinity, keys: 12, timer: 3600 };
  }
  
  const minRound = stage * roundsPerStage + 1;
  const maxRound = (stage + 1) * roundsPerStage;
  const keys = stage + 1;
  const timerHours = 12 - stage;
  const timer = timerHours * 3600; // Конвертируем часы в секунды
  
  return { minRound, maxRound, keys, timer };
}

function TimeBlock({ value, label, isLastHour = false }: { value: number; label: string; isLastHour?: boolean }) {
  return (
    <div className="relative">
      <div className={`bg-gradient-to-b from-white/10 to-white/5 border rounded-xl p-6 backdrop-blur-sm min-w-[140px] transition-all duration-300 ${
        isLastHour ? 'animate-pulse-red border-red-500/80' : 'border-white/20'
      }`}>
        <div className={`text-6xl font-bold tabular-nums transition-colors duration-300 ${
          isLastHour ? 'text-red-400' : 'text-white'
        }`}>
          {String(value).padStart(2, '0')}
        </div>
        <div className={`text-xs mt-2 tracking-widest transition-colors duration-300 ${
          isLastHour ? 'text-red-300' : 'text-gray-500'
        }`}>{label}</div>
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div className="text-5xl font-bold text-white/30 pb-8">:</div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Home() {
  const { wallet, connected, connecting, disconnecting, connect } = useWallet();
  const { connection } = useConnection();
  const { game, error, loading } = useGameContext();
  const { isAdmin } = useAdmin();
  const { timeRemaining, isExpired, hours, minutes, seconds } = useTimer(game);
  // Проверяем, нужна ли инициализация: если нет игры и загрузка завершена
  // Учитываем различные варианты ошибок инициализации
  const needsInitialization = useMemo(() => {
    const hasInitError = error && (
      error.includes("not initialized") || 
      error.includes("Account does not exist") || 
      error.includes("Game not initialized") ||
      error.includes("Trying to access beyond buffer length") ||
      error.includes("Invalid account data") ||
      error.includes("could not find account")
    );
    
    const result = 
      (!game && !loading && hasInitError) ||
      (!game && !loading && !error); // Если игра не найдена и загрузка завершена без ошибки - тоже нужна инициализация
    
    // Debug логи убраны для уменьшения шума в консоли
    // Раскомментируйте для отладки:
    // console.log("🎮 Game State Debug:", {
    //   game: game ? "found" : "null",
    //   loading,
    //   error: error || "no error",
    //   needsInitialization: result,
    //   isAdmin,
    // });
    
    return result;
  }, [game, loading, error, isAdmin]);
  
  const program = useProgram();

  // Состояние для модального окна имени
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Утилита для работы с именами в localStorage (fallback)
  const getPlayerNameFromStorage = (walletAddress: string): string | null => {
    if (typeof window === "undefined" || !walletAddress) return null;
    try {
      const walletNames = JSON.parse(localStorage.getItem("walletNames") || "{}");
      return walletNames[walletAddress] || null;
    } catch {
      return null;
    }
  };
  
  const savePlayerNameToStorage = (walletAddress: string, name: string) => {
    if (typeof window === "undefined" || !walletAddress) return;
    try {
      const walletNames = JSON.parse(localStorage.getItem("walletNames") || "{}");
      walletNames[walletAddress] = name;
      localStorage.setItem("walletNames", JSON.stringify(walletNames));
    } catch (err) {
      console.error("Error saving player name to storage:", err);
    }
  };
  
  // Загружаем имя текущего пользователя (сначала из блокчейна, потом из localStorage)
  // Оптимизировано: используем кэш и localStorage перед запросом к RPC
  useEffect(() => {
    const loadPlayerName = async () => {
      if (wallet?.adapter?.publicKey && connection) {
        const playerPubkey = wallet.adapter.publicKey;
        const address = playerPubkey.toString();
        
        // Проверяем кэш сначала
        const cachedName = playerNameCacheRef.current.get(address);
        if (cachedName !== undefined) {
          setPlayerName(cachedName);
          return;
        }
        
        // Проверяем localStorage перед запросом к RPC
        const storageName = getPlayerNameFromStorage(address);
        if (storageName) {
          setPlayerName(storageName);
          playerNameCacheRef.current.set(address, storageName);
          return;
        }
        
        try {
          // Добавляем задержку чтобы избежать rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 секунды
          const name = await getPlayerNameUtil(connection, playerPubkey, program);
          const trimmedName = name && name.trim() ? name.trim() : null;
          setPlayerName(trimmedName);
          // Сохраняем в кэш
          playerNameCacheRef.current.set(address, trimmedName);
          // Сохраняем в localStorage для будущих использований
          if (trimmedName) {
            savePlayerNameToStorage(address, trimmedName);
          }
        } catch (err: any) {
          // Не логируем ошибки rate limiting (429)
          if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
            console.error("Error loading player name:", err);
          }
          // Fallback на localStorage
          const savedName = getPlayerNameFromStorage(address);
          setPlayerName(savedName);
          // Сохраняем в кэш
          playerNameCacheRef.current.set(address, savedName);
        }
      } else {
        setPlayerName(null);
      }
    };
    
    loadPlayerName();
  }, [wallet?.adapter?.publicKey?.toString(), connection]); // Убрали зависимость от program
  
  // Получаем название кошелька
  const walletName = wallet?.adapter?.name || "Unknown";
  
  // Автоматическое подключение после выбора кошелька в модальном окне
  useEffect(() => {
    if (wallet && !connected && !connecting && wallet.adapter?.readyState === "Installed") {
      // Если кошелек выбран в модальном окне, но еще не подключен, автоматически подключаем
      const timer = setTimeout(async () => {
        try {
          await connect();
        } catch (err) {
          // Игнорируем ошибки - пользователь может подключить вручную
          console.debug("Auto-connect attempt:", err);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [wallet, connected, connecting, connect]);
  
  // Автоматическое открытие модального окна отключено
  // Пользователь может открыть его вручную, нажав на поле с именем/кошельком
  
  // Обработчик завершения ввода имени
  const handleNameComplete = async (name: string) => {
    if (!wallet?.adapter?.publicKey || !program) {
      console.error("Wallet or program not available");
      return;
    }

    setIsSavingName(true);
    try {
      const playerPubkey = wallet.adapter.publicKey;
      const trimmedName = name.trim();
      
      // Сохраняем в блокчейн только если имя не пустое
      // Контракт не принимает пустые имена, поэтому пропускаем сохранение
      if (trimmedName) {
        await setPlayerNameOnChain(program, playerPubkey, trimmedName);
      }
      // Если имя пустое, просто не сохраняем в блокчейн - будет использоваться адрес кошелька
      
      // Сохраняем в localStorage (даже если пустое - для отслеживания, что пользователь оставил поле пустым)
      savePlayerNameToStorage(playerPubkey.toString(), trimmedName);
      
      // Обновляем состояние (null для пустого имени)
      setPlayerName(trimmedName || null);
      setIsNameModalOpen(false);
    } catch (error: any) {
      console.error("Error saving player name:", error);
      // Если не удалось сохранить в блокчейн, сохраняем только в localStorage
      const address = wallet.adapter.publicKey.toString();
      const trimmedName = name.trim();
      savePlayerNameToStorage(address, trimmedName);
      setPlayerName(trimmedName || null);
      setIsNameModalOpen(false);
      // Показываем уведомление только если имя не пустое
      if (trimmedName) {
        alert("Name saved locally. Blockchain transaction failed. Please try again later.");
      }
    } finally {
      setIsSavingName(false);
    }
  };

  // Вычисляем данные для отображения
  const currentRound = game?.currentRound || 0;
  const currentStage = getCurrentStage(currentRound);
  const betsUntilNextStage = currentStage.maxRound === Infinity ? 0 : currentStage.maxRound - currentRound;
  
  // Правильная логика прогресса: 50 ставок на стадию, каждая ставка = 2% (100% / 50 = 2%)
  // Если currentRound = 7, это означает 7 сделанных ставок, значит прогресс = 7 * 2% = 14%
  const stageProgress = currentStage.maxRound === Infinity 
    ? 100 
    : Math.min(100, Math.max(0, (currentRound - currentStage.minRound + 1) * 2));
  
  const jackpotUsdc = game ? (game.jackpotAmount / 1_000_000).toFixed(2) : "0.00";
  const lastPlayer = game?.lastPlayer || "11111111111111111111111111111111";
  
  // Состояние для имени последнего игрока
  const [lastPlayerName, setLastPlayerName] = useState<string | null>(null);
  // Кэш для имен игроков, чтобы не запрашивать их повторно
  const playerNameCacheRef = useRef<Map<string, string | null>>(new Map());
  
  // Загружаем имя последнего игрока из блокчейна (с кэшированием)
  useEffect(() => {
    const loadLastPlayerName = async () => {
      if (lastPlayer && lastPlayer !== "11111111111111111111111111111111" && connection) {
        // Проверяем кэш сначала
        const cachedName = playerNameCacheRef.current.get(lastPlayer);
        if (cachedName !== undefined) {
          setLastPlayerName(cachedName);
          return;
        }
        
        // Проверяем localStorage перед запросом к RPC
        const storageName = getPlayerNameFromStorage(lastPlayer);
        if (storageName) {
          setLastPlayerName(storageName);
          playerNameCacheRef.current.set(lastPlayer, storageName);
          return;
        }
        
        try {
          const lastPlayerPubkey = new PublicKey(lastPlayer);
          // Увеличиваем задержку чтобы избежать rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 секунды вместо 500ms
          const name = await getPlayerNameUtil(connection, lastPlayerPubkey, program);
          const trimmedName = name && name.trim() ? name.trim() : null;
          setLastPlayerName(trimmedName);
          // Сохраняем в кэш
          playerNameCacheRef.current.set(lastPlayer, trimmedName);
          // Сохраняем в localStorage для будущих использований
          if (trimmedName) {
            savePlayerNameToStorage(lastPlayer, trimmedName);
          }
        } catch (err: any) {
          // Не логируем ошибки rate limiting (429)
          if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
            console.error("Error loading last player name:", err);
          }
          // Fallback на localStorage
          const name = getPlayerNameFromStorage(lastPlayer);
          setLastPlayerName(name && name.trim() ? name.trim() : null);
          // Сохраняем null в кэш, чтобы не запрашивать повторно при ошибке
          playerNameCacheRef.current.set(lastPlayer, name && name.trim() ? name.trim() : null);
        }
      } else {
        setLastPlayerName(null);
      }
    };
    
    loadLastPlayerName();
  }, [lastPlayer, connection, program]); // Убрали зависимость от program, чтобы не перезапрашивать при каждом изменении
  
  // Если имя пустое или null, показываем адрес кошелька
  const lastPlayerShort = lastPlayer === "11111111111111111111111111111111" 
    ? "No moves yet" 
    : (lastPlayerName && lastPlayerName.trim()) 
      ? lastPlayerName.trim() 
      : `${lastPlayer.slice(0, 4)}...${lastPlayer.slice(-4)}`;
  
  // Вычисляем время с последнего хода (динамически обновляется)
  const [timeSinceLastMove, setTimeSinceLastMove] = useState<string | null>(null);
  
  useEffect(() => {
    const updateTimeSinceLastMove = () => {
      if (!game || !game.lastMoveTimestamp || game.lastMoveTimestamp === 0) {
        setTimeSinceLastMove(null);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - game.lastMoveTimestamp;
      
      if (elapsed < 60) {
        setTimeSinceLastMove(`${elapsed}s ago`);
      } else if (elapsed < 3600) {
        setTimeSinceLastMove(`${Math.floor(elapsed / 60)}m ago`);
      } else if (elapsed < 86400) {
        setTimeSinceLastMove(`${Math.floor(elapsed / 3600)}h ago`);
      } else {
        setTimeSinceLastMove(`${Math.floor(elapsed / 86400)}d ago`);
      }
    };
    
    // Обновляем сразу
    updateTimeSinceLastMove();
    
    // Обновляем каждую секунду для актуальности
    const interval = setInterval(updateTimeSinceLastMove, 1000);
    
    return () => clearInterval(interval);
  }, [game?.lastMoveTimestamp]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden relative">
      {/* Animated Canvas Background */}
      <AnimatedBackground />
      
      {/* Top navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Логотип */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Last Move
            </span>
          </div>
          {connected ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="no-hover-effect flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 rounded-lg cursor-pointer"
                title="Click to edit name"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                {playerName ? (
                  <span className="text-sm font-medium">
                    {playerName}
                  </span>
                ) : (
                  <span className="text-sm font-medium">
                    {walletName}
                  </span>
                )}
                {wallet?.adapter?.publicKey && (
                  <span className="text-xs text-gray-400 font-mono">
                    {wallet.adapter.publicKey.toString().slice(0, 4)}...{wallet.adapter.publicKey.toString().slice(-4)}
                  </span>
                )}
                <div className="flex items-center gap-1 ml-1 text-xs text-gray-400">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </div>
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (disconnecting || !wallet?.adapter) return;
                  try {
                    await wallet.adapter.disconnect();
                  } catch (err) {
                    console.error("Error disconnecting wallet:", err);
                  }
                }}
                disabled={disconnecting}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Disconnect wallet"
              >
                {disconnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm font-medium">Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Disconnect</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="relative">
              {connecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm z-10 pointer-events-none">
                  <div className="flex items-center gap-2 text-sm px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to {walletName || "wallet"}...</span>
                  </div>
                </div>
              )}
              <WalletMultiButton />
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-24 pb-12 px-4">
          {needsInitialization ? (
          <div className="max-w-4xl mx-auto">
            {isAdmin ? (
              <InitializeGame />
            ) : (
              <div className="p-6 bg-yellow-100 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-yellow-800">⚠️ Игра не инициализирована</h2>
                <p className="text-yellow-700 mt-2">
                  Только администратор может инициализировать игру. Обратитесь к администратору.
                </p>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="max-w-6xl mx-auto text-center py-20">
            <p className="text-gray-400">Loading game state...</p>
          </div>
        ) : !game ? (
          <div className="max-w-6xl mx-auto text-center py-20">
            <p className="text-gray-400">Game not found</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section в стиле Figma */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
              {/* Background ambient particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-purple-500/20 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
                      animationDelay: `${Math.random() * 5}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
                {/* Small top label */}
                <AnimatedSection delay={0.1}>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${game.isActive && !game.isPaused ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-sm text-gray-400">
                        {game.isActive && !game.isPaused ? "Live Game in Progress" : game.isPaused ? "Game Paused" : "Game Inactive"}
                      </span>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Jackpot counter */}
                <AnimatedSection delay={0.15}>
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                      <span className="text-sm uppercase tracking-wider text-gray-500">Current Jackpot</span>
                      </div>
                    <div className="flex items-baseline justify-center gap-3">
                      <div className="text-9xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                        ${parseFloat(jackpotUsdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {/* USDC Logo Icon */}
                      <div className="flex items-center" style={{ marginBottom: '0.15em' }}>
                        <img 
                          src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                          alt="USDC" 
                          className="w-12 h-12 flex-shrink-0"
                          onError={(e) => {
                            // Fallback to SVG if image fails
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const svg = target.nextElementSibling as HTMLElement;
                            if (svg) svg.style.display = 'block';
                          }}
                        />
                        <svg 
                          width="48" 
                          height="48" 
                          viewBox="0 0 32 32" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex-shrink-0 hidden"
                          style={{ display: 'none' }}
                        >
                          <circle cx="16" cy="16" r="16" fill="#2775CA"/>
                          <text 
                            x="16" 
                            y="21" 
                            fontSize="20" 
                            fontWeight="700" 
                            fill="white" 
                            textAnchor="middle" 
                            fontFamily="system-ui, -apple-system, sans-serif"
                            dominantBaseline="central"
                          >
                            $
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                {/* CTA Button */}
                {game.isActive && !game.isPaused && connected && (
                  <AnimatedSection delay={0.2}>
                    <div className="mb-8">
                      <GameActions />
                        </div>
                  </AnimatedSection>
                )}
                
                {(!game.isActive || game.isPaused || !connected) && (
                  <AnimatedSection delay={0.2}>
                    <div className="mb-8">
                      <div className="space-y-4">
                        {!connected && (
                          <div className="text-center">
                            <WalletMultiButton />
                            <p className="mt-4 text-sm text-gray-500 max-w-md mx-auto">
                              Connect your wallet to make a move
                            </p>
                      </div>
                    )}
                        {connected && (
                          <GameActions />
                    )}
                      </div>
                  </div>
                </AnimatedSection>
                )}

                {/* Last player info */}
                <AnimatedSection delay={0.25}>
                  <div className="mb-8 relative">
                    {/* Glow effect - яркость зависит от оставшегося времени */}
                    {(() => {
                      // Вычисляем интенсивность свечения на основе оставшегося времени
                      // Чем меньше времени остается, тем ярче зеленое свечение
                      let glowIntensity = 0;
                      if (game?.timerDuration && timeRemaining !== null && timeRemaining > 0) {
                        // Процент оставшегося времени (от 0 до 1)
                        const timePercent = timeRemaining / game.timerDuration;
                        // Интенсивность обратно пропорциональна времени (чем меньше времени, тем ярче)
                        // Минимум 0.3 (30%), максимум 1.0 (100%)
                        glowIntensity = Math.max(0.3, 1 - timePercent);
                      } else if (timeRemaining !== null && timeRemaining <= 0) {
                        // Когда время истекло - максимальная яркость
                        glowIntensity = 1;
                      }
                      
                      return (
                        <div 
                          className="absolute -inset-3 blur-2xl rounded-full transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, rgba(34, 197, 94, ${glowIntensity * 0.9}) 0%, rgba(16, 185, 129, ${glowIntensity * 0.7}) 50%, transparent 70%)`,
                            opacity: glowIntensity,
                          }}
                        />
                      );
                    })()}
                    
                    <div className="relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border border-emerald-500/30 rounded-full backdrop-blur-sm">
                      <User className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Last Bet By</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-400">{lastPlayerShort}</span>
                          {currentRound > 0 && (
                            <span className="text-xs text-gray-500">• Bet #{currentRound}</span>
                          )}
                          {timeSinceLastMove && (
                            <span className="text-xs text-gray-500">• {timeSinceLastMove}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Outbid them to become the winner!</p>
                  </div>
                </AnimatedSection>

                {/* Main timer */}
                {game.isActive && (
                  <AnimatedSection delay={0.3}>
                    <div className="relative mb-12">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 blur-[100px] transition-all duration-500 ${
                        hours === 0 ? 'opacity-60' : 'opacity-30'
                      }`}>
                        <div className={`w-full h-full bg-gradient-to-r animate-pulse ${
                          hours === 0 
                            ? 'from-red-500 via-orange-500 to-red-500' 
                            : 'from-purple-500 via-blue-500 to-purple-500'
                        }`} />
                      </div>

                      {/* Timer display */}
                      <div className="relative">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <Clock className={`w-12 h-12 transition-colors duration-300 ${
                            hours === 0 ? 'text-red-400 animate-pulse' : 'text-purple-400'
                          }`} />
                          {game.isPaused && (
                            <span className="text-yellow-400 text-sm font-semibold">PAUSED</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <TimeBlock value={hours} label="HOURS" isLastHour={hours === 0} />
                          <Separator />
                          <TimeBlock value={minutes} label="MINUTES" isLastHour={hours === 0} />
                          <Separator />
                          <TimeBlock value={seconds} label="SECONDS" isLastHour={hours === 0} />
                        </div>
                        {isExpired && !game.isPaused && (
                          <p className="text-red-400 text-sm mt-4 font-semibold">⏰ Timer expired! Last player can claim win.</p>
                        )}
                        {game.isPaused && (
                          <p className="text-yellow-400 text-sm mt-4 font-semibold">⏸️ Game is paused</p>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                )}

                {/* Current round and stage info */}
                <AnimatedSection delay={0.4}>
                  <div className="mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
                      {/* Current round */}
                      <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/10 border border-purple-500/30 rounded-lg px-6 py-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Bet</div>
                        <div className="text-3xl font-bold text-purple-400">#{currentRound}</div>
                    </div>

                      {/* Keys required */}
                      <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-lg px-6 py-3">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Entry Cost</div>
                        <div className="text-3xl font-bold text-blue-400">{currentStage.keys} key{currentStage.keys > 1 ? 's' : ''}</div>
                    </div>

                      {/* Bets until next stage */}
                      {betsUntilNextStage > 0 && (
                        <div className="bg-gradient-to-br from-orange-600/20 to-orange-600/10 border border-orange-500/30 rounded-lg px-6 py-3">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Until Price Increase</div>
                          <div className="text-3xl font-bold text-orange-400">{betsUntilNextStage}</div>
                  </div>
                )}
                    </div>

                    {/* Stage progress bar */}
                    {currentStage.maxRound !== Infinity && currentRound > 0 && (
                      <div className="max-w-xl mx-auto">
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                          <span>Stage {currentStage.minRound}-{currentStage.maxRound}</span>
                          <span>{Math.round(stageProgress)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${stageProgress}%` }}
                          />
                    </div>
                  </div>
                )}
                  </div>
                </AnimatedSection>

                {/* Stats bar */}
                <AnimatedSection delay={0.5}>
                  <div className="mt-16 grid grid-cols-2 gap-8 max-w-xl mx-auto">
                    <StatItem label="Total Bets" value={currentRound.toString()} />
                    <StatItem label="Status" value={game.isActive ? (game.isPaused ? "Paused" : "Active") : "Inactive"} />
                  </div>
                </AnimatedSection>
              </div>
            </section>

            {/* How It Works Section */}
            <HowItWorksSection />

            {/* Progression Section */}
            <ProgressionSection currentRound={currentRound} />

            {/* Endgame Section */}
            <EndgameSection 
              jackpot={jackpotUsdc} 
              currentRound={currentRound}
              game={game}
              isExpired={isExpired}
              timeRemaining={timeRemaining}
              hours={hours}
              minutes={minutes}
              seconds={seconds}
            />
          </div>
        )}
    </main>

      {/* Name Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        onComplete={handleNameComplete}
        onClose={() => setIsNameModalOpen(false)}
        initialName={playerName || ""}
        isSaving={isSavingName}
      />
    </div>
  );
}

// How It Works Section
function HowItWorksSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.1 });
  const steps = [
    {
      icon: Wallet,
      title: "Connect Wallet",
      description: "Connect your Solana wallet to participate",
      detail: "Use Phantom, Solflare, or any Solana wallet",
    },
    {
      icon: Key,
      title: "Make a Move",
      description: "Spend USDC to place your bet",
      detail: "Each bet requires the current stage's key amount",
    },
    {
      icon: RotateCw,
      title: "Timer Resets",
      description: "The countdown starts from the beginning",
      detail: "You bought time, but also raised the stakes",
    },
    {
      icon: TrendingUp,
      title: "Jackpot Grows",
      description: "90% goes to prize pool, 10% to platform",
      detail: "Every move increases the winner's reward",
    },
  ];

  return (
    <section className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <AnimatedSection delay={0} direction="fade">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              A simple loop creating infinite tension. Every move pushes the end further away.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.title} delay={0.1 * index} direction="up">
                <div className="relative group h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 backdrop-blur-sm h-full flex flex-col">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/50">
                      {index + 1}
                    </div>
                    <div className="mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-7 h-7 text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{step.description}</p>
                    <p className="text-gray-500 text-xs mt-auto">{step.detail}</p>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection delay={0.5} direction="fade">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-12 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <FlowBox
                title="Player Makes Move"
                items={["Spends USDC", "Becomes last player", "Resets timer"]}
                color="purple"
              />
              <ArrowDivider />
              <FlowBox
                title="Game Responds"
                items={["Timer: +time", "Jackpot: +90%", "Platform: +10%"]}
                color="blue"
              />
              <ArrowDivider />
              <FlowBox
                title="Waiting for Next Move"
                items={["Timer counts down", "Other players decide", "Tension rises"]}
                color="emerald"
              />
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <RotateCw className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider">The cycle repeats until the timer reaches zero</span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function FlowBox({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorClasses = {
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30",
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/30",
  };

  return (
    <div className={`flex-1 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-6 min-w-[200px]`}>
      <h4 className="font-bold mb-4 text-center">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArrowDivider() {
  return (
    <div className="hidden lg:block">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-600">
        <path
          d="M8 20H32M32 20L24 12M32 20L24 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Функция для расчета таймера стадии (логика из бэкенда)
function calculateStageTimer(stage: number): number {
  // Для тестов: 5 раундов на стадию
  // Формула из бэкенда: 7200 - (stage * 600), минимум 600 секунд
  const timerSeconds = Math.max(600, 7200 - (stage * 600));
  return timerSeconds;
}

// Функция для форматирования таймера в читаемый вид
function formatTimer(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    if (minutes > 0) {
      // Формат: "2h 10m" или "1h 50m"
      return `${hours}h ${minutes}m`;
    }
    // Если минут нет, показываем только часы: "2 hours" или "1 hour"
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  // Если часов нет, показываем только минуты: "50 min" или "10 min"
  return `${minutes} min`;
}

// Progression Section
function ProgressionSection({ currentRound }: { currentRound: number }) {
  const { ref: sectionRef } = useScrollAnimation({ threshold: 0.1 });
  
  // Генерируем стадии на основе правильной математики:
  // Каждые 50 раундов: таймер уменьшается на 1 час (от 12 до 1 часа)
  // Ключей за ход увеличивается на 1 (от 1 до 12)
  // После 600 раундов таймер остается 1 час, но игра может продолжаться
  const generateStages = () => {
    const stages = [];
    const roundsPerStage = 50; // Правильная математика: 50 раундов на стадию
    
    // Генерируем 12 стадий (от 1-50 до 551-600)
    for (let stage = 0; stage <= 11; stage++) {
      const minRound = stage * roundsPerStage + 1;
      const maxRound = (stage + 1) * roundsPerStage;
      
      // Таймер: 12 часов - stage часов (от 12 до 1 часа)
      const timerHours = 12 - stage;
      const timerSeconds = timerHours * 3600; // Конвертируем часы в секунды
      
      // Ключи: stage + 1 (от 1 до 12)
      const keys = stage + 1;
      
      stages.push({
        stage,
        round: stage === 11 ? "551-600" : `${minRound}-${maxRound}`,
        minRound,
        maxRound: stage === 11 ? 600 : maxRound,
        timer: formatTimer(timerSeconds),
        timerSeconds,
        keys,
      });
    }
    
    return stages;
  };
  
  const stages = generateStages();

  return (
    <section className="relative py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-10" ref={sectionRef}>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <AnimatedSection delay={0} direction="fade">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4">
              The Pressure{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Intensifies
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Every 50 bets, the stakes rise. The timer shortens. The cost increases. The tension becomes unbearable.
            </p>
          </div>
        </AnimatedSection>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0 hidden lg:block" />
          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isEven = index % 2 === 0;
              const isCurrent = currentRound >= stage.minRound && 
                               (stage.maxRound === Infinity || currentRound <= stage.maxRound);
              return (
                <AnimatedSection 
                  key={stage.round} 
                  delay={0.1 * index} 
                  direction={isEven ? "left" : "right"}
                >
                  <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                    <div className={isEven ? "" : "lg:order-2"}>
                      <div className={`relative group flex items-center gap-4 ${isCurrent ? '' : ''}`}>
                        {!isEven && (
                          <div className="hidden lg:flex items-center flex-shrink-0">
                            <ArrowRight className="w-6 h-6 text-purple-500/30 rotate-180" />
                          </div>
                        )}
                        <div className="flex-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 backdrop-blur-sm min-h-[280px] flex flex-col ${
                            isCurrent 
                              ? 'border-4 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.6)]' 
                              : 'border border-white/10'
                          }`}>
                          {isCurrent && (
                            <div className="absolute -top-2 -left-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-bold z-10">
                              CURRENT
                            </div>
                          )}
                          <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/50 z-10">
                            {index + 1}
                          </div>
                          
                          {/* Round range */}
                          <div className="mb-6">
                            <span className="text-sm text-gray-500 uppercase tracking-wider">Bets</span>
                            <div className="text-3xl font-bold mt-1">{stage.round}</div>
                          </div>

                          {/* Stats grid - фиксированная структура для выравнивания */}
                          <div className="grid grid-cols-2 gap-6 mt-auto">
                            {/* Timer - всегда слева (как в Figma дизайне) */}
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Timer className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs uppercase tracking-wider whitespace-nowrap">Timer</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-400 truncate">{stage.timer}</div>
                            </div>

                            {/* Keys - всегда справа (как в Figma дизайне) */}
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Key className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs uppercase tracking-wider whitespace-nowrap">Keys</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-400">{stage.keys}</div>
                            </div>
                          </div>
                            </div>
                            </div>
                        {isEven && (
                          <div className="hidden lg:flex items-center flex-shrink-0">
                            <ArrowRight className="w-6 h-6 text-purple-500/30" />
                          </div>
                        )}
                        </div>
                      </div>
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 z-10">
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg shadow-purple-500/50">
                        <div className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-20" />
                      </div>
                    </div>
                    <div className={isEven ? "lg:order-2" : ""}>
                      {/* Empty space for grid alignment */}
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>

        <AnimatedSection delay={0.5} direction="fade">
          <div className="mt-20 text-center">
            <div className="inline-block px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm uppercase tracking-wider">
                ⚠ After reaching 1 hour, the timer no longer decreases, but the game can continue if players keep making moves
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// Endgame Section
function EndgameSection({ 
  jackpot, 
  currentRound,
  game,
  isExpired,
  timeRemaining,
  hours,
  minutes,
  seconds
}: { 
  jackpot: string;
  currentRound: number;
  game: any;
  isExpired: boolean;
  timeRemaining: number | null;
  hours: number;
  minutes: number;
  seconds: number;
}) {
  const { ref: sectionRef } = useScrollAnimation({ threshold: 0.1 });
  
  // Состояние для динамического обновления времени событий
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  
  // Обновляем текущее время каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Динамические данные из бэкенда
  // carryOver = 10% от текущего джекпота (из game.jackpotAmount)
  const currentJackpotAmount = game?.jackpotAmount || 0;
  const carryOverAmount = currentJackpotAmount * 0.1; // 10% в lamports
  const carryOver = (carryOverAmount / 1_000_000).toFixed(2); // Конвертируем в USDC
  
  // winnerAmount = 90% от текущего джекпота
  const winnerAmountLamports = currentJackpotAmount * 0.9;
  const winnerAmount = (winnerAmountLamports / 1_000_000).toFixed(2);
  
  // Получаем данные для новой игры из текущей стадии (раунд 1)
  const nextStage = getCurrentStage(1); // Новая игра начинается с раунда 1
  const nextStageTimerSeconds = nextStage.timer; // Таймер в секундах
  const nextStageKeys = nextStage.keys; // Количество ключей
  
  // Форматируем таймер для отображения (динамически из nextStage)
  const formatTimerForDisplay = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };
  
  // Динамический таймер для новой игры
  const nextGameTimer = formatTimerForDisplay(nextStageTimerSeconds);

  return (
    <section className="relative py-32 px-4 overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <AnimatedSection delay={0} direction="fade">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4">
              The Final{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Moment
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              When the timer hits zero, all that remains is silence. One player. One winner. One fate.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={0.2} direction="up">
            <div className="text-center mb-12">
              <div className="inline-block relative">
                <div className={`absolute inset-0 blur-3xl animate-pulse ${
                  isExpired 
                    ? "bg-gradient-to-r from-red-600/30 to-orange-600/30" 
                    : "bg-gradient-to-r from-blue-600/30 to-purple-600/30"
                }`} />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-12 backdrop-blur-sm">
                  {isExpired ? (
                    <>
                      <div className="text-8xl font-bold tabular-nums text-red-400">00:00</div>
                      <p className="text-sm text-gray-500 mt-4 uppercase tracking-wider">Timer Expired</p>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl font-bold tabular-nums text-blue-400">
                        {timeRemaining !== null 
                          ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
                          : "--:--:--"
                        }
                      </div>
                      <p className="text-sm text-gray-500 mt-4 uppercase tracking-wider">
                        {game?.isActive ? (game.isPaused ? "Game Paused" : "Time Remaining") : "Game Inactive"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Показываем события только если есть данные из бэкенда */}
          {game?.lastMoveTimestamp && game?.timerDuration && (
            <div className="space-y-6 mb-12">
              {/* Вычисляем реальное время событий на основе данных из бэкенда */}
              {(() => {
                // Время, когда таймер достигнет нуля (или уже достиг)
                const timerExpiryTime = game.lastMoveTimestamp + game.timerDuration;
                
                // Форматируем время события (используем currentTime из state для динамического обновления)
                const formatEventTime = (eventTimestamp: number): string => {
                  const elapsed = currentTime - eventTimestamp;
                  
                  if (elapsed < 0) {
                    // Событие еще не произошло, показываем через сколько
                    const secondsUntil = Math.abs(elapsed);
                    if (secondsUntil < 60) return `in ${secondsUntil}s`;
                    if (secondsUntil < 3600) return `in ${Math.floor(secondsUntil / 60)}m`;
                    return `in ${Math.floor(secondsUntil / 3600)}h`;
                  }
                  
                  // Событие уже произошло, показываем сколько времени назад
                  if (elapsed < 60) return `${elapsed}s ago`;
                  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
                  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
                  return `${Math.floor(elapsed / 86400)}d ago`;
                };
                
                // Проверяем, был ли джекпот уже выдан
                // Если currentRound === 0 и isActive === false, значит игра была перезапущена после claim_win
                const jackpotWasClaimed = game.currentRound === 0 && !game.isActive && game.lastMoveTimestamp > 0;
                
                return (
                  <>
                    <AnimatedSection delay={0.3} direction="left">
                      <TimelineEvent
                        time={formatEventTime(timerExpiryTime)}
                        title="Timer Reached Zero"
                        description={isExpired ? "No more moves possible" : "Timer will expire"}
                      />
                    </AnimatedSection>
                    <AnimatedSection delay={0.4} direction="left">
                      <TimelineEvent
                        time={formatEventTime(timerExpiryTime)}
                        title="Winner Determined"
                        description={isExpired ? "Last player to move wins" : "Last player will win"}
                      />
                    </AnimatedSection>
                    {jackpotWasClaimed && (
                      <AnimatedSection delay={0.5} direction="left">
                        <TimelineEvent
                          time={formatEventTime(game.lastMoveTimestamp)}
                          title="Jackpot Transferred"
                          description={`90% ($${winnerAmount}) to winner, 10% ($${carryOver}) to next game`}
                        />
                      </AnimatedSection>
                    )}
                    {!jackpotWasClaimed && isExpired && (
                      <AnimatedSection delay={0.5} direction="left">
                        <TimelineEvent
                          time="Pending"
                          title="Jackpot Transferred"
                          description={`90% ($${winnerAmount}) will go to winner, 10% ($${carryOver}) to next game`}
                        />
                      </AnimatedSection>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Показываем блок "New Game Begins" только если есть данные о джекпоте */}
          {game?.jackpotAmount !== undefined && game.jackpotAmount > 0 && (
            <AnimatedSection delay={0.6} direction="up">
              <div className="relative max-w-2xl mx-auto">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl opacity-50 animate-pulse" />
                
                {/* Main card */}
                <div className="relative bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                  {/* Header with icon */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full" />
                      <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      New Game Begins
                    </h4>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-center mb-8 leading-relaxed">
                    10% of previous jackpot (<span className="font-semibold text-emerald-400">${carryOver}</span>) seeds the next game.
                    <br />
                    <span className="text-gray-400">The cycle continues. The tension returns.</span>
                  </p>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-white/5 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Starting Jackpot</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                          ${carryOver}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-white/5 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Timer</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          {nextGameTimer}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-white/5 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Keys Required</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {nextStageKeys}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>

        <AnimatedSection delay={0.8} direction="fade">
          <div className="mt-24 text-center">
            <blockquote className="text-2xl font-light text-gray-400 max-w-3xl mx-auto italic">
              "In the silence before the last move, <br />
              <span className="text-white font-normal">every player knows the truth:</span>
              <br />
              It's not about winning. It's about{" "}
              <span className="text-white font-normal">daring to be last.</span>"
            </blockquote>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function TimelineEvent({ time, title, description }: { time: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 max-w-md mx-auto">
      <div className="flex-shrink-0 w-20 text-right">
        <span className="text-sm font-mono text-gray-500">{time}</span>
      </div>
      <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mt-1.5 shadow-lg shadow-yellow-500/50" />
      <div className="flex-1 text-left">
        <div className="font-bold mb-1">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
