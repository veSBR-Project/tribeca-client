import type { FC } from "react";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSDKStore } from "../store/sdkStore";
import { useUIStore } from "../store/uiStore";
import { useTokenStore } from "../store/tokenStore";
import {
  SBR_MINT,
  SBR_DECIMALS,
  USDC_MINT,
  REDEEMER_PDA,
  LOCKER_PDA,
} from "../utils/constants";
import { calculateRedeemableAmount, getOrCreateATA } from "../utils/helpers";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { toast } from "react-toastify";
import { useRedeemerStore } from "../store/redeemerStore";

export const Redeem: FC = () => {
  const { wallet } = useWallet();
  const { sdk } = useSDKStore();
  const { isLoading, setLoading } = useUIStore();
  const { redeemerStats } = useRedeemerStore();
  const { lockedTokens, votingPower, setLockedTokens, setVotingPower } =
    useTokenStore();

  useEffect(() => {
    console.log("lockedTokens", lockedTokens.escrow?.toBase58());
  }, [lockedTokens]);

  const handleUnlock = async () => {
    try {
      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);

      if (
        !wallet?.adapter.publicKey ||
        !sdk ||
        !lockedTokens.escrow ||
        !redeemerStats
      ) {
        toast.error("Missing required information");
        return;
      }

      const transaction = new Transaction();
      const ataTransaction = new Transaction();

      // the user's escrow token account SBR is being withdrawn from
      const {
        instruction: escrowTokenAccountInstruction,
        address: escrowTokenAccount,
      } = await getOrCreateATA(
        connection,
        new PublicKey(SBR_MINT),
        lockedTokens.escrow,
        wallet.adapter.publicKey,
        true
      );

      // the redeemer's token account USDC is being withdrawn from
      const {
        instruction: redeemerReceiptInstruction,
        address: redeemerReceiptAccount,
      } = await getOrCreateATA(
        connection,
        new PublicKey(USDC_MINT),
        new PublicKey(REDEEMER_PDA),
        wallet.adapter.publicKey,
        true
      );

      // // the token account SBR is being deposited into
      // const {
      //   instruction: treasuryTokenInstruction,
      //   address: treasuryTokenAccount,
      // } = await getOrCreateATA(
      //   connection,
      //   new PublicKey(SBR_MINT),
      //   new PublicKey(redeemerStats?.treasury),
      //   wallet.adapter.publicKey
      //   // true
      // );

      // console.log("treasuryTokenAccount", treasuryTokenAccount.toBase58());

      // the user's token account USDC is being received with
      const { instruction: userReceiptInstruction, address: userReceipt } =
        await getOrCreateATA(
          connection,
          new PublicKey(USDC_MINT),
          wallet.adapter.publicKey,
          wallet.adapter.publicKey
        );

      // Add ATA creation instructions if needed
      if (escrowTokenAccountInstruction) {
        ataTransaction.add(escrowTokenAccountInstruction);
      }

      if (userReceiptInstruction) {
        ataTransaction.add(userReceiptInstruction);
      }

      if (redeemerReceiptInstruction) {
        ataTransaction.add(redeemerReceiptInstruction);
      }

      // if (treasuryTokenInstruction) {
      //   ataTransaction.add(treasuryTokenInstruction);
      // }

      if (ataTransaction.instructions.length > 0) {
        ataTransaction.feePayer = wallet.adapter.publicKey;
        ataTransaction.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;

        const ataTx = await wallet.adapter.sendTransaction(
          ataTransaction,
          connection
        );

        await connection
          .confirmTransaction({
            signature: ataTx,
            blockhash: ataTransaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          })
          .then(() => {
            console.log("ATA transaction confirmed");
          })
          .catch((err) => {
            console.error("Error confirming ATA transaction:", err);
          });
      }

      // Create instant withdraw instruction
      const { instantWithdrawInstruction } = await sdk.instantWithdraw(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA),
        new PublicKey(USDC_MINT),
        redeemerReceiptAccount,
        lockedTokens.escrow,
        escrowTokenAccount,
        new PublicKey(redeemerStats?.treasury),
        userReceipt
      );

      transaction.add(instantWithdrawInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // Sign and send the transaction
      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction({
          signature: tx,
          blockhash: transaction.recentBlockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        })
        .then(() => {
          if (lockedTokens?.escrow) {
            setLockedTokens(
              0,
              lockedTokens?.escrow,
              lockedTokens?.isBlacklisted
            );
            setVotingPower(0);
          }
        })
        .catch((err) => {
          console.error("Error unlocking tokens:", err);
          toast.error(
            err instanceof Error ? err.message : "Failed to unlock tokens"
          );
        });
    } catch (err) {
      console.error("Error unlocking tokens:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to unlock tokens"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!wallet?.adapter.publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Unlock Tokens
          </h1>
          <p className="text-xl text-[#8E8E93]">
            Please connect your wallet to unlock tokens
          </p>
        </div>
      </div>
    );
  }

  if (!lockedTokens.escrow) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Unlock Tokens
          </h1>
          <p className="text-xl text-[#8E8E93]">
            You don't have any locked tokens to unlock
          </p>
        </div>
      </div>
    );
  }

  if (lockedTokens.isBlacklisted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Unlock Tokens
          </h1>
          <p className="text-xl text-[#8E8E93]">
            You are not allowed to redeem tokens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">
          Unlock Tokens
        </h1>
        <div className="card">
          <div className="space-y-8">
            <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4 mb-4">
              <p className="text-[#8E8E93] text-sm">Locked Amount</p>
              <p className="text-white text-2xl font-medium">
                {Number(
                  lockedTokens.amount / 10 ** SBR_DECIMALS
                ).toLocaleString()}{" "}
                SBR
              </p>
            </div>
            <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4 mb-4">
              <p className="text-[#8E8E93] text-sm">Voting Power</p>
              <p className="text-white text-2xl font-medium">
                {votingPower.toLocaleString()} veSBR
              </p>
            </div>
            {redeemerStats && (
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4 mb-4">
                <p className="text-[#8E8E93] text-sm">USDC Amount</p>
                <p className="text-white text-2xl font-medium">
                  {calculateRedeemableAmount(
                    votingPower,
                    redeemerStats.redemptionRate
                  ).toLocaleString()}{" "}
                  USDC
                </p>
                <p className="text-[#8E8E93] text-sm mt-1">
                  Rate: {redeemerStats.redemptionRate.toLocaleString()} veSBR =
                  1 USDC
                </p>
              </div>
            )}
            <button
              onClick={handleUnlock}
              disabled={isLoading || !REDEEMER_PDA || !redeemerStats?.isActive}
              className={`w-full py-4 rounded-xl text-white font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                isLoading || !REDEEMER_PDA || !redeemerStats?.isActive
                  ? "bg-[#38383A] cursor-not-allowed"
                  : "bg-[#007AFF] hover:bg-[#0066CC]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Unlocking...
                </div>
              ) : !redeemerStats?.isActive ? (
                "Redemption Paused"
              ) : (
                "Unlock Tokens"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
