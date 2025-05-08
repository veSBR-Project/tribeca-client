import { create } from "zustand";

interface RedeemerStats {
  admin: string;
  pendingAdmin: string;
  treasury: string;
  redemptionRate: number;
  isActive: boolean;
  amount: number;
}

interface RedeemerStore {
  redeemerStats: RedeemerStats | null;
  setRedeemerStats: (stats: RedeemerStats) => void;
  clearRedeemerStats: () => void;
}

export const useRedeemerStore = create<RedeemerStore>((set) => ({
  redeemerStats: null,
  setRedeemerStats: (stats) => set({ redeemerStats: stats }),
  clearRedeemerStats: () => set({ redeemerStats: null }),
}));
