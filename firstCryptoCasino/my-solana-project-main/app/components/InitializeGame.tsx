"use client";

import { useState, useEffect } from "react";
import { useProgram, getGamePda, PROGRAM_ID } from "../lib/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAdmin } from "../hooks/useAdmin";
import { useGameContext } from "../contexts/GameContext";

// Devnet USDC mint по умолчанию
const DEVNET_USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"; // Обновлен на ваш mint
const DEVNET_USDC_MINT_OLD = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Старый mint
const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function InitializeGame() {
  const program = useProgram();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { isAdmin } = useAdmin();
  const { closeGame } = useGameContext();
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usdcMint, setUsdcMint] = useState(DEVNET_USDC_MINT);
  const [isDevnet, setIsDevnet] = useState(true);
  const [gameExists, setGameExists] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Определяем сеть, баланс и проверяем программу
  useEffect(() => {
    if (connection && publicKey) {
      const checkNetwork = async () => {
        try {
          const genesisHash = await connection.getGenesisHash();
          // Devnet genesis hash отличается от mainnet
          const devnetHash = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
          const isDev = genesisHash === devnetHash;
          setIsDevnet(isDev);
          
          if (!isDev) {
            setError("⚠️ Вы подключены к MAINNET! Переключитесь на DEVNET в настройках Phantom.");
            return;
          }

          // Проверяем, что программа развернута
          try {
            const programInfo = await connection.getAccountInfo(PROGRAM_ID);
            if (!programInfo) {
              setError(
                "⚠️ Программа не развернута на devnet! " +
                "Выполните: anchor deploy --provider.cluster devnet"
              );
              return;
            }
            
            // Проверяем, существует ли аккаунт игры
            const [gamePda] = getGamePda(PROGRAM_ID);
            const gameAccountInfo = await connection.getAccountInfo(gamePda);
            setGameExists(gameAccountInfo !== null);
            if (gameAccountInfo) {
              console.log("⚠️ Аккаунт игры уже существует! Нужно закрыть его перед инициализацией.");
            }
          } catch (err) {
            console.error("Failed to check program:", err);
            setError("⚠️ Не удалось проверить программу. Убедитесь, что она развернута.");
            return;
          }

          // Получаем баланс
          const balanceLamports = await connection.getBalance(publicKey);
          const balanceSOL = balanceLamports / 1e9;
          setBalance(balanceSOL);

          if (balanceSOL < 0.1) {
            setError(
              `⚠️ Недостаточно SOL для транзакции. Баланс: ${balanceSOL.toFixed(4)} SOL. ` +
              `Получите тестовые SOL: https://faucet.solana.com/`
            );
          } else {
            // Очищаем ошибку, если все проверки прошли
            setError(null);
          }
        } catch (err) {
          console.error("Failed to check network:", err);
          setError("Ошибка при проверке сети. Проверьте подключение.");
        }
      };

      checkNetwork();
    }
  }, [connection, publicKey]);

  const handleCloseGame = async () => {
    if (!program || !connected || !publicKey || !connection) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can close the game");
      return;
    }

    setClosing(true);
    setError(null);
    setSuccess(null);

    try {
      const [gamePda] = getGamePda(PROGRAM_ID);
      
      // Проверяем, существует ли аккаунт
      const gameAccountInfo = await connection.getAccountInfo(gamePda);
      if (!gameAccountInfo) {
        setError("Game account does not exist");
        setGameExists(false);
        setClosing(false);
        return;
      }

      // Теперь close_game использует AccountInfo и не требует десериализацию
      const tx = await closeGame();
      setSuccess(`Game closed! TX: ${tx.slice(0, 8)}...`);
      
      // Ждем подтверждения транзакции
      await connection.confirmTransaction(tx, "confirmed");
      
      // Проверяем, что аккаунт действительно закрыт
      const closedGameAccountInfo = await connection.getAccountInfo(gamePda);
      setGameExists(closedGameAccountInfo !== null);
      
      if (closedGameAccountInfo === null) {
        console.log("✅ Аккаунт игры успешно закрыт");
      } else {
        console.warn("⚠️ Аккаунт игры все еще существует после закрытия");
      }
      
      // Обновляем баланс после транзакции
      if (connection) {
        const newBalance = await connection.getBalance(publicKey);
        setBalance(newBalance / 1e9);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to close game";
      console.error("Error closing game:", err);
      setError(errorMsg);
    } finally {
      setClosing(false);
    }
  };

  const handleInitialize = async () => {
    if (!program || !connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isAdmin) {
      setError("Only admin can initialize the game");
      return;
    }

    if (!usdcMint) {
      setError("Please enter USDC mint address");
      return;
    }
    
    // Проверяем, существует ли аккаунт игры
    if (gameExists) {
      setError("Game account already exists! Please close it first using the 'Close Game' button.");
      return;
    }

    // Проверка баланса перед транзакцией
    if (balance !== null && balance < 0.1) {
      setError(
        `Недостаточно SOL для транзакции. Текущий баланс: ${balance.toFixed(4)} SOL. ` +
        `Минимум требуется: 0.1 SOL. ` +
        `Получите тестовые SOL на devnet: https://faucet.solana.com/`
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const [gamePda] = getGamePda(PROGRAM_ID);
      const splToken = await import("@solana/spl-token");
      const { 
        getAssociatedTokenAddressSync, 
        getAccount,
        createAssociatedTokenAccountInstruction,
        TOKEN_PROGRAM_ID, 
        ASSOCIATED_TOKEN_PROGRAM_ID 
      } = splToken;
      const { SystemProgram } = await import("@solana/web3.js");

      let usdcMintPubkey: PublicKey;
      try {
        usdcMintPubkey = new PublicKey(usdcMint);
      } catch {
        setError("Invalid USDC mint address");
        setLoading(false);
        return;
      }

      const jackpotTokenAccount = getAssociatedTokenAddressSync(
        usdcMintPubkey,
        gamePda,
        true
      );

      // Fee account = admin's wallet (комиссии идут напрямую на админа)
      const feeTokenAccount = getAssociatedTokenAddressSync(
        usdcMintPubkey,
        publicKey, // admin's wallet
        false
      );

      console.log("🔍 Debug info:");
      console.log("  - Admin wallet:", publicKey.toString());
      console.log("  - USDC Mint:", usdcMintPubkey.toString());
      console.log("  - Fee Token Account (ATA):", feeTokenAccount.toString());

      // Создаем оба ATA автоматически, если их еще нет
      // Это полностью автоматически - пользователь ничего не делает
      const preInstructions = [];
      
      // Проверяем и создаем jackpot ATA (для game PDA)
      try {
        const jackpotAccountInfo = await getAccount(connection, jackpotTokenAccount);
        console.log("✅ Jackpot account ATA уже существует:", jackpotTokenAccount.toString());
      } catch (error: any) {
        if (error.name === "TokenAccountNotFoundError" || error.message?.includes("could not find account")) {
          console.log("ℹ️ Jackpot account ATA не существует, создаем автоматически...");
          // Для создания ATA для PDA нужно использовать getAssociatedTokenAddressSync с allowOwnerOffCurve=true
          // и создать через createAssociatedTokenAccountInstruction
          preInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer (admin)
              jackpotTokenAccount, // ata для game PDA
              gamePda, // owner (game PDA)
              usdcMintPubkey, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        } else {
          console.error("❌ Ошибка при проверке jackpot account ATA:", error);
          throw error;
        }
      }
      
      // Проверяем и создаем fee ATA (для admin wallet)
      try {
        const feeAccountInfo = await getAccount(connection, feeTokenAccount);
        console.log("✅ Fee account ATA уже существует:", feeTokenAccount.toString());
        console.log("  - Owner:", feeAccountInfo.owner.toString());
        console.log("  - Mint:", feeAccountInfo.mint.toString());
      } catch (error: any) {
        if (error.name === "TokenAccountNotFoundError" || error.message?.includes("could not find account")) {
          console.log("ℹ️ Fee account ATA не существует, создаем автоматически...");
          preInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer (admin)
              feeTokenAccount, // ata
              publicKey, // owner (admin's wallet)
              usdcMintPubkey, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        } else {
          console.error("❌ Ошибка при проверке fee account ATA:", error);
          throw error;
        }
      }
      
      console.log("📋 PreInstructions count:", preInstructions.length);

      const initialTimer = new BN(43200); // 12 часов (43200 секунд)

      console.log("🚀 Создаем транзакцию initialize...");
      console.log("  - PreInstructions:", preInstructions.length);
      console.log("  - Game PDA:", gamePda.toString());
      console.log("  - Jackpot Token Account:", jackpotTokenAccount.toString());
      console.log("  - Platform Fee Token Account:", feeTokenAccount.toString());
      
      // Сначала симулируем транзакцию для проверки
      // Оба ATA создаются через preInstructions если нужно
      try {
        const simulateResult = await program.methods
          .initialize(initialTimer, usdcMintPubkey)
          .accounts({
            game: gamePda,
            jackpotTokenAccount: jackpotTokenAccount, // ATA для game PDA (создается через preInstructions если нужно)
            usdcMint: usdcMintPubkey,
            admin: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .preInstructions(preInstructions) // Автоматически создаем оба ATA если нужно
          .simulate();
        
        console.log("✅ Симуляция успешна:", simulateResult);
      } catch (simError: any) {
        console.error("❌ Ошибка симуляции:", simError);
        console.error("  - Error name:", simError.name);
        console.error("  - Error message:", simError.message);
        console.error("  - Error code:", simError.code);
        console.error("  - Error logs:", simError.logs);
        
        // Пробуем получить больше информации об ошибке
        if (simError.error) {
          console.error("  - Error details:", simError.error);
        }
        if (simError.programError) {
          console.error("  - Program error:", simError.programError);
        }
        if (simError.simulationResponse) {
          console.error("  - Simulation response:", simError.simulationResponse);
        }
        
        // Пробуем получить логи из simulationResponse
        if (simError.simulationResponse?.logs) {
          console.error("  - Simulation logs:", simError.simulationResponse.logs);
        }
        
        // Пробуем получить все свойства ошибки
        console.error("  - All error properties:", Object.keys(simError));
        for (const key in simError) {
          if (key !== 'stack' && key !== 'message') {
            console.error(`  - ${key}:`, simError[key]);
          }
        }
        
        // Если это ошибка симуляции, пробуем отправить транзакцию напрямую
        // (иногда симуляция падает, но реальная транзакция проходит)
        const hasLogs = simError.logs && simError.logs.length > 0;
        const hasSimulationLogs = simError.simulationResponse?.logs && simError.simulationResponse.logs.length > 0;
        
        if (hasLogs || hasSimulationLogs) {
          const logs = hasLogs ? simError.logs : simError.simulationResponse.logs;
          console.log("⚠️ Симуляция упала, но пробуем отправить транзакцию...");
          console.log("  - Logs:", logs);
          
          // Проверяем, есть ли ошибка "Provided owner is not allowed"
          const errorMessage = JSON.stringify(logs);
          if (errorMessage.includes("Provided owner is not allowed")) {
            throw new Error(
              "Ошибка: Provided owner is not allowed. " +
              "Это означает, что контракт пытается создать ATA автоматически. " +
              "Убедитесь, что контракт передеплоен с использованием constraint вместо init_if_needed."
            );
          }
        }
        
        // Все равно пробуем отправить транзакцию, если это не критическая ошибка
        console.log("⚠️ Пробуем отправить транзакцию несмотря на ошибку симуляции...");
      }

      const tx = await program.methods
        .initialize(initialTimer, usdcMintPubkey)
        .accounts({
          game: gamePda,
          jackpotTokenAccount: jackpotTokenAccount, // ATA для game PDA (создается через preInstructions если нужно)
          usdcMint: usdcMintPubkey,
          admin: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .preInstructions(preInstructions) // Автоматически создаем оба ATA если нужно
        .rpc();

      setSuccess(`Game initialized! TX: ${tx.slice(0, 8)}...`);
      
      // Ждем подтверждения транзакции
      await connection.confirmTransaction(tx, "confirmed");
      
      // Обновляем состояние - аккаунт игры теперь существует
      const gameAccountInfo = await connection.getAccountInfo(gamePda);
      setGameExists(gameAccountInfo !== null);
      
      // Обновляем баланс после транзакции
      if (connection) {
        const newBalance = await connection.getBalance(publicKey);
        setBalance(newBalance / 1e9);
      }
      
      // Обновляем состояние игры через refresh (если доступен)
      // Это обновит UI и покажет новую игру
    } catch (err: any) {
      const errorMsg = err.message || "Failed to initialize game";
      
      if (errorMsg.includes("Attempt to debit") || errorMsg.includes("insufficient funds")) {
        setError(
          `Недостаточно SOL для транзакции. ` +
          `Текущий баланс: ${balance?.toFixed(4) || "unknown"} SOL. ` +
          `Получите тестовые SOL на devnet: https://faucet.solana.com/`
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="glass card p-7 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Initialize Game</h2>
          <p className="mt-1 text-sm text-white/60">
            One-time setup. Creates the game PDA and jackpot account bindings for the chosen mint.
          </p>
        </div>
        <span className="badge text-white/80">Admin only</span>
      </div>

      {/* Предупреждение о сети */}
      {!isDevnet && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
          <p className="font-semibold text-red-200 mb-2">
            ВНИМАНИЕ: вы подключены к MAINNET
          </p>
          <p className="text-sm text-red-200/80 mb-2">
            Для тестирования переключите Phantom на DEVNET:
          </p>
          <ol className="text-sm text-red-200/80 list-decimal list-inside space-y-1">
            <li>Откройте Phantom</li>
            <li>Нажмите на иконку настроек (шестеренка)</li>
            <li>Выберите "Developer Settings"</li>
            <li>Включите "Testnet Mode" или выберите "Devnet"</li>
            <li>Обновите страницу</li>
          </ol>
        </div>
      )}

      {/* Информация о балансе */}
      {balance !== null && (
        <div className={`rounded-2xl border p-4 ${
          balance < 0.1
            ? "border-yellow-400/20 bg-yellow-500/10"
            : "border-emerald-400/20 bg-emerald-500/10"
        }`}>
          <p className="text-sm text-white/85">
            Balance: <strong className="font-mono">{balance.toFixed(4)} SOL</strong>
            {balance < 0.1 && (
              <>
                <br />
                <span className="text-xs text-white/70">
                  Недостаточно для транзакции. Получите тестовые SOL:{" "}
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
                  >
                    faucet.solana.com
                  </a>
                </span>
              </>
            )}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white/80">
          USDC Mint Address:
        </label>
        <input
          type="text"
          value={usdcMint}
          onChange={(e) => setUsdcMint(e.target.value)}
          placeholder={isDevnet ? DEVNET_USDC_MINT : MAINNET_USDC_MINT}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:ring-2 focus:ring-violet-500/30"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setUsdcMint(DEVNET_USDC_MINT)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            Ваш USDC Mint (Gh9Zw...)
          </button>
          <button
            onClick={() => setUsdcMint(DEVNET_USDC_MINT_OLD)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            Старый Devnet USDC
          </button>
          <button
            onClick={() => setUsdcMint(MAINNET_USDC_MINT)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            Mainnet USDC
          </button>
        </div>
        <p className="text-xs text-white/50 mt-1">
          {isDevnet ? (
            <>
              <strong className="text-white/70">Рекомендуется:</strong>{" "}
              <span className="font-mono">{DEVNET_USDC_MINT}</span>
              <br />
              <span className="text-white/40">
                Старый: <span className="font-mono">{DEVNET_USDC_MINT_OLD}</span>
              </span>
            </>
          ) : (
            <>
              Mainnet USDC: <span className="font-mono">{MAINNET_USDC_MINT}</span>
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
          <p className="text-red-200 font-semibold mb-2">{error}</p>
          {error.includes("не развернута") && (
            <div className="mt-3 text-sm text-red-200/80">
              <p className="font-semibold mb-2 text-red-100">Как развернуть программу:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Откройте терминал в корне проекта</li>
                <li>Выполните: <code className="bg-white/10 px-2 py-0.5 rounded-lg font-mono">anchor build</code></li>
                <li>Выполните: <code className="bg-white/10 px-2 py-0.5 rounded-lg font-mono">anchor deploy --provider.cluster devnet</code></li>
                <li>Обновите страницу</li>
              </ol>
              <p className="mt-2 text-xs text-white/60">
                Подробнее: см. файл <code className="bg-white/10 px-2 py-0.5 rounded-lg font-mono">DEPLOY.md</code> в корне проекта
              </p>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
          {success}
        </div>
      )}

      {!isAdmin && connected && (
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
          <p className="text-yellow-100 font-semibold">
            Только администратор может инициализировать игру
          </p>
          <p className="text-yellow-100/80 text-sm mt-1">
            Подключите админский кошелек для инициализации игры.
          </p>
        </div>
      )}

      {gameExists && isAdmin && (
        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 mb-4">
          <p className="text-orange-100 font-semibold mb-2">
            ⚠️ Аккаунт игры уже существует!
          </p>
          <p className="text-orange-100/80 text-sm mb-3">
            После передеплоя контракта старый аккаунт игры остался на блокчейне. 
            Нужно закрыть его перед инициализацией новой игры.
          </p>
          <button
            onClick={handleCloseGame}
            disabled={closing || !isAdmin}
            className="btn-primary w-full bg-orange-600 hover:bg-orange-700"
          >
            {closing ? "Closing Game..." : "Close Existing Game"}
          </button>
        </div>
      )}

      <button
        onClick={handleInitialize}
        disabled={loading || !usdcMint || !isAdmin || gameExists}
        className="btn-primary w-full"
      >
        {loading ? "Initializing..." : "Initialize Game"}
      </button>
    </div>
  );
}
