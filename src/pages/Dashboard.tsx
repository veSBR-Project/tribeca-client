import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenStore } from "../store/tokenStore";
import { useUIStore } from "../store/uiStore";
import { Link } from "react-router-dom";
import { SBR_DECIMALS } from "../utils/constants";

export const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const { lockedTokens, votingPower } = useTokenStore();
  const { isLoading, error } = useUIStore();

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xl text-[#8E8E93]">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">
          Dashboard
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="bg-[#FF3B30]/10 border border-[#FF3B30] rounded-xl p-6 text-[#FF3B30] animate-scale-in">
            {error === "No escrow account found"
              ? "You do not have any locked tokens"
              : error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card hover:shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Locked Tokens
              </h2>
              <p className="text-4xl font-bold text-[#007AFF] mb-2">
                {Number(
                  lockedTokens.amount / 10 ** SBR_DECIMALS
                ).toLocaleString()}
              </p>
              <p className="text-[#8E8E93]">tokens locked</p>
            </div>
            <div className="card hover:shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Voting Power
              </h2>
              <p className="text-4xl font-bold text-[#007AFF] mb-2">
                {votingPower.toLocaleString()}
              </p>
              <p className="text-[#8E8E93]">voting power</p>
            </div>
          </div>
        )}

        {lockedTokens.escrow &&
          !lockedTokens.isBlacklisted &&
          lockedTokens.amount !== 0 && (
            <div className="mt-8 flex justify-center">
              <Link
                to="/unlock"
                className="px-8 py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                Unlock Tokens
              </Link>
            </div>
          )}
      </div>
    </div>
  );
};
