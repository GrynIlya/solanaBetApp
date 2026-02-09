import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAdminWallet, ADMIN_WALLET_DEVNET } from "../lib/config";
import { NETWORK } from "../lib/anchor";
import { useMemo, useEffect, useRef } from "react";

/**
 * Hook для проверки, является ли текущий пользователь админом
 */
export function useAdmin() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  // Получаем админский кошелек для текущей сети
  const adminWallet = useMemo(() => getAdminWallet(NETWORK), []);
  
  // Проверяем, является ли подключенный кошелек админским
  const isAdmin = useMemo(() => {
    return connected && publicKey?.toString() === adminWallet;
  }, [connected, publicKey, adminWallet]);

  // Debug логи убраны для уменьшения шума в консоли
  // Раскомментируйте для отладки:
  // const lastLogged = useRef<string>("");
  // useEffect(() => {
  //   const key = `${connected}-${publicKey?.toString()}-${isAdmin}`;
  //   if (key !== lastLogged.current && typeof window !== "undefined") {
  //     console.log("🔍 Admin Check Debug:", {
  //       connected,
  //       publicKey: publicKey?.toString(),
  //       adminWallet,
  //       network: NETWORK,
  //       isAdmin,
  //     });
  //     lastLogged.current = key;
  //   }
  // }, [connected, publicKey, adminWallet, isAdmin]);

  return {
    isAdmin,
    adminWallet,
    connected,
    publicKey,
  };
}
