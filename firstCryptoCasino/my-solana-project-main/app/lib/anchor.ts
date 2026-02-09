import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import idlJson from "../public/idl.json";

const idl = idlJson as Idl;

// Program ID из контракта (обновлен после деплоя)
export const PROGRAM_ID = new PublicKey(
  "AY4ggjnoRccQxDcjpWXbzhpD3DtXS8f7U6qQQsSEfADa"
);

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
// ⚠️ ВАЖНО: Публичный RPC endpoint имеет строгие ограничения по rate limiting
// Для избежания ошибок 429 и медленной работы Phantom wallet рекомендуется использовать приватный RPC endpoint
// 
// Бесплатные варианты:
// - QuickNode: https://www.quicknode.com/ (бесплатный tier доступен)
// - Helius: https://www.helius.dev/ (бесплатный tier доступен)
// - Triton: https://triton.one/ (бесплатный tier доступен)
//
// Использование:
// 1. Создайте файл .env.local в папке app/
// 2. Добавьте строку: NEXT_PUBLIC_RPC_URL=https://your-rpc-endpoint-url
// 3. Перезапустите frontend: npm run dev
//
// Пример для QuickNode devnet:
// NEXT_PUBLIC_RPC_URL=https://your-endpoint-name.solana-devnet.quiknode.pro/your-api-key/
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || (
  NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com"
);

// Hook для получения Anchor program
export function useProgram(): Program<Idl> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) {
    return null;
  }

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );

  return new Program(idl, provider);
}

// Получить PDA для игры
export function getGamePda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("game")], programId);
}

// Получить ATA для токена
export function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false
): PublicKey {
  const { getAssociatedTokenAddressSync } = require("@solana/spl-token");
  return getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve);
}
