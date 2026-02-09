import { useEffect, useState, useCallback, useRef } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useProgram, getGamePda, PROGRAM_ID, RPC_URL } from "../lib/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Game } from "../types/my_solana_project";
import idlJson from "../public/idl.json";

export function useGame() {
  const program = useProgram();
  const { connection } = useConnection();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Флаги для предотвращения параллельных запросов и обработки rate limiting
  const isFetchingRef = useRef(false);
  // Начальная задержка (увеличена для уменьшения нагрузки на RPC)
  // Можно настроить через переменную окружения
  // Увеличено до 60 секунд для активной игры и 120 для неактивной, чтобы уменьшить нагрузку на публичный RPC
  const defaultActiveInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_ACTIVE || "60000", 10); // 60 секунд (было 30)
  const defaultInactiveInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL_INACTIVE || "120000", 10); // 120 секунд (было 60)
  const rateLimitDelayRef = useRef(defaultActiveInterval);
  const consecutiveErrorsRef = useRef(0);
  const isPausedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [gamePda] = getGamePda(PROGRAM_ID);

  const fetchGame = useCallback(async () => {
    // Если программа не инициализирована (кошелек не подключен), используем прямое подключение к RPC
    if (!program) {
      if (!connection) {
        setLoading(false);
        setError("Connection not available");
        return;
      }
      
      // Пытаемся загрузить данные через прямое подключение к RPC
      try {
        // Создаем фиктивный провайдер для чтения данных
        const fakeWallet = {
          publicKey: null,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any[]) => txs,
        };
        
        const provider = new AnchorProvider(connection, fakeWallet as any, {
          commitment: "confirmed",
        });
        
        const readOnlyProgram = new Program(idlJson as Idl, provider);
        const gameAccount = await (readOnlyProgram.account as any).game.fetch(gamePda);
        
        setGame({
          currentRound: gameAccount.currentRound.toNumber(),
          jackpotAmount: gameAccount.jackpotAmount.toNumber(),
          lastMoveTimestamp: gameAccount.lastMoveTimestamp.toNumber(),
          timerDuration: gameAccount.timerDuration.toNumber(),
          lastPlayer: gameAccount.lastPlayer.toString(),
          isActive: gameAccount.isActive,
          isPaused: gameAccount.isPaused,
          platformFeeAccount: gameAccount.platformFeeAccount.toString(),
          usdcMint: gameAccount.usdcMint.toString(),
          bump: gameAccount.bump,
          // Поля для предыдущего победителя
          previousWinner: gameAccount.previousWinner ? gameAccount.previousWinner.toString() : "11111111111111111111111111111111",
          previousWinnerAmount: gameAccount.previousWinnerAmount ? gameAccount.previousWinnerAmount.toNumber() : 0,
          previousWinnerClaimed: gameAccount.previousWinnerClaimed !== undefined ? gameAccount.previousWinnerClaimed : true,
        });
        setError(null);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      } catch (err: any) {
        const errorMessage = err.message || String(err);
        // Различные варианты ошибок, когда аккаунт не существует
        if (
          errorMessage.includes("Account does not exist") || 
          errorMessage.includes("no data") ||
          errorMessage.includes("Trying to access beyond buffer length") ||
          errorMessage.includes("Invalid account data") ||
          errorMessage.includes("could not find account")
        ) {
          setError("Game not initialized. Please initialize the game first.");
        } else {
          setError(errorMessage);
        }
        setGame(null);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }
    }

    if (isFetchingRef.current || isPausedRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const gameAccount = await (program.account as any).game.fetch(gamePda);
      setGame({
        currentRound: gameAccount.currentRound.toNumber(),
        jackpotAmount: gameAccount.jackpotAmount.toNumber(),
        lastMoveTimestamp: gameAccount.lastMoveTimestamp.toNumber(),
        timerDuration: gameAccount.timerDuration.toNumber(),
        lastPlayer: gameAccount.lastPlayer.toString(),
        isActive: gameAccount.isActive,
        isPaused: gameAccount.isPaused,
        platformFeeAccount: gameAccount.platformFeeAccount.toString(),
        usdcMint: gameAccount.usdcMint.toString(),
        bump: gameAccount.bump,
        // Поля для предыдущего победителя
        previousWinner: gameAccount.previousWinner ? gameAccount.previousWinner.toString() : "11111111111111111111111111111111",
        previousWinnerAmount: gameAccount.previousWinnerAmount ? gameAccount.previousWinnerAmount.toNumber() : 0,
        previousWinnerClaimed: gameAccount.previousWinnerClaimed !== undefined ? gameAccount.previousWinnerClaimed : true,
      });
      setError(null);
      // Сбрасываем счетчик ошибок при успешном запросе
      if (consecutiveErrorsRef.current > 0) {
        consecutiveErrorsRef.current = Math.max(0, consecutiveErrorsRef.current - 1);
      }
      // Сбрасываем задержку при успехе (используем базовый интервал)
      rateLimitDelayRef.current = defaultActiveInterval;
    } catch (err: any) {
      const errorMessage = err.message || String(err);
      
      // Проверяем на rate limiting (429)
      if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests") || errorMessage.includes("rate limit")) {
        consecutiveErrorsRef.current += 1;
        // Экспоненциальная задержка: начинаем с 60 секунд, затем 120, 180, максимум 300 секунд (5 минут)
        const baseDelay = 60000; // 60 секунд
        const maxDelay = 300000; // 5 минут максимум
        const exponentialDelay = Math.min(maxDelay, baseDelay * consecutiveErrorsRef.current);
        rateLimitDelayRef.current = exponentialDelay;
        isPausedRef.current = true;
        
        setError(`Rate limit exceeded. Retrying in ${Math.floor(rateLimitDelayRef.current / 1000)}s...`);
        console.warn(`⚠️ Rate limit hit (${consecutiveErrorsRef.current} times). Pausing for ${rateLimitDelayRef.current / 1000}s`);
        
        // Временно останавливаем опрос на время задержки
        setTimeout(() => {
          isPausedRef.current = false;
          // Уменьшаем счетчик ошибок постепенно, но не сразу до 0
          consecutiveErrorsRef.current = Math.max(0, consecutiveErrorsRef.current - 1);
        }, rateLimitDelayRef.current);
        
        isFetchingRef.current = false;
        setLoading(false);
        return;
      }
      
      // Проверяем, является ли это ошибкой "Account does not exist"
      // Различные варианты ошибок, когда аккаунт не существует
      if (
        errorMessage.includes("Account does not exist") || 
        errorMessage.includes("no data") ||
        errorMessage.includes("Trying to access beyond buffer length") ||
        errorMessage.includes("Invalid account data") ||
        errorMessage.includes("could not find account")
      ) {
        setError("Game not initialized. Please initialize the game first.");
      } else {
        setError(errorMessage);
      }
      setGame(null);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [program, gamePda, connection]);

  useEffect(() => {
    fetchGame();

    // Подписка на изменения аккаунта игры через polling
    // Работает даже без подключенного кошелька (использует read-only connection)
    if (program || connection) {
      const scheduleNext = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Адаптивный интервал: если игра активна, опрашиваем чаще (30s), иначе реже (60s)
        // Если есть rate limiting, используем увеличенную задержку
        // Можно настроить через NEXT_PUBLIC_POLL_INTERVAL_ACTIVE и NEXT_PUBLIC_POLL_INTERVAL_INACTIVE
        const activeInterval = defaultActiveInterval;
        const inactiveInterval = defaultInactiveInterval;
        
        // Если были ошибки rate limiting, используем увеличенный интервал
        const adjustedInterval = consecutiveErrorsRef.current > 0
          ? Math.max(rateLimitDelayRef.current, activeInterval * 2)
          : (game?.isActive ? activeInterval : inactiveInterval);
        
        const baseInterval = isPausedRef.current 
          ? rateLimitDelayRef.current 
          : adjustedInterval;
        
        timeoutRef.current = setTimeout(() => {
          if (!isPausedRef.current) {
            fetchGame();
          }
          scheduleNext();
        }, baseInterval);
      };

      scheduleNext();

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [program, connection, gamePda, fetchGame, game?.isActive]);

  const makeMove = useCallback(async () => {
    if (!program || !game) throw new Error("Program or game not initialized");
    if (!program.provider.wallet) throw new Error("Wallet not connected");

    const [gamePda] = getGamePda(PROGRAM_ID);
    const splToken = await import("@solana/spl-token");
    const { 
      getAssociatedTokenAddressSync, 
      getAccount,
      createAssociatedTokenAccountInstruction,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    } = splToken;

    const usdcMint = new PublicKey(game.usdcMint);
    const playerPublicKey = program.provider.wallet.publicKey;
    const playerTokenAccount = getAssociatedTokenAddressSync(
      usdcMint,
      playerPublicKey
    );
    const jackpotTokenAccount = getAssociatedTokenAddressSync(
      usdcMint,
      gamePda,
      true
    );
    // Fee account = admin's wallet (хранится в game.platformFeeAccount)
    // ATA создается автоматически при инициализации через init_if_needed
    const feeTokenAccount = getAssociatedTokenAddressSync(
      usdcMint,
      new PublicKey(game.platformFeeAccount),
      false
    );

    // Отладочная информация (только при необходимости)
    // console.log("🎮 Make Move Debug:", {
    //   playerWallet: playerPublicKey.toString(),
    //   playerTokenAccount: playerTokenAccount.toString(),
    //   adminWallet: game.platformFeeAccount,
    //   feeTokenAccount: feeTokenAccount.toString(),
    //   areAccountsSame: playerTokenAccount.toString() === feeTokenAccount.toString()
    // });

    // Проверяем, существует ли ATA игрока, и создаем его если нужно
    const preInstructions = [];
    let playerTokenBalance = 0;
    try {
      // Добавляем retry логику для rate limiting
      let retries = 3;
      let playerTokenAccountInfo;
      while (retries > 0) {
        try {
          playerTokenAccountInfo = await getAccount(program.provider.connection, playerTokenAccount);
          break;
        } catch (err: any) {
          if ((err.message?.includes("429") || err.message?.includes("Too many requests")) && retries > 1) {
            // Rate limiting - ждем и повторяем
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Экспоненциальная задержка
            retries--;
            continue;
          }
          throw err;
        }
      }
      
      if (!playerTokenAccountInfo) {
        throw new Error("Failed to get token account info after retries");
      }
      
      playerTokenBalance = Number(playerTokenAccountInfo.amount);
      
      // Проверяем баланс перед транзакцией
      // Для тестов: 5 раундов на стадию (в продакшене: 50)
      const costKeys = Math.floor((game.currentRound - 1) / 5) + 1;
      const costLamports = costKeys * 1_000_000; // 1 USDC = 1_000_000 lamports
      
      if (playerTokenBalance < costLamports) {
        throw new Error(
          `Insufficient USDC for move. ` +
          `Required: ${costKeys} USDC (${costLamports} lamports), ` +
          `You have: ${(playerTokenBalance / 1_000_000).toFixed(2)} USDC (${playerTokenBalance} lamports). ` +
          `Mint address: ${usdcMint.toString()}`
        );
      }
    } catch (error: any) {
      // Если это ошибка недостаточного баланса, пробрасываем её дальше
      if (error.message && (error.message.includes("Insufficient USDC") || error.message.includes("Недостаточно USDC"))) {
        throw error;
      }
      
      // ATA не существует, нужно создать
      if (error.name === "TokenAccountNotFoundError" || error.message?.includes("could not find account")) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            playerPublicKey, // payer
            playerTokenAccount, // ata
            playerPublicKey, // owner
            usdcMint, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      } else if (error.message?.includes("429") || error.message?.includes("Too many requests")) {
        // Rate limiting - пробуем создать ATA и продолжить (баланс проверим в контракте)
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            playerPublicKey, // payer
            playerTokenAccount, // ata
            playerPublicKey, // owner
            usdcMint, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
        // Не проверяем баланс - контракт проверит его
      } else {
        // Другие ошибки - показываем подробную информацию
        throw new Error(
          `Error checking USDC balance: ${error.message}. ` +
          `Player Token Account: ${playerTokenAccount.toString()}, ` +
          `USDC Mint: ${usdcMint.toString()}`
        );
      }
    }

    let tx: string;
    try {
      // Создаем транзакцию и отправляем её - кошелек должен открыться автоматически
      tx = await program.methods
        .makeMove()
        .accounts({
          game: gamePda,
          playerTokenAccount,
          jackpotTokenAccount,
          platformFeeTokenAccount: feeTokenAccount, // ATA для admin's wallet
          player: playerPublicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc(); // Используем .rpc() без параметров для стандартного поведения
    } catch (rpcError: any) {
      // Если пользователь отменил транзакцию в кошельке, пробрасываем ошибку дальше
      const errorMessage = rpcError.message || String(rpcError);
      const isUserRejected = 
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("User canceled") ||
        errorMessage.includes("reject") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("4001") ||
        errorMessage.includes("User declined");
      
      if (isUserRejected) {
        throw new Error("User rejected the transaction");
      }
      throw rpcError;
    }
    
    // Ждем подтверждения транзакции с таймаутом
    try {
      await Promise.race([
        program.provider.connection.confirmTransaction(tx, "confirmed"),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)
        )
      ]);
    } catch (confirmError) {
      // Если подтверждение не удалось, но транзакция отправлена, продолжаем
      console.warn("Transaction confirmation timeout or error:", confirmError);
    }

    // Обновляем состояние после успешного хода
    await fetchGame();
    return tx;
  }, [program, game, fetchGame]);

  const startGame = useCallback(async (carryOver: number = 0) => {
    if (!program) throw new Error("Program not initialized");
    if (!program.provider.wallet) throw new Error("Wallet not connected");

    const [gamePda] = getGamePda(PROGRAM_ID);
    const adminPublicKey = program.provider.wallet.publicKey;

    const tx = await program.methods
      .startGame(new BN(carryOver))
      .accounts({
        game: gamePda,
        admin: adminPublicKey,
      })
      .rpc();

    // Обновляем состояние после успешного запуска
    await fetchGame();
    return tx;
  }, [program, fetchGame]);

  const claimWin = useCallback(async () => {
    if (!program || !game) throw new Error("Program or game not initialized");
    if (!program.provider.wallet) throw new Error("Wallet not connected");

    const [gamePda] = getGamePda(PROGRAM_ID);
    const splToken = await import("@solana/spl-token");
    const { 
      getAssociatedTokenAddressSync, 
      getAccount,
      createAssociatedTokenAccountInstruction,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    } = splToken;

    const usdcMint = new PublicKey(game.usdcMint);
    const winnerPublicKey = program.provider.wallet.publicKey;
    const winnerTokenAccount = getAssociatedTokenAddressSync(
      usdcMint,
      winnerPublicKey
    );
    const jackpotTokenAccount = getAssociatedTokenAddressSync(
      usdcMint,
      gamePda,
      true
    );

    // Проверяем, существует ли ATA победителя, и создаем его если нужно
    const preInstructions = [];
    try {
      await getAccount(program.provider.connection, winnerTokenAccount);
    } catch (error: any) {
      // ATA не существует, нужно создать
      if (error.name === "TokenAccountNotFoundError" || error.message?.includes("could not find account")) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            winnerPublicKey, // payer
            winnerTokenAccount, // ata
            winnerPublicKey, // owner
            usdcMint, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      } else {
        throw error;
      }
    }

    const tx = await program.methods
      .claimWin()
      .accounts({
        game: gamePda,
        jackpotTokenAccount,
        winnerTokenAccount,
        winner: winnerPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(preInstructions)
      .rpc();

    // Обновляем состояние после успешного получения выигрыша
    await fetchGame();
    return tx;
  }, [program, game, fetchGame]);

  const pauseGame = useCallback(async (pause: boolean) => {
    if (!program) throw new Error("Program not initialized");
    if (!program.provider.wallet) throw new Error("Wallet not connected");

    const [gamePda] = getGamePda(PROGRAM_ID);
    const adminPublicKey = program.provider.wallet.publicKey;

    const tx = await program.methods
      .pauseGame(pause)
      .accounts({
        game: gamePda,
        admin: adminPublicKey,
      })
      .rpc();

    // Обновляем состояние после паузы
    await fetchGame();
    return tx;
  }, [program, fetchGame]);

  const closeGame = useCallback(async () => {
    if (!program) throw new Error("Program not initialized");
    if (!program.provider.wallet) throw new Error("Wallet not connected");

    const [gamePda] = getGamePda(PROGRAM_ID);
    const adminPublicKey = program.provider.wallet.publicKey;
    const { SystemProgram } = await import("@solana/web3.js");

    const tx = await program.methods
      .closeGame()
      .accounts({
        game: gamePda,
        admin: adminPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Обновляем состояние после закрытия
    await fetchGame();
    return tx;
  }, [program, fetchGame]);

  return {
    game,
    loading,
    error,
    refresh: fetchGame,
    startGame,
    makeMove,
    claimWin,
    pauseGame,
    closeGame,
    gamePda: gamePda.toString(),
  };
}
