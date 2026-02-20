"use client";
import type React from "react";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core";
import { AuthProvider } from "./auth/auth-provider";

import { ThemeProvider } from "@/contexts/theme-context";

// Create a stable cache instance outside the component to ensure proper cache sharing
const swrCache = new Map();

/** One-time cleanup of old starknet_* keys for returning users (Stellar migration). */
function StarknetKeyCleanup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const remove = () => {
      try {
        if (localStorage.getItem("starknet_last_wallet")) {
          localStorage.removeItem("starknet_last_wallet");
          localStorage.removeItem("starknet_auto_connect");
        }
      } catch {
        // ignore
      }
    };
    remove();
    const timer = setTimeout(remove, 500);
    return () => clearTimeout(timer);
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // Recommended connectors for StarkNet

    recommended: [argent(), braavos()],
    // Include all injected connectors
    includeRecommended: "always",
    // Order of connectors

    order: "alphabetical",
  });

  return (
    <SWRConfig
      value={{
        // Global SWR configuration for optimal performance
        dedupingInterval: 10000, // Deduplicate requests within 10 seconds
        revalidateOnFocus: false, // Don't refetch on window focus
        revalidateOnReconnect: true, // Refetch on network reconnect
        shouldRetryOnError: false, // Don't retry on error by default
        // Use stable cache instance for proper cache sharing across all components
        provider: () => swrCache,
      }}
    >
      <StarknetKeyCleanup>
        <StarknetConfig
          chains={[mainnet, sepolia]}
          provider={publicProvider()}
          connectors={connectors}
          explorer={voyager}
          autoConnect={true}
        >
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </StarknetConfig>
      </StarknetKeyCleanup>
    </SWRConfig>
  );
}
