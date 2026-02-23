"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

interface StellarWalletContextValue {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  status: "connected" | "disconnected" | "connecting";
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
}

const noopAsync = async () => {};

const StellarWalletContext = createContext<StellarWalletContextValue>({
  isConnected: false,
  address: null,
  publicKey: null,
  status: "disconnected",
  connect: noopAsync,
  disconnect: noopAsync,
  isLoading: false,
  isConnecting: false,
  error: null,
});

const STORAGE_KEY = "stellar-wallet-id";
const LEGACY_LAST_WALLET_KEY = "stellar_last_wallet";
const LEGACY_AUTO_CONNECT_KEY = "stellar_auto_connect";

async function loadKit() {
  const { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } =
    await import("@creit.tech/stellar-wallets-kit");

  return new StellarWalletsKit({
    network: WalletNetwork.PUBLIC,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  });
}

export function StellarWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kitRef = useRef<any>(null);
  const modalOpenRef = useRef(false);

  const getKit = useCallback(async () => {
    if (!kitRef.current) {
      kitRef.current = await loadKit();
    }
    return kitRef.current;
  }, []);

  useEffect(() => {
    const savedWalletId =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_LAST_WALLET_KEY);
    const shouldAutoConnect =
      localStorage.getItem(LEGACY_AUTO_CONNECT_KEY) === "true";

    if (!savedWalletId || !shouldAutoConnect) {
      return;
    }

    setIsLoading(true);

    getKit()
      .then((kit: any) => {
        kit.setWallet(savedWalletId);
        return kit.getAddress();
      })
      .then(({ address: addr }: { address: string }) => {
        setAddress(addr);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_LAST_WALLET_KEY);
        localStorage.removeItem(LEGACY_AUTO_CONNECT_KEY);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getKit]);

  const connect = useCallback(async () => {
    if (modalOpenRef.current) {
      return;
    }

    const kit = await getKit();
    modalOpenRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await kit.openModal({
        onWalletSelected: async (option: { id: string }) => {
          modalOpenRef.current = false;
          try {
            kit.setWallet(option.id);
            const { address: addr } = await kit.getAddress();
            localStorage.setItem(STORAGE_KEY, option.id);
            localStorage.setItem(LEGACY_LAST_WALLET_KEY, option.id);
            localStorage.setItem(LEGACY_AUTO_CONNECT_KEY, "true");
            setAddress(addr);
          } catch (connectionError) {
            console.error("Stellar wallet connection failed:", connectionError);
            setError("Failed to connect wallet");
          } finally {
            setIsLoading(false);
          }
        },
        onClosed: () => {
          modalOpenRef.current = false;
          setIsLoading(false);
        },
      });
    } catch (connectionError) {
      modalOpenRef.current = false;
      setIsLoading(false);
      console.error("Failed to open wallet modal:", connectionError);
      setError("Failed to connect wallet");
    }
  }, [getKit]);

  const disconnect = useCallback(async () => {
    const kit = await getKit();
    try {
      await kit.disconnect();
    } catch {
      // not all modules implement disconnect
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_LAST_WALLET_KEY);
    localStorage.removeItem(LEGACY_AUTO_CONNECT_KEY);
    setAddress(null);
    setError(null);
  }, [getKit]);

  const isConnected = address !== null;
  const status = isLoading
    ? "connecting"
    : isConnected
      ? "connected"
      : "disconnected";

  const value: StellarWalletContextValue = {
    isConnected,
    address,
    publicKey: address,
    status,
    connect,
    disconnect,
    isLoading,
    isConnecting: isLoading,
    error,
  };

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet(): StellarWalletContextValue {
  return useContext(StellarWalletContext);
}
