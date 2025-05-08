import { create } from "zustand";
import { TribecaSDK } from "../sdk/tribeca-sdk";

interface SDKState {
  sdk: TribecaSDK | null;
  setSDK: (sdk: TribecaSDK) => void;
  clearSDK: () => void;
}

export const useSDKStore = create<SDKState>((set) => ({
  sdk: null,
  setSDK: (sdk) => set({ sdk }),
  clearSDK: () => set({ sdk: null }),
}));
