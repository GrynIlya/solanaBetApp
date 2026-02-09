"use client";

import { useMemo, useEffect, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "../lib/anchor";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const [mounted, setMounted] = useState(false);

  // Проверяем, что компонент смонтирован (для SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  const wallets = useMemo(
    () => {
      if (!mounted) return [];
      
      // Phantom автоматически обнаруживается как Standard Wallet,
      // но мы все равно добавляем его явно для совместимости
      // Solflare добавляем для альтернативы
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
    },
    [mounted]
  );

  // Не рендерим провайдеры до монтирования (избегаем SSR проблем)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass card w-full max-w-md p-8 text-center">
          <p className="text-sm text-white/70">Loading wallet providers…</p>
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <NetworkWarning />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// Компонент для предупреждения о сети
function NetworkWarning() {
  const { connection } = useConnection();
  const [isDevnet, setIsDevnet] = useState<boolean | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        const devnetHash = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
        setIsDevnet(genesisHash === devnetHash);
      } catch {
        setIsDevnet(null);
      }
    };

    checkNetwork();
  }, [connection]);

  if (isDevnet === false) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="glass card mb-6 border border-red-400/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-100">
            <strong>Вы подключены к MAINNET.</strong> Для тестирования переключите Phantom на DEVNET.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
