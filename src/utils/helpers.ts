import { Program, AnchorProvider } from "@coral-xyz/anchor-0-29.0.0";
import type { Idl } from "@coral-xyz/anchor-0-29.0.0";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { Wallet } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

export const getProgram = (
  wallet: Wallet,
  idl: string,
  programId: string
): Program<Idl> => {
  try {
    if (!wallet.adapter.publicKey) throw new Error("Wallet not connected");

    const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);
    const provider = new AnchorProvider(
      connection,
      wallet as unknown as AnchorProvider["wallet"],
      AnchorProvider.defaultOptions()
    );

    const parsedIdl = JSON.parse(idl) as Idl;
    return new Program(parsedIdl, new PublicKey(programId), provider);
  } catch (error) {
    console.error("Error getting program", error);
    throw error;
  }
};

export const getSPLBalance = async (wallet: Wallet, tokenMint: PublicKey) => {
  try {
    if (!wallet.adapter.publicKey) throw new Error("Wallet not connected");

    const tokenAddress = getAssociatedTokenAddressSync(
      tokenMint,
      wallet.adapter.publicKey,
      false
    );

    console.log("tokenAddress", tokenAddress);

    if (!tokenAddress) return 0;

    const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL);

    const balance = await connection.getTokenAccountBalance(
      tokenAddress,
      "confirmed"
    );

    return balance.value.amount;
  } catch (error) {
    console.error("Error getting SPL balance", error);
    return 0;
  }
};

export const getOrCreateATA = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
  allowOffCurve: boolean = false
): Promise<{ address: PublicKey; instruction?: TransactionInstruction }> => {
  const ata = getAssociatedTokenAddressSync(mint, owner, allowOffCurve);

  try {
    // Check if the account exists
    await getAccount(connection, ata);
    return { address: ata };
  } catch {
    // Account doesn't exist, return the creation instruction
    const instruction = createAssociatedTokenAccountInstruction(
      payer,
      ata,
      owner,
      mint
    );
    return { address: ata, instruction };
  }
};
