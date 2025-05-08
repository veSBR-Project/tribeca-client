import { useEffect, useState } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSDKStore } from "../store/sdkStore";
import { useUIStore } from "../store/uiStore";
import { useTokenStore } from "../store/tokenStore";
import { LOCKER_PDA, SBR_MINT, SBR_DECIMALS } from "../utils/constants";
import { getOrCreateATA } from "../utils/helpers";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { toast } from "react-toastify";

export const Unlock: FC = () => {
  const { wallet } = useWallet();
  const { sdk } = useSDKStore();
  const { isLoading, setLoading } = useUIStore();
  const { lockedTokens } = useTokenStore();
  const [redeemerPDA, setRedeemerPDA] = useState<PublicKey | null>(null);
  const [receiptMint, setReceiptMint] = useState<PublicKey | null>(null);

  const fetchRedeemer = async () => {
    if (!sdk?.tribecaProgram || !lockedTokens.locker) return;

    try {
      // Find redeemer PDA
      const [redeemerPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("Redeemer"),
          lockedTokens.locker.toBuffer(),
          new PublicKey(SBR_MINT).toBuffer(),
        ],
        sdk.tribecaProgram.programId
      );

      setRedeemerPDA(redeemerPDA);
      setReceiptMint(new PublicKey(SBR_MINT));
    } catch (err) {
      console.error("Error fetching redeemer:", err);
      toast.error("Failed to fetch redeemer information");
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);

      if (
        !wallet?.adapter.publicKey ||
        !sdk ||
        !lockedTokens.escrow ||
        !lockedTokens.locker ||
        !redeemerPDA ||
        !receiptMint
      ) {
        toast.error("Missing required information");
        return;
      }

      const transaction = new Transaction();
      const ataTransaction = new Transaction();

      // Get or create token accounts
      const {
        instruction: escrowTokenAccountInstruction,
        address: escrowTokenAccount,
      } = await getOrCreateATA(
        connection,
        receiptMint,
        lockedTokens.escrow,
        wallet.adapter.publicKey,
        true
      );

      const { instruction: userReceiptInstruction, address: userReceipt } =
        await getOrCreateATA(
          connection,
          receiptMint,
          wallet.adapter.publicKey,
          wallet.adapter.publicKey
        );

      const {
        instruction: redeemerReceiptInstruction,
        address: redeemerReceiptAccount,
      } = await getOrCreateATA(
        connection,
        receiptMint,
        redeemerPDA,
        wallet.adapter.publicKey,
        true
      );

      const {
        instruction: treasuryTokenInstruction,
        address: treasuryTokenAccount,
      } = await getOrCreateATA(
        connection,
        receiptMint,
        redeemerPDA,
        wallet.adapter.publicKey,
        true
      );

      // Add ATA creation instructions if needed
      if (escrowTokenAccountInstruction)
        ataTransaction.add(escrowTokenAccountInstruction);
      if (userReceiptInstruction) ataTransaction.add(userReceiptInstruction);
      if (redeemerReceiptInstruction)
        ataTransaction.add(redeemerReceiptInstruction);
      if (treasuryTokenInstruction)
        ataTransaction.add(treasuryTokenInstruction);

      if (ataTransaction.instructions.length > 0) {
        ataTransaction.feePayer = wallet.adapter.publicKey;
        ataTransaction.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;

        const ataTx = await wallet.adapter.sendTransaction(
          ataTransaction,
          connection
        );
        await connection.confirmTransaction({
          signature: ataTx,
          blockhash: ataTransaction.recentBlockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        });
      }

      // Create instant withdraw instruction
      const { instantWithdrawInstruction } = await sdk.instantWithdraw(
        wallet.adapter.publicKey,
        lockedTokens.locker,
        redeemerPDA,
        receiptMint,
        redeemerReceiptAccount,
        lockedTokens.escrow,
        escrowTokenAccount,
        treasuryTokenAccount,
        userReceipt
      );

      transaction.add(instantWithdrawInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // Sign and send the transaction
      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature: tx,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: (
          await connection.getLatestBlockhash()
        ).lastValidBlockHeight,
      });

      toast.success("Tokens unlocked successfully!");
    } catch (err) {
      console.error("Error unlocking tokens:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to unlock tokens"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedeemer();
  }, [sdk?.tribecaProgram, lockedTokens.locker]);

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

  if (!lockedTokens.escrow || !lockedTokens.locker) {
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
            <button
              onClick={handleUnlock}
              disabled={isLoading || !redeemerPDA}
              className={`w-full py-4 rounded-xl text-white font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                isLoading || !redeemerPDA
                  ? "bg-[#38383A] cursor-not-allowed"
                  : "bg-[#007AFF] hover:bg-[#0066CC]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Unlocking...
                </div>
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
