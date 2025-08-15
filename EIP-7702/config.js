import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const RELAY_PRIVATE_KEY = process.env.RELAY_PRIVATE_KEY;
if (!RELAY_PRIVATE_KEY) {
  console.error(new Error("Invalid relay private key"));
  process.exit(1);
}

export const relay = privateKeyToAccount(RELAY_PRIVATE_KEY)

export const walletClient = createWalletClient({
  account: relay,
  chain: sepolia,
  transport: http(),
})