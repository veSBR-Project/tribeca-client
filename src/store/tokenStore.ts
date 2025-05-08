import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";

interface TokenState {
  lockedTokens: {
    amount: number;
    escrow: PublicKey | null;
    locker: PublicKey | null;
  };
  votingPower: number;
  setLockedTokens: (
    amount: number,
    escrow: PublicKey,
    locker: PublicKey
  ) => void;
  setVotingPower: (power: number) => void;
  clearTokens: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  lockedTokens: {
    amount: 0,
    escrow: null,
    locker: null,
  },
  votingPower: 0,
  setLockedTokens: (amount, escrow, locker) =>
    set({
      lockedTokens: {
        amount,
        escrow,
        locker,
      },
    }),
  setVotingPower: (power) => set({ votingPower: power }),
  clearTokens: () =>
    set({
      lockedTokens: {
        amount: 0,
        escrow: null,
        locker: null,
      },
      votingPower: 0,
    }),
}));
