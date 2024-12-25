import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Array signature checker", function () {
    async function deploy() {
        const checker = await hre.viem.deployContract("ArrayChecker");
        const tokenA = await hre.viem.deployContract("MockERC20");
        const tokenB = await hre.viem.deployContract("MockERC20");

        return {checker, tokenA, tokenB};
    }

    it("Check signature should return true", async function () {
        const {checker, tokenA, tokenB} = await loadFixture(deploy);
        const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

        const amounts = [BigInt(1000), BigInt(1000)];
        const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);

        const signature = await userWallet.signTypedData({
            domain: {
                name: 'EIP-712 based on OZ',
                version: '1',
                chainId: 31337n,
                verifyingContract: checker.address,
            },
            types: {
                Order : [
                    {name: 'operator', type: 'address'},
                    {name: 'tokens', type: 'address[]'},
                    {name: 'amounts', type: 'uint256[]'},
                    {name: 'nonce', type: 'uint256'},
                ]
            },
            primaryType: 'Order',
            message: {
                operator: operatorWallet.account.address,
                tokens: [tokenA.address, tokenB.address],
                amounts: amounts,
                nonce: lastNonce + BigInt(1)
            }
        });

        const isChecked = await checker.read.checkSignature(
            [{
                user: userWallet.account.address,
                tokens: [tokenA.address, tokenB.address],
                amounts,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        expect(isChecked).true;
    });

    it("Check signature should revert if call was made non operator", async function () {
      const {checker, tokenA, tokenB} = await loadFixture(deploy);
      const [userWallet, operatorWallet, notOperatorWallet] = await hre.viem.getWalletClients();

      const amounts = [BigInt(1000), BigInt(1000)];
      const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);

      const signature = await userWallet.signTypedData({
          domain: {
              name: 'EIP-712 based on OZ',
              version: '1',
              chainId: 31337n,
              verifyingContract: checker.address,
          },
          types: {
              Order : [
                  {name: 'operator', type: 'address'},
                  {name: 'tokens', type: 'address[]'},
                  {name: 'amounts', type: 'uint256[]'},
                  {name: 'nonce', type: 'uint256'},
              ]
          },
          primaryType: 'Order',
          message: {
              operator: operatorWallet.account.address,
              tokens: [tokenA.address, tokenB.address],
              amounts: amounts,
              nonce: lastNonce + BigInt(1)
          }
      });

        const isChecked = await checker.read.checkSignature(
            [{
                user: userWallet.account.address,
                tokens: [tokenA.address, tokenB.address],
                amounts: amounts,
                signature
            }],
            {
                account: notOperatorWallet.account.address
            }
        );

        expect(isChecked).false;
    });

    it("Using a signature should increase the nonce", async function () {
      const {checker, tokenA, tokenB} = await loadFixture(deploy);
      const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

      const amounts = [BigInt(1000), BigInt(1000)];
      const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);

      const signature = await userWallet.signTypedData({
          domain: {
              name: 'EIP-712 based on OZ',
              version: '1',
              chainId: 31337n,
              verifyingContract: checker.address,
          },
          types: {
              Order : [
                  {name: 'operator', type: 'address'},
                  {name: 'tokens', type: 'address[]'},
                  {name: 'amounts', type: 'uint256[]'},
                  {name: 'nonce', type: 'uint256'},
              ]
          },
          primaryType: 'Order',
          message: {
              operator: operatorWallet.account.address,
              tokens: [tokenA.address, tokenB.address],
              amounts: amounts,
              nonce: lastNonce + BigInt(1)
          }
      });

        await checker.write.useSignature(
            [{
                user: userWallet.account.address,
                tokens: [tokenA.address, tokenB.address],
                amounts: amounts,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        expect(await checker.read.getNonceByAddress([userWallet.account.address])).to.be.equal(lastNonce + BigInt(1));
    });

    it("Using a signature should increase user balance", async function () {
      const {checker, tokenA, tokenB} = await loadFixture(deploy);
      const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

      const amounts = [BigInt(1000), BigInt(1000)];
      const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);

      const signature = await userWallet.signTypedData({
          domain: {
              name: 'EIP-712 based on OZ',
              version: '1',
              chainId: 31337n,
              verifyingContract: checker.address,
          },
          types: {
              Order : [
                  {name: 'operator', type: 'address'},
                  {name: 'tokens', type: 'address[]'},
                  {name: 'amounts', type: 'uint256[]'},
                  {name: 'nonce', type: 'uint256'},
              ]
          },
          primaryType: 'Order',
          message: {
              operator: operatorWallet.account.address,
              tokens: [tokenA.address, tokenB.address],
              amounts: amounts,
              nonce: lastNonce + BigInt(1)
          }
      });

        await checker.write.useSignature(
            [{
                user: userWallet.account.address,
                tokens: [tokenA.address, tokenB.address],
                amounts: amounts,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        const sumOfAmounts = amounts.reduce((partialSum, a) => partialSum + a, BigInt(0));
        expect(await checker.read.getBalanceByAddress([userWallet.account.address])).to.be.equal(sumOfAmounts);
    });
});