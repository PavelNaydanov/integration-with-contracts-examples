import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import 'dotenv/config';

import { walletClient, relay } from '../config.js';
import { abi, contractAddress } from '../contract.js';

const EOA_PRIVATE_KEY = process.env.EOA_PRIVATE_KEY;
if (!EOA_PRIVATE_KEY) {
  console.error(new Error("Invalid eoa private key"));
  process.exit(1);
}

const eoa = privateKeyToAccount(EOA_PRIVATE_KEY);

// EOA аккаунт подписывает данные для того, чтобы прикрепить код смарт-контракта к своему адресу
const authorization = await walletClient.signAuthorization({
  account: eoa,
  contractAddress,
});

// Relay аккаунт отправляет транзакцию, которая добавляет код смарт-контракта к EOA адресу
// Используется функция `initialize` для первого вызова кода для EOA адреса
const hash = await walletClient.writeContract({
  abi,
  account: relay,
  address: eoa.address,
  authorizationList: [authorization],
  functionName: 'initialize',
  chain: sepolia,
});

console.log(`Transaction hash: ${hash}`);