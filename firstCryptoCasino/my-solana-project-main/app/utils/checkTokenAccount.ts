// Утилита для проверки токен аккаунта
import { PublicKey, Connection } from "@solana/web3.js";
import { getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function checkTokenAccount(
  connection: Connection,
  tokenAccountAddress: string
) {
  try {
    const tokenAccountPubkey = new PublicKey(tokenAccountAddress);
    
    // Сначала проверяем, что это действительно токен аккаунт
    // Добавляем retry для rate limiting
    let accountInfo;
    let retries = 3;
    while (retries > 0) {
      try {
        accountInfo = await connection.getAccountInfo(tokenAccountPubkey);
        break;
      } catch (err: any) {
        if ((err.message?.includes("429") || err.message?.includes("Too many requests")) && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          retries--;
          continue;
        }
        throw err;
      }
    }
    
    if (!accountInfo) {
      return {
        exists: false,
        error: "Account not found",
      };
    }
    
    // Проверяем, что аккаунт принадлежит Token Program
    if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      return {
        exists: false,
        error: "Not a token account (invalid owner)",
        owner: accountInfo.owner.toString(),
      };
    }
    
    // Добавляем retry для getAccount
    retries = 3;
    let account;
    while (retries > 0) {
      try {
        account = await getAccount(connection, tokenAccountPubkey);
        break;
      } catch (err: any) {
        if ((err.message?.includes("429") || err.message?.includes("Too many requests")) && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          retries--;
          continue;
        }
        throw err;
      }
    }
    
    // Проверяем, что account был успешно получен
    if (!account) {
      return {
        exists: false,
        error: "Failed to get token account after retries",
      };
    }
    
    return {
      exists: true,
      mint: account.mint.toString(),
      owner: account.owner.toString(),
      amount: Number(account.amount),
      amountUsdc: Number(account.amount) / 1_000_000,
      decimals: account.mint.toString() === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" ? 6 : undefined,
    };
  } catch (error: any) {
    if (error.name === "TokenAccountNotFoundError" || error.message?.includes("could not find account")) {
      return {
        exists: false,
        error: "Token account not found",
      };
    }
    // Не логируем ошибки rate limiting
    if (!error.message?.includes("429") && !error.message?.includes("Too many requests")) {
      console.error("Error checking token account:", error);
    }
    return {
      exists: false,
      error: error.message || "Unknown error",
    };
  }
}

// Найти все токен аккаунты пользователя
export async function findAllTokenAccounts(
  connection: Connection,
  owner: PublicKey
) {
  try {
    // Используем RPC метод напрямую
    const accounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    if (!accounts || !accounts.value) {
      return [];
    }
    
    return accounts.value
      .filter(account => {
        const data = account.account.data;
        return data && typeof data === 'object' && 'parsed' in data && data.parsed && typeof data.parsed === 'object' && 'info' in data.parsed;
      })
      .map(account => {
        const parsedData = account.account.data as { parsed: { info: { mint: string; tokenAmount?: { uiAmount?: number; amount?: string; decimals?: number } } } };
        return {
          address: account.pubkey.toString(),
          mint: parsedData.parsed.info.mint,
          amount: parsedData.parsed.info.tokenAmount?.uiAmount || 0,
          amountRaw: parsedData.parsed.info.tokenAmount?.amount || "0",
          decimals: parsedData.parsed.info.tokenAmount?.decimals || 0,
        };
      });
  } catch (error: any) {
    // Не логируем ошибки rate limiting (429) - это нормально
    if (!error.message?.includes("429") && !error.message?.includes("Too many requests")) {
      console.error("Error finding token accounts:", error);
    }
    return [];
  }
}
