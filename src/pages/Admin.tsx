import { useState } from "react";
import type { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSDKStore } from "../store/sdkStore";
import { useUIStore } from "../store/uiStore";
import { useRedeemerStore } from "../store/redeemerStore";
import {
  LOCKER_PDA,
  REDEEMER_PDA,
  USDC_DECIMALS,
  USDC_MINT,
} from "../utils/constants";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import { getOrCreateATA } from "../utils/helpers";

export const Admin: FC = () => {
  const { wallet } = useWallet();
  const { sdk } = useSDKStore();
  const { isLoading, setLoading } = useUIStore();
  const { redeemerStats, setRedeemerStats } = useRedeemerStore();

  // Form states
  const [newTreasuryAddress, setNewTreasuryAddress] = useState("");
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [redemptionRate, setRedemptionRate] = useState("");
  const [escrowAddress, setEscrowAddress] = useState("");
  const [toggleStatus, setToggleStatus] = useState<0 | 1>(1);
  const [fundAmount, setFundAmount] = useState("");

  // Update the treasury address for the redeemer
  const handleUpdateTreasury = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!newTreasuryAddress) {
        showErrorToast("Please fill in all fields");
        return;
      }

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { updateTreasuryInstruction } = await sdk.updateTreasury(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA),
        new PublicKey(newTreasuryAddress)
      );

      const transaction = new Transaction();
      transaction.add(updateTreasuryInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        {
          signature: tx,
          blockhash: transaction.recentBlockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );
      showSuccessToast("Treasury updated successfully");
    } catch (error) {
      console.error("Error updating treasury:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to update treasury"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update the redemption rate for the redeemer
  const handleUpdateRedemptionRate = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!redemptionRate) {
        showErrorToast("Please fill in all fields");
        return;
      }

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { updateRedemptionRateInstruction } =
        await sdk.updateRedemptionRate(
          wallet.adapter.publicKey,
          new PublicKey(LOCKER_PDA),
          new PublicKey(REDEEMER_PDA),
          new BN(redemptionRate)
        );

      const transaction = new Transaction();
      transaction.add(updateRedemptionRateInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Redemption rate updated successfully");
        });
    } catch (error) {
      console.error("Error updating redemption rate:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to update redemption rate"
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle the redeemer status 0 = paused, 1 = active
  const handleToggleRedeemer = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { toggleRedeemerInstruction } = await sdk.toggleRedeemer(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA),
        toggleStatus
      );

      const transaction = new Transaction();
      transaction.add(toggleRedeemerInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast(
            `Redeemer ${
              toggleStatus === 1 ? "activated" : "paused"
            } successfully`
          );
        });
    } catch (error) {
      console.error("Error toggling redeemer:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to toggle redeemer"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a blacklist entry for the redeemer
  const handleAddBlacklistEntry = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!escrowAddress) {
        showErrorToast("Please fill in all fields");
        return;
      }

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { addBlacklistEntryInstruction } = await sdk.addBlacklistEntry(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(escrowAddress),
        new PublicKey(REDEEMER_PDA)
      );

      const transaction = new Transaction();
      transaction.add(addBlacklistEntryInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Blacklist entry added successfully");
        });
    } catch (error) {
      console.error("Error adding blacklist entry:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to add blacklist entry"
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove a blacklist entry for the redeemer
  const handleRemoveBlacklistEntry = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!escrowAddress) {
        showErrorToast("Please fill in all fields");
        return;
      }

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { removeBlacklistEntryInstruction } =
        await sdk.removeBlacklistEntry(
          wallet.adapter.publicKey,
          new PublicKey(LOCKER_PDA),
          new PublicKey(escrowAddress),
          new PublicKey(REDEEMER_PDA)
        );

      const transaction = new Transaction();
      transaction.add(removeBlacklistEntryInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Blacklist entry removed successfully");
        });
    } catch (error) {
      console.error("Error removing blacklist entry:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to remove blacklist entry"
      );
    } finally {
      setLoading(false);
    }
  };

  // Update the redeemer admin address
  const handleUpdateRedeemerAdmin = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!newAdminAddress) {
        showErrorToast("Please fill in all fields");
        return;
      }

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { updateRedeemerAdminInstruction } = await sdk.updateRedeemerAdmin(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA),
        new PublicKey(newAdminAddress)
      );

      const transaction = new Transaction();
      transaction.add(updateRedeemerAdminInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Redeemer admin updated successfully");
        });
    } catch (error) {
      console.error("Error updating redeemer admin:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to update redeemer admin"
      );
    } finally {
      setLoading(false);
    }
  };

  // Accept the redeemer admin address
  const handleAcceptRedeemerAdmin = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;

      setLoading(true);
      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const { acceptRedeemerAdminInstruction } = await sdk.acceptRedeemerAdmin(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA)
      );

      const transaction = new Transaction();
      transaction.add(acceptRedeemerAdminInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Redeemer admin accepted successfully");
        });
    } catch (error) {
      console.error("Error accepting redeemer admin:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Failed to accept redeemer admin"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add funds to the redeemer
  const handleAddFunds = async () => {
    try {
      if (!wallet?.adapter.publicKey || !sdk) return;
      if (!fundAmount) {
        showErrorToast("Please fill in all fields");
        return;
      }

      const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
      const transaction = new Transaction();

      const {
        address: redeemerReceiptAccount,
        instruction: redeemerReceiptInstruction,
      } = await getOrCreateATA(
        connection,
        new PublicKey(USDC_MINT),
        new PublicKey(REDEEMER_PDA),
        wallet.adapter.publicKey,
        true
      );

      if (redeemerReceiptInstruction) {
        transaction.add(redeemerReceiptInstruction);
      }

      const { address: sourceTokenAccount } = await getOrCreateATA(
        connection,
        new PublicKey(USDC_MINT),
        wallet.adapter.publicKey,
        wallet.adapter.publicKey
      );

      setLoading(true);
      const { addFundsInstruction } = await sdk.addFunds(
        wallet.adapter.publicKey,
        new PublicKey(LOCKER_PDA),
        new PublicKey(REDEEMER_PDA),
        new PublicKey(redeemerReceiptAccount),
        new PublicKey(sourceTokenAccount),
        new BN(Number(fundAmount) * 10 ** USDC_DECIMALS)
      );

      transaction.add(addFundsInstruction);
      transaction.feePayer = wallet.adapter.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const tx = await wallet.adapter.sendTransaction(transaction, connection);
      await connection
        .confirmTransaction(
          {
            signature: tx,
            blockhash: transaction.recentBlockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        )
        .then(() => {
          showSuccessToast("Funds added successfully");
          // update the funds amount in the store
          if (redeemerStats) {
            const newAmount = Number(
              Number(redeemerStats.amount) + Number(fundAmount)
            );

            setRedeemerStats({
              ...redeemerStats,
              amount: newAmount,
            });
          }
        });
    } catch (error) {
      console.error("Error adding funds:", error);
      showErrorToast(
        error instanceof Error ? error.message : "Failed to add funds"
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
            Admin Panel
          </h1>
          <p className="text-xl text-[#8E8E93]">
            Please connect your wallet to access the admin panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] to-[#1C1C1E] pt-24 px-8">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl font-bold text-white mb-12 tracking-tight">
          Admin Panel
        </h1>

        {/* Stats Section */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Redeemer Stats
          </h2>
          {redeemerStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Admin</p>
                <p className="text-white text-lg font-medium break-all">
                  {redeemerStats.admin}
                </p>
              </div>
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Pending Admin</p>
                <p className="text-white text-lg font-medium break-all">
                  {redeemerStats.pendingAdmin}
                </p>
              </div>
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Treasury</p>
                <p className="text-white text-lg font-medium break-all">
                  {redeemerStats.treasury}
                </p>
              </div>
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Redemption Rate</p>
                <p className="text-white text-lg font-medium">
                  {redeemerStats.redemptionRate.toLocaleString()} veSBR = 1 USDC
                </p>
              </div>
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Status</p>
                <p className="text-white text-lg font-medium">
                  {redeemerStats.isActive ? (
                    <span className="text-[#34C759]">Active</span>
                  ) : (
                    <span className="text-[#FF3B30]">Paused</span>
                  )}
                </p>
              </div>
              <div className="bg-[#1C1C1E] border border-[#38383A] rounded-xl p-4">
                <p className="text-[#8E8E93] text-sm">Total Amount</p>
                <p className="text-white text-lg font-medium">
                  {redeemerStats.amount.toLocaleString()} USDC
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-[#8E8E93]">Loading redeemer stats...</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Update Treasury */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Update Treasury
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newTreasuryAddress}
                onChange={(e) => setNewTreasuryAddress(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="New Treasury Address"
              />
              <button
                onClick={handleUpdateTreasury}
                disabled={isLoading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating..." : "Update Treasury"}
              </button>
            </div>
          </div>

          {/* Update Redemption Rate */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Update Redemption Rate
              <br />
              <span className="text-[#8E8E93] text-sm">
                i.e 1000 for 1000 veSBR = 1 USDC
              </span>
            </h2>
            <div className="space-y-4">
              <input
                type="number"
                value={redemptionRate}
                onChange={(e) => setRedemptionRate(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="New Redemption Rate"
              />
              <button
                onClick={handleUpdateRedemptionRate}
                disabled={isLoading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating..." : "Update Redemption Rate"}
              </button>
            </div>
          </div>

          {/* Toggle Redeemer */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Toggle Redeemer
            </h2>
            <div className="space-y-4">
              <select
                value={toggleStatus}
                onChange={(e) =>
                  setToggleStatus(Number(e.target.value) as 0 | 1)
                }
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
              >
                <option value={1}>Active</option>
                <option value={0}>Paused</option>
              </select>
              <button
                onClick={handleToggleRedeemer}
                disabled={isLoading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Toggling..." : "Toggle Redeemer"}
              </button>
            </div>
          </div>

          {/* Blacklist Management */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Blacklist Management
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={escrowAddress}
                onChange={(e) => setEscrowAddress(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="Escrow Address"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleAddBlacklistEntry}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Adding..." : "Add to Blacklist"}
                </button>
                <button
                  onClick={handleRemoveBlacklistEntry}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-[#FF3B30] hover:bg-[#FF2D55] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Removing..." : "Remove from Blacklist"}
                </button>
              </div>
            </div>
          </div>

          {/* Admin Management */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Admin Management
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="New Admin Address"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdateRedeemerAdmin}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Admin"}
                </button>
                <button
                  onClick={handleAcceptRedeemerAdmin}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-[#34C759] hover:bg-[#30B350] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Accepting..." : "Accept Admin"}
                </button>
              </div>
            </div>
          </div>

          {/* Fund Redeemer */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Fund Redeemer
            </h2>
            <div className="space-y-4">
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl text-white focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-300"
                placeholder="Amount to Fund"
              />
              <button
                onClick={handleAddFunds}
                disabled={isLoading}
                className="w-full py-4 bg-[#007AFF] hover:bg-[#0066CC] text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Adding Funds..." : "Add Funds"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
