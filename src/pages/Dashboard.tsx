import { useEffect } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSDKStore } from "../store/sdkStore";
import { useTokenStore } from "../store/tokenStore";
import { useUIStore } from "../store/uiStore";
import { Link } from "react-router-dom";
import { LOCKER_PDA, SBR_DECIMALS } from "../utils/constants";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

interface EscrowAccount {
  locker: PublicKey;
  owner: PublicKey;
  bump: number;
  tokens: PublicKey;
  amount: BN;
  escrowStartedAt: BN;
  escrowEndsAt: BN;
  voteDelegate: PublicKey;
}

export const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const { sdk } = useSDKStore();
  const { lockedTokens, votingPower, setVotingPower, setLockedTokens } =
    useTokenStore();
  const { isLoading, error, setLoading, setError } = useUIStore();

  useEffect(() => {
    const fetchVotingPower = async () => {
      try {
        if (!publicKey || !sdk) return;

        // Find escrow PDA
        const [escrowPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("Escrow"),
            new PublicKey(LOCKER_PDA).toBuffer(),
            publicKey.toBuffer(),
          ],
          sdk.tribecaProgram.programId
        );

        setLoading(true);
        const power = await sdk.getVotingPower(
          escrowPDA,
          new PublicKey(LOCKER_PDA)
        );

        setVotingPower(power);

        //fetch locked tokens from escrow account
        const escrowAccount = (await sdk.tribecaProgram.account.escrow.fetch(
          escrowPDA
        )) as unknown as EscrowAccount;
        console.log("escrowAccount", escrowAccount);
        console.log("escrowAccount amount:", escrowAccount.amount.toNumber());
        console.log("escrowAccount locker:", escrowAccount.locker.toString());
        console.log("escrowAccount owner:", escrowAccount.owner.toString());

        if (!escrowAccount) {
          setError("No escrow account found");
          return;
        }

        const amount = escrowAccount.amount.toNumber();
        console.log("Setting locked tokens with amount:", amount);
        setLockedTokens(amount, new PublicKey(LOCKER_PDA), publicKey);
      } catch (err) {
        console.error("Error fetching escrow:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch voting power"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVotingPower();
  }, [publicKey, sdk]);

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
            {error}
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
        {lockedTokens.escrow && lockedTokens.locker && (
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
