import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";

interface TokenState {
  lockedTokens: {
    amount: number;
    escrow: PublicKey | null;
    isBlacklisted: boolean;
  };
  votingPower: number;
  setLockedTokens: (
    amount: number,
    escrow: PublicKey,
    isBlacklisted: boolean
  ) => void;
  setVotingPower: (power: number) => void;
  clearTokens: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  lockedTokens: {
    amount: 0,
    escrow: null,
    isBlacklisted: false,
  },
  votingPower: 0,
  setLockedTokens: (amount, escrow, isBlacklisted) =>
    set({
      lockedTokens: {
        amount,
        escrow,
        isBlacklisted,
      },
    }),
  setVotingPower: (power) => set({ votingPower: power }),
  clearTokens: () =>
    set({
      lockedTokens: {
        amount: 0,
        escrow: null,
        isBlacklisted: false,
      },
      votingPower: 0,
    }),
}));
