import { ethers } from "ethers";
import 'dotenv/config';

const WEBSOCKET_PROVIDER_URL = process.env.WEBSOCKET_PROVIDER_URL;
if (!WEBSOCKET_PROVIDER_URL) {
  console.error(new Error("Invalid websocket provider url"));
  process.exit(1);
}

const INITIATOR_PRIVATE_KEY = process.env.INITIATOR_PRIVATE_KEY;
const INITIATOR_PUBLIC_KEY = process.env.INITIATOR_PUBLIC_KEY;
if (!INITIATOR_PRIVATE_KEY || !INITIATOR_PUBLIC_KEY) {
  console.error(new Error("Invalid transaction initiator"));
  process.exit(1);
}

const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_PROVIDER_URL);
const contractAddress = '0x3cc9abd7655E233F865FBdD40818226541231fFC';
const contractWithdrawSelector = '0x3ccfd60b';

provider.on("pending", txHash => {
  provider.getTransaction(txHash).then(async tx => {
    if (
      tx?.to?.toLowerCase() === contractAddress.toLowerCase()
      && tx?.from?.toLowerCase() !== INITIATOR_PUBLIC_KEY.toLowerCase()
      && tx?.data?.toLowerCase() === contractWithdrawSelector.toLowerCase()
    ) {
      console.log(tx);

      const contractBalance = await provider.getBalance(contractAddress);
      if (contractBalance > 0) {
        const wallet = new ethers.Wallet(INITIATOR_PRIVATE_KEY, provider);

        const response = await wallet.sendTransaction({
          to: contractAddress,
          data: tx?.data,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas.mul(5),
          maxFeePerGas: tx.maxFeePerGas.mul(5),
          gasLimit: ethers.utils.parseUnits("40", 4)
        });

        console.log("Response:", await response.wait());
      }
    }
    else {
      console.log("Transaction hash: ", txHash);
    }
  });
});