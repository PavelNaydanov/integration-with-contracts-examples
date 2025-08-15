import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { zeroAddress } from 'viem';
import 'dotenv/config';

import { walletClient, relay } from '../config.js'

const EOA_PRIVATE_KEY = process.env.EOA_PRIVATE_KEY;
if (!EOA_PRIVATE_KEY) {
  console.error(new Error("Invalid eoa private key"));
  process.exit(1);
}

const eoa = privateKeyToAccount(EOA_PRIVATE_KEY);

// EOA аккаунт подписывает данные для того, чтобы открепить код смарт-контракта от своего адресу
// Для этого необходимо отправить нулевой адрес в качестве адреса прикрепляемого смарт-контракта
const authorization = await walletClient.signAuthorization({
  account: eoa,
  address: zeroAddress,
});

// Relay аккаунт отправляет транзакцию, которая удаляет код смарт-контракта с EOA адреса
const hash = await walletClient.sendTransaction({
  authorizationList: [authorization],
  account: relay,
  to: eoa.address,
  chain: sepolia,
});

console.log(`Transaction hash: ${hash}`);