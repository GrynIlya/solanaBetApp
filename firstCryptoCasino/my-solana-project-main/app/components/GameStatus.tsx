"use client";

import { useState, useEffect, useMemo } from "react";
import { useGameContext } from "../contexts/GameContext";
import { useTimer } from "../hooks/useTimer";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAdmin } from "../hooks/useAdmin";

export function GameStatus() {
  const { game, loading, error } = useGameContext();
  const { formattedTime, isExpired } = useTimer(game);
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { isAdmin } = useAdmin();
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [feeBalance, setFeeBalance] = useState<number | null>(null);
  const [feeTokenAccountAddress, setFeeTokenAccountAddress] = useState<string | null>(null);
  const [playerTokenAccountAddress, setPlayerTokenAccountAddress] = useState<string | null>(null);

  // Загружаем баланс USDC игрока
  useEffect(() => {
    if (!game || !connected || !publicKey || !connection) {
      setUsdcBalance(null);
      return;
    }

    const loadBalance = async () => {
      // Не показываем loading - показываем старое значение пока загружается новое
      try {
        const splToken = await import("@solana/spl-token");
        const { getAssociatedTokenAddressSync, getAccount } = splToken;
        
        const usdcMint = new PublicKey(game.usdcMint);
        const playerTokenAccount = getAssociatedTokenAddressSync(
          usdcMint,
          publicKey,
          false
        );

        try {
          const account = await getAccount(connection, playerTokenAccount);
          setUsdcBalance(Number(account.amount) / 1_000_000); // Конвертируем в USDC
          
          // Проверяем, что mint совпадает
          if (account.mint.toString() !== game.usdcMint) {
            console.warn(`Mint mismatch! Game uses: ${game.usdcMint}, Account has: ${account.mint.toString()}`);
          }
        } catch (err: any) {
          // ATA не существует или пустой
          if (err.name === "TokenAccountNotFoundError" || err.message?.includes("could not find account")) {
            setUsdcBalance(0);
          } else {
            console.error("Error loading USDC balance:", err);
            // Не сбрасываем баланс при ошибке - оставляем старое значение
          }
        }
      } catch (err) {
        console.error("Error loading USDC balance:", err);
        // Не сбрасываем баланс при ошибке - оставляем старое значение
      }
    };

    loadBalance();
  }, [game, connected, publicKey, connection]);

  // Загружаем баланс комиссий (только если текущий пользователь - админ)
  // Оптимизировано: загружаем только при изменении game.jackpotAmount или при первой загрузке
  // Используем useMemo для отслеживания изменений, которые действительно требуют обновления баланса
  const feeBalanceKey = useMemo(() => {
    if (!game) return null;
    // Обновляем баланс только при изменении jackpotAmount (когда кто-то сделал ход)
    // или platformFeeAccount (если изменился админ)
    return `${game.jackpotAmount}-${game.platformFeeAccount}`;
  }, [game?.jackpotAmount, game?.platformFeeAccount]);
  
  useEffect(() => {
    if (!game || !connected || !publicKey || !connection || !isAdmin || !feeBalanceKey) {
      setFeeBalance(null);
      return;
    }

    const loadFeeBalance = async () => {
      // Не показываем loading - показываем старое значение пока загружается новое
      try {
        const splToken = await import("@solana/spl-token");
        const { getAssociatedTokenAddressSync, getAccount } = splToken;
        
        const usdcMint = new PublicKey(game.usdcMint);
        const adminPublicKey = new PublicKey(game.platformFeeAccount);
        const feeTokenAccount = getAssociatedTokenAddressSync(
          usdcMint,
          adminPublicKey,
          false
        );
        
        // Сохраняем адрес fee account для проверки
        setFeeTokenAccountAddress(feeTokenAccount.toString());

        // Вычисляем player token account для проверки
        if (connected && publicKey) {
          const playerTokenAccount = getAssociatedTokenAddressSync(usdcMint, publicKey, false).toString();
          setPlayerTokenAccountAddress(playerTokenAccount);
        }

        // Добавляем задержку чтобы избежать rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const account = await getAccount(connection, feeTokenAccount);
          const balance = Number(account.amount) / 1_000_000;
          setFeeBalance(balance);
        } catch (err: any) {
          // ATA не существует или пустой
          if (err.name === "TokenAccountNotFoundError" || err.message?.includes("could not find account")) {
            setFeeBalance(0);
          } else if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
            console.error("Error loading fee balance:", err);
            // Не сбрасываем баланс при ошибке - оставляем старое значение
          }
        }
      } catch (err: any) {
        if (!err.message?.includes("429") && !err.message?.includes("Too many requests")) {
          console.error("Error loading fee balance:", err);
        }
        // Не сбрасываем баланс при ошибке - оставляем старое значение
      }
    };

    loadFeeBalance();
  }, [feeBalanceKey, connected, publicKey, connection, isAdmin]); // Зависим только от feeBalanceKey вместо всего game

  if (loading) {
    return (
      <div className="glass card p-6">
        <p className="text-sm text-white/70">Loading game state…</p>
      </div>
    );
  }

  if (error) {
    const isNotInitialized = error.includes("not initialized") || error.includes("Account does not exist");
    const isRateLimit = error.includes("429") || error.includes("Rate limit") || error.includes("Too Many Requests");
    
    return (
      <div className={`glass card p-6 ${
        isNotInitialized
          ? "ring-1 ring-yellow-400/20"
          : isRateLimit
            ? "ring-1 ring-orange-400/20"
            : "ring-1 ring-red-400/20"
      }`}>
        <p className="text-sm text-white/80">
          {isNotInitialized ? (
            <>
              <strong className="text-white">Game not initialized</strong>
              <br />
              <span className="text-sm mt-2 block text-white/70">
                The game contract needs to be initialized first. Run:
                <code className="bg-white/10 px-2 py-1 rounded-lg ml-1 font-mono">
                  anchor test
                </code>
                or initialize manually through the contract.
              </span>
            </>
          ) : isRateLimit ? (
            <>
              <strong className="text-white">Rate limit</strong>
              <br />
              <span className="text-sm mt-2 block text-white/70">
                {error}
                <br />
                <span className="text-xs mt-1 block text-white/60">
                  Приложение автоматически возобновит запросы через некоторое время.
                </span>
              </span>
            </>
          ) : (
            `Error: ${error}`
          )}
        </p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="glass card p-6 ring-1 ring-yellow-400/20">
        <p className="text-sm text-white/80">
          <strong className="text-white">Game not initialized</strong>
          <br />
          <span className="text-sm mt-2 block text-white/70">
            Please initialize the game contract first.
          </span>
        </p>
      </div>
    );
  }

  const jackpotUsdc = (game.jackpotAmount / 1_000_000).toFixed(2);
  // Для тестов: раунды 1-5: 1 ключ, раунды 6-10: 2 ключа, и т.д.
  // В продакшене: раунды 1-50: 1 ключ, раунды 51-100: 2 ключа
  const costKeys = Math.floor((game.currentRound - 1) / 5) + 1; // Для тестов: 5 раундов на стадию
  const costUsdc = costKeys.toFixed(2);

  return (
    <div className="glass card p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Game</h2>
          <p className="mt-1 text-sm text-white/60">
            Live on-chain state (polled). Timer is local UI based on last move.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="badge text-white/80">
            {game.isActive ? (game.isPaused ? "Paused" : "Active") : "Inactive"}
          </span>
          {isExpired && game.isActive && (
            <span className="badge text-red-200/90 ring-1 ring-red-400/20">Timer expired</span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Current round</p>
          <p className="mt-1 text-2xl font-semibold text-white">{game.currentRound}</p>
          {game.currentRound > 0 && (
            <p className="mt-2 text-xs text-white/50">
              Stage: <span className="font-mono">{Math.floor(game.currentRound / 5)}</span>{" "}
              <span className="text-white/35">(test staging: 5 rounds)</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Timer</p>
          <p className={`mt-1 text-2xl font-semibold ${isExpired ? "text-red-200" : "text-white"}`}>
            {formattedTime}
          </p>
          {game.currentRound > 0 && !isExpired && (
            <p className="mt-2 text-xs text-white/50">
              Base:{" "}
              <span className="font-mono">
                {Math.floor(game.timerDuration / 3600)}h {Math.floor((game.timerDuration % 3600) / 60)}m
              </span>{" "}
              <span className="text-white/35">(test: −10m each 5 rounds)</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Jackpot</p>
          <p className="mt-1 text-2xl font-semibold text-white">{jackpotUsdc} USDC</p>
          <p className="mt-2 text-xs text-white/50">
            90% of each move goes here (10% fee).
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">Cost per move</p>
          <p className="mt-1 text-2xl font-semibold text-white">{costUsdc} USDC</p>
          <p className="mt-2 text-xs text-white/50">
            Keys: <span className="font-mono">{costKeys}</span>{" "}
            <span className="text-white/35">(test formula)</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
          <p className="text-xs text-white/60">Last player</p>
          <p className="mt-1 font-mono text-sm text-white/85 break-all">
            {game.lastPlayer}
          </p>
        </div>

        {connected && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-white/60">Your USDC balance</p>
                <p className={`mt-1 text-xl font-semibold ${
                  usdcBalance !== null && usdcBalance < parseFloat(costUsdc)
                    ? "text-red-200"
                    : "text-white"
                }`}>
                  {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : "N/A"}
                </p>
                <p className="mt-1 text-xs text-white/40 font-mono">
                  Mint: {game.usdcMint}
                </p>
              </div>
              {usdcBalance !== null && usdcBalance < parseFloat(costUsdc) && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Not enough for a move. Need <span className="font-mono">{costUsdc}</span> USDC.
                </div>
              )}
            </div>
          </div>
        )}

        {connected && isAdmin && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-white/60">Platform fees (admin)</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {feeBalance !== null ? `${feeBalance.toFixed(2)} USDC` : "N/A"}
                </p>
                <p className="mt-1 text-xs text-white/40 font-mono break-all">
                  Fee owner: {game.platformFeeAccount}
                </p>
              </div>
              <div className="text-xs text-white/60">
                Est. fees collected (UI only):{" "}
                <span className="font-mono text-white/80">{(game.currentRound * 0.1).toFixed(2)} USDC</span>
                {feeTokenAccountAddress && playerTokenAccountAddress && feeTokenAccountAddress === playerTokenAccountAddress && (
                  <p className="mt-1 text-white/45">
                    You are playing from the admin wallet, so fee ATA may match your player ATA.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
