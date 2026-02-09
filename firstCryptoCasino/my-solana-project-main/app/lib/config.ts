// Конфигурация приложения

// Админский кошелек (публичный адрес - безопасно хранить в коде)
// Для devnet:
export const ADMIN_WALLET_DEVNET = "AmHrVCiySjeSvcDgYDXeE7PVojuTC7oyUbjovW5nrpn7";

// Для mainnet (замените на ваш админский кошелек для mainnet):
export const ADMIN_WALLET_MAINNET = "ВАШ_АДМИНСКИЙ_КОШЕЛЕК_ДЛЯ_MAINNET";

// Определяем текущий админский кошелек в зависимости от сети
export const getAdminWallet = (network: string = "devnet"): string => {
  // Проверяем, что mainnet адрес установлен (не placeholder)
  if (network === "mainnet-beta") {
    if (ADMIN_WALLET_MAINNET === "ВАШ_АДМИНСКИЙ_КОШЕЛЕК_ДЛЯ_MAINNET") {
      console.warn("⚠️ ADMIN_WALLET_MAINNET не установлен! Используется devnet адрес.");
      return ADMIN_WALLET_DEVNET;
    }
    return ADMIN_WALLET_MAINNET;
  }
  return ADMIN_WALLET_DEVNET;
};
