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
} from "../utils/constants";

export const WalletConnectButton = () => {
  const { wallet } = useWallet();
  const { sdk, setSDK } = useSDKStore();

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
      console.log("wallet", wallet?.adapter.connected);

      if (wallet?.adapter.connected) {
        console.log("wallet connected");
        await handleUpdateSDK();
        console.log(sdk);
      }
    };

    initSDK();
  }, [wallet?.adapter.publicKey]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {wallet && <span style={{ color: "white" }}>{wallet.adapter.name}</span>}
      <WalletMultiButton />
    </div>
  );
};
