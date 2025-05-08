import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSDKStore } from "../store/sdkStore";
import { useEffect } from "react";
import { TribecaSDK } from "../sdk/tribeca-sdk";
import locked_voter_idl from "../idl/locked_voter.json";
import goki_idl from "../idl/goki.json";
import govern_idl from "../idl/govern.json";
import { getProgram } from "../utils/helpers";
import {
  LOCKED_V_PROGRAM,
  GOKI_PROGRAM,
  GOVERNOR_PROGRAM,
  LOCKER_PDA,
  REDEEMER_PDA,
  USDC_DECIMALS,
} from "../utils/constants";
import { PublicKey } from "@solana/web3.js";
import { useUIStore } from "../store/uiStore";
import { useTokenStore } from "../store/tokenStore";
import { useRedeemerStore } from "../store/redeemerStore";
import { BN } from "@coral-xyz/anchor";

export const WalletConnectButton = () => {
  const { wallet, publicKey } = useWallet();
  const { sdk, setSDK } = useSDKStore();
  const { setLoading, setError } = useUIStore();
  const { setVotingPower, setLockedTokens } = useTokenStore();
  const { setRedeemerStats, clearRedeemerStats } = useRedeemerStore();

  const handleUpdateSDK = async () => {
    if (!wallet) return;

    setSDK(
      new TribecaSDK(
        getProgram(wallet, JSON.stringify(locked_voter_idl), LOCKED_V_PROGRAM),
        getProgram(wallet, JSON.stringify(goki_idl), GOKI_PROGRAM),
        getProgram(wallet, JSON.stringify(govern_idl), GOVERNOR_PROGRAM)
      )
    );
  };

  useEffect(() => {
    const initSDK = async () => {
      if (wallet?.adapter.connected) {
        await handleUpdateSDK();
      }
    };

    initSDK();
  }, [publicKey]);

  const fetchBlacklist = async (escrowPDA: PublicKey) => {
    if (!sdk?.tribecaProgram || !escrowPDA) return;

    const [blacklistPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("Blacklist"),
        new PublicKey(LOCKER_PDA).toBuffer(),
        new PublicKey(escrowPDA).toBuffer(),
      ],
      sdk?.tribecaProgram.programId
    );

    const blacklist = await sdk?.tribecaProgram.account.blacklist
      .fetch(blacklistPDA)
      .catch(() => {
        return false;
      });

    if (blacklist) return true;
  };

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

        //fetch locked tokens from escrow account
        const escrowAccount: any = await sdk.tribecaProgram.account.escrow
          .fetch(escrowPDA)
          .catch(() => {
            setError("No escrow account found");
            setLockedTokens(0, escrowPDA, false);
            setLoading(false);
            setVotingPower(0);
            return null;
          });

        if (!escrowAccount) return;

        const power = await sdk
          .getVotingPower(escrowPDA, new PublicKey(LOCKER_PDA))
          .catch(() => {
            setError("No escrow account found");
            return 0;
          });

        setVotingPower(power);

        const isBlacklisted = await fetchBlacklist(escrowPDA);
        const amount = escrowAccount.amount.toNumber();
        setLockedTokens(amount, escrowPDA, isBlacklisted || false);
      } catch (err) {
        console.error("Error fetching escrow:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch voting power"
        );
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the blockchain state is updated
    const timeoutId = setTimeout(() => {
      fetchVotingPower();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [publicKey, sdk]);

  useEffect(() => {
    const fetchRedeemerStats = async () => {
      try {
        if (!sdk?.tribecaProgram) {
          clearRedeemerStats();
          return;
        }

        const redeemerData =
          (await sdk.tribecaProgram.account.lockerRedeemer.fetch(
            REDEEMER_PDA
          )) as {
            admin: PublicKey;
            pendingAdmin: PublicKey;
            treasury: PublicKey;
            redemptionRate: BN;
            status: number;
            amount: BN;
          };

        setRedeemerStats({
          admin: redeemerData.admin.toBase58(),
          pendingAdmin: redeemerData.pendingAdmin.toBase58(),
          treasury: redeemerData.treasury.toBase58(),
          redemptionRate: redeemerData.redemptionRate.toNumber(),
          isActive: redeemerData.status === 1,
          amount: redeemerData.amount.toNumber() / 10 ** USDC_DECIMALS,
        });
      } catch (error) {
        console.error("Error fetching redeemer stats:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch redeemer stats"
        );
        clearRedeemerStats();
      }
    };

    fetchRedeemerStats();
  }, [sdk?.tribecaProgram]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {wallet && <span style={{ color: "white" }}>{wallet.adapter.name}</span>}
      <WalletMultiButton />
    </div>
  );
};
