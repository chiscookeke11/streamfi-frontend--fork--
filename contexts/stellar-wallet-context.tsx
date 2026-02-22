"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";

interface StellarWalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  status: "connected" | "disconnected" | "connecting";
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const StellarWalletContext = createContext<
  StellarWalletContextType | undefined
>(undefined);

export const useStellarWallet = () => {
  const context = useContext(StellarWalletContext);
  if (!context) {
    throw new Error(
      "useStellarWallet must be used within a StellarWalletProvider"
    );
  }
  return context;
};

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kit] = useState(
    () =>
      new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        modules: allowAllModules(),
      })
  );

  const isConnected = !!publicKey;
  const status = isConnecting
    ? "connecting"
    : isConnected
      ? "connected"
      : "disconnected";

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await kit.openModal({
        onWalletSelected: async wallet => {
          kit.setWallet(wallet.id);
          const { address } = await kit.getAddress();
          setPublicKey(address);
          localStorage.setItem("stellar_last_wallet", wallet.id);
          localStorage.setItem("stellar_auto_connect", "true");
        },
        onClosed: err => {
          console.log("Modal closed", err);
          setIsConnecting(false);
        },
      });
    } catch (err) {
      console.error("Failed to connect Stellar wallet:", err);
      setError("Failed to connect wallet");
      setIsConnecting(false);
    }
  }, [kit]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem("stellar_last_wallet");
    localStorage.removeItem("stellar_auto_connect");
  }, []);

  // Handle auto-connect if needed
  useEffect(() => {
    const autoConnect = localStorage.getItem("stellar_auto_connect") === "true";
    if (autoConnect && !publicKey) {
      // Logic for auto-connecting could go here if the kit supports it
      // For now, we'll just wait for user action or kit-specific auto-connect
    }
  }, [publicKey]);

  return (
    <StellarWalletContext.Provider
      value={{
        publicKey,
        isConnected,
        status,
        connect,
        disconnect,
        isConnecting,
        error,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}
