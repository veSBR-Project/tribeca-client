import { useEffect, useState } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSDKStore } from "../store/sdkStore";
import { useUIStore } from "../store/uiStore";
import { LOCKER_PDA, SBR_MINT, SBR_DECIMALS } from "../utils/constants";
import { getSPLBalance, getOrCreateATA } from "../utils/helpers";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { toast } from "react-toastify";

export const Lock: FC = () => {
  const { wallet } = useWallet();
  const { sdk } = useSDKStore();
  const { isLoading, setLoading } = useUIStore();
  const [amount, setAmount] = useState("");
  const [minStakeDuration, setMinStakeDuration] = useState(0);
  const [maxStakeDuration, setMaxStakeDuration] = useState(0);
  const [duration, setDuration] = useState("");
  const [sbrBalance, setSbrBalance] = useState(0);

  const fetchLocker = async () => {
    if (!sdk?.tribecaProgram) return;

    const locker: any = await sdk?.tribecaProgram.account.locker.fetch(
      LOCKER_PDA
    );

    if (!locker) return;

    setMinStakeDuration(locker?.params.minStakeDuration);
    setMaxStakeDuration(locker?.params.maxStakeDuration);
  };

  const fetchUserEscrowAccount = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;

      // Find escrow PDA
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("Escrow"),
          new PublicKey(LOCKER_PDA).toBuffer(),
          wallet.adapter.publicKey.toBuffer(),
        ],
        sdk?.tribecaProgram.programId
      );

      const escrow = await sdk?.tribecaProgram.account.escrow.fetch(escrowPDA);

      console.log("escrow does exist", escrow);

      return escrowPDA;
    } catch {
      return null;
    }
  };

  const fetchSPLBalance = async () => {
    if (!wallet?.adapter.publicKey) return;

    const balance = await getSPLBalance(wallet, new PublicKey(SBR_MINT));
    setSbrBalance(Number(balance));
  };

  const handleLock = async () => {
    try {
      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);

      if (!wallet?.adapter.publicKey || !sdk) return;

      if (amount === "" || duration === "") {
        toast.error("Please enter an amount and duration");
        return;
      }

      if (Number(amount) <= 0 || Number(duration) <= 0) {
        toast.error("Amount and duration must be greater than 0");
        return;
      }

      if (Number(amount) > sbrBalance) {
        toast.error("Insufficient balance");
        return;
      }

      const amountToLock = Number(amount) * 10 ** SBR_DECIMALS;
      const durationInSeconds = Number(duration) * 24 * 60 * 60;

      if (
        Number(durationInSeconds) < minStakeDuration ||
        Number(durationInSeconds) > maxStakeDuration
      ) {
        toast.error(
          `Lock duration must be between ${
            minStakeDuration / (24 * 60 * 60)
          } and ${maxStakeDuration / (24 * 60 * 60)} days`
        );
        return;
      }

      if (amountToLock > sbrBalance) {
        toast.error("Insufficient balance");
        return;
      }

      let escrow: PublicKey | null | undefined = await fetchUserEscrowAccount();

      const transaction = new Transaction();
      const ataTransaction = new Transaction();

      if (!escrow) {
        const { createEscrowInstruction, escrowPDA } =
          await sdk.createNewEscrow(
            wallet.adapter.publicKey,
            new PublicKey(LOCKER_PDA),
            wallet.adapter.publicKey
          );

        escrow = escrowPDA;
        ataTransaction.add(createEscrowInstruction);
      }

      if (!escrow) {
        toast.error("Escrow PDA is not initialized, please try again.");
        return;
      }

      const {
        instruction: sourceTokenAccountInstruction,
        address: sourceTokenAccount,
      } = await getOrCreateATA(
        connection,
        new PublicKey(SBR_MINT),
        wallet.adapter.publicKey,
        wallet.adapter.publicKey
      );

      const {
        instruction: escrowTokenAccountInstruction,
        address: escrowTokenAccount,
      } = await getOrCreateATA(
        connection,
        new PublicKey(SBR_MINT),
        escrow,
        wallet.adapter.publicKey,
        true
      );

      if (sourceTokenAccountInstruction) {
        ataTransaction.add(sourceTokenAccountInstruction);
      }

      if (escrowTokenAccountInstruction) {
        ataTransaction.add(escrowTokenAccountInstruction);
      }

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

      const { lockTokensInstruction } = await sdk.lockTokens(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        escrow,
        escrowTokenAccount,
        sourceTokenAccount,
        new BN(amountToLock),
        new BN(durationInSeconds)
      );

      transaction.add(lockTokensInstruction);
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
          // reduce sbr balance
          setSbrBalance(sbrBalance - amountToLock);
        });

      console.log("tx", tx);
      toast.success("Tokens locked successfully!");
    } catch (err) {
      console.log("err", err);
      toast.error(err instanceof Error ? err.message : "Failed to lock tokens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocker();
  }, [sdk?.tribecaProgram]);

  useEffect(() => {
    fetchSPLBalance();
  }, [wallet?.adapter.publicKey]);

  if (!wallet?.adapter.publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Lock Tokens
          </h1>
          <p className="text-xl text-[#8E8E93]">
            Please connect your wallet to lock tokens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">
          Lock Tokens
        </h1>
        <div className="card">
          <div className="space-y-8">
            <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4 mb-4">
              <p className="text-[#8E8E93] text-sm">Available Balance</p>
              <p className="text-white text-2xl font-medium">
                {Number(sbrBalance / 10 ** SBR_DECIMALS).toLocaleString()} SBR
              </p>
            </div>
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Amount to Lock
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Lock Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="Enter duration"
              />
              <p className="mt-2 text-sm text-[#8E8E93]">
                Lock duration must be between{" "}
                {minStakeDuration / (24 * 60 * 60)} and{" "}
                {maxStakeDuration / (24 * 60 * 60)} days
              </p>
            </div>
            <button
              onClick={handleLock}
              disabled={isLoading || !amount || !duration}
              className={`w-full py-4 rounded-xl text-white font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                isLoading || !amount || !duration
                  ? "bg-[#38383A] cursor-not-allowed"
                  : "bg-[#007AFF] hover:bg-[#0066CC]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Locking...
                </div>
              ) : (
                "Lock Tokens"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
