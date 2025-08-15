import 'dotenv/config';

export const abi = [
  {
    "type": "function",
    "name": "initialize",
    "inputs": [],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "ping",
    "inputs": [],
    "outputs": [],
    "stateMutability": "pure"
  },
];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
console.log("CONTRACT_ADDRESS: ", CONTRACT_ADDRESS)
if (!CONTRACT_ADDRESS) {
  console.error(new Error("Invalid contract address"));
  process.exit(1);
}

export const contractAddress = CONTRACT_ADDRESS;