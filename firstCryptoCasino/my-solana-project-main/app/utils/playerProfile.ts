import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../lib/anchor";
import idlJson from "../public/idl.json";

// Получить PDA для профиля игрока
export function getPlayerProfilePda(player: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), player.toBuffer()],
    programId
  );
}

// Получить имя игрока из блокчейна
export async function getPlayerNameFromChain(
  connection: Connection,
  playerAddress: PublicKey,
  program: Program<any>
): Promise<string | null> {
  try {
    const [playerProfilePda] = getPlayerProfilePda(playerAddress, program.programId);
    
    // Добавляем обработку rate limiting
    let accountInfo;
    try {
      accountInfo = await connection.getAccountInfo(playerProfilePda);
    } catch (err: any) {
      // Если это rate limiting, не логируем ошибку (это нормально)
      if (err.message?.includes("429") || err.message?.includes("Too many requests")) {
        return null; // Просто возвращаем null, fallback на localStorage
      }
      throw err; // Другие ошибки пробрасываем дальше
    }
    
    if (!accountInfo) {
      return null;
    }

    // Декодируем данные аккаунта
    try {
      const playerProfile = await (program.account as any).playerProfile.fetch(playerProfilePda);
      return playerProfile.name || null;
    } catch (err: any) {
      // Если это rate limiting при fetch, не логируем ошибку
      if (err.message?.includes("429") || err.message?.includes("Too many requests")) {
        return null;
      }
      throw err;
    }
  } catch (error: any) {
    // Логируем только если это не rate limiting
    if (!error.message?.includes("429") && !error.message?.includes("Too many requests")) {
      console.error("Error fetching player name from chain:", error);
    }
    return null;
  }
}

// Получить имя игрока (сначала из блокчейна, потом из localStorage)
export async function getPlayerName(
  connection: Connection,
  playerAddress: PublicKey,
  program: Program<any> | null
): Promise<string | null> {
  // Сначала пытаемся получить из блокчейна
  if (program) {
    const chainName = await getPlayerNameFromChain(connection, playerAddress, program);
    if (chainName) {
      return chainName;
    }
  }

  // Fallback на localStorage
  if (typeof window !== "undefined") {
    try {
      const walletNames = JSON.parse(localStorage.getItem("walletNames") || "{}");
      return walletNames[playerAddress.toString()] || null;
    } catch {
      return null;
    }
  }

  return null;
}

// Сохранить имя игрока в блокчейн
export async function setPlayerNameOnChain(
  program: Program<any>,
  player: PublicKey,
  name: string
): Promise<string> {
  try {
    const [playerProfilePda] = getPlayerProfilePda(player, program.programId);
    
    // Используем правильные имена из IDL (snake_case) для совместимости с типами
    const tx = await (program.methods as any)
      .setPlayerName(name)
      .accounts({
        player_profile: playerProfilePda,
        player: player,
        system_program: SystemProgram.programId,
      } as any)
      .rpc();

    return tx;
  } catch (error: any) {
    console.error("Error setting player name on chain:", error);
    throw new Error(error.message || "Failed to set player name on chain");
  }
}
