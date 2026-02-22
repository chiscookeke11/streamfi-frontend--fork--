"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { useStellarWallet } from "@/contexts/stellar-wallet-context";

interface ConnectModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}

export default function ConnectWalletModal({
  isModalOpen,
  setIsModalOpen,
}: ConnectModalProps) {
  const {
    connect,
    isConnected,
    status,
    error: walletError,
  } = useStellarWallet();

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Close modal when wallet connects successfully
  useEffect(() => {
    if (isConnected && isModalOpen) {
      setIsModalOpen(false);
      setIsConnecting(false);
      setConnectionError(null);
    }
  }, [isConnected, isModalOpen, setIsModalOpen]);

  // Handle connection status changes
  useEffect(() => {
    if (status === "connecting") {
      setIsConnecting(true);
      setConnectionError(null);
    } else if (status === "disconnected" && isConnecting) {
      setIsConnecting(false);
      if (walletError) {
        setConnectionError(walletError);
      }
    }
  }, [status, isConnecting, walletError]);

  const handleOverlayClick = () => {
    if (!isConnecting) {
      setIsModalOpen(false);
      setConnectionError(null);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleConnectClick = async () => {
    if (isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      await connect();
    } catch (error) {
      console.error("[ConnectWalletModal] Connection error:", error);
      setConnectionError("Failed to connect wallet. Please try again.");
      setIsConnecting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      setIsModalOpen(false);
      setConnectionError(null);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 ${
        isModalOpen ? "visible" : "hidden"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-[329px] mx-auto bg-[#1D2027] rounded-[16px] py-4 px-[26px] min-h-[308px]"
        onClick={handleModalClick}
      >
        {/* Close Button */}
        <button
          className={`absolute top-4 right-4 text-white hover:text-gray-300 transition-colors rounded-full bg-[#383838] w-[30px] h-[30px] justify-center items-center flex ${
            isConnecting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleCloseModal}
          disabled={isConnecting}
        >
          <MdClose size={20} />
        </button>

        {/* Title */}
        <h2 className="text-white text-lg font-semibold mt-0.5 mb-2 text-center">
          {isConnecting ? "Connecting..." : "Connect wallet"}
        </h2>

        {/* Subtitle */}
        <p className="font-medium text-[14px] text-white mt-2 mb-[32px] text-center justify-center opacity-60">
          {isConnecting
            ? "Please approve the connection in your wallet"
            : "Authenticate using your preferred Stellar wallet to access dApp features"}
        </p>

        {/* Connection Error */}
        {(connectionError || walletError) && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center">
              {connectionError || walletError}
            </p>
          </div>
        )}

        {/* Connect Button */}
        <div className="flex flex-col gap-4 mb-4">
          <button
            onClick={handleConnectClick}
            disabled={isConnecting}
            className={`w-full py-4 bg-highlight hover:bg-highlight/80 text-background rounded-[16px] font-semibold transition-all duration-200 ${
              isConnecting ? "opacity-50 cursor-not-allowed animate-pulse" : ""
            }`}
          >
            {isConnecting ? "Waiting for Wallet..." : "Select Stellar Wallet"}
          </button>
        </div>

        {/* Loading indicator */}
        {isConnecting && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {/* Terms */}
        <p className="text-[#FFFFFF99] font-[400] text-center text-sm mt-4">
          By continuing, you agree to our{" "}
          <a href="#" className="text-white underline underline-offset-1">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-white underline underline-offset-1">
            Privacy policy
          </a>
        </p>
      </div>
    </div>
  );
}
