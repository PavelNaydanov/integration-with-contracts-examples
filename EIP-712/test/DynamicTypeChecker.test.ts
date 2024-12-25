import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { toHex } from 'viem';

describe("Dynamic type signature checker", function () {
    async function deploy() {
        const checker = await hre.viem.deployContract("DynamicTypeChecker");
        const token = await hre.viem.deployContract("MockERC20");

        return {checker, token};
    }

    it("Check signature should return true", async function () {
        const {checker, token} = await loadFixture(deploy);
        const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

        const amount = BigInt(1000);
        const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);
        const data = toHex("Encoded data");
        const str = "String data";

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
                    {name: 'token', type: 'address'},
                    {name: 'amount', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'data', type: 'bytes'},
                    {name: 'str', type: 'string'},
                ]
            },
            primaryType: 'Order',
            message: {
                operator: operatorWallet.account.address,
                token: token.address,
                amount: amount,
                nonce: lastNonce + BigInt(1),
                data,
                str
            }
        });

        const isChecked = await checker.read.checkSignature(
            [{
                user: userWallet.account.address,
                token: token.address,
                amount,
                data,
                str,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        expect(isChecked).true;
    });

    it("Check signature should revert if call was made non operator", async function () {
        const {checker, token} = await loadFixture(deploy);
        const [userWallet, operatorWallet, notOperatorWallet] = await hre.viem.getWalletClients();

        const amount = BigInt(1000);
        const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);
        const data = toHex("Encoded data");
        const str = "String data";

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
                    {name: 'token', type: 'address'},
                    {name: 'amount', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'data', type: 'bytes'},
                    {name: 'str', type: 'string'},
                ]
            },
            primaryType: 'Order',
            message: {
                operator: operatorWallet.account.address,
                token: token.address,
                amount: amount,
                nonce: lastNonce + BigInt(1),
                data,
                str
            }
        });

        const isChecked = await checker.read.checkSignature(
            [{
                user: userWallet.account.address,
                token: token.address,
                amount,
                data,
                str,
                signature
            }],
            {
                account: notOperatorWallet.account.address
            }
        );

        expect(isChecked).false;
    });

    it("Using a signature should increase the nonce", async function () {
        const {checker, token} = await loadFixture(deploy);
        const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

        const amount = BigInt(1000);
        const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);
        const data = toHex("Encoded data");
        const str = "String data";

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
                    {name: 'token', type: 'address'},
                    {name: 'amount', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'data', type: 'bytes'},
                    {name: 'str', type: 'string'},
                ]
            },
            primaryType: 'Order',
            message: {
                operator: operatorWallet.account.address,
                token: token.address,
                amount: amount,
                nonce: lastNonce + BigInt(1),
                data,
                str
            }
        });

        await checker.write.useSignature(
            [{
                user: userWallet.account.address,
                token: token.address,
                amount,
                data,
                str,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        expect(await checker.read.getNonceByAddress([userWallet.account.address])).to.be.equal(lastNonce + BigInt(1));
    });

    it("Using a signature should increase user balance", async function () {
        const {checker, token} = await loadFixture(deploy);
        const [userWallet, operatorWallet] = await hre.viem.getWalletClients();

        const amount = BigInt(1000);
        const lastNonce = await checker.read.getNonceByAddress([userWallet.account.address]);
        const data = toHex("Encoded data");
        const str = "String data";

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
                    {name: 'token', type: 'address'},
                    {name: 'amount', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'data', type: 'bytes'},
                    {name: 'str', type: 'string'},
                ]
            },
            primaryType: 'Order',
            message: {
                operator: operatorWallet.account.address,
                token: token.address,
                amount: amount,
                nonce: lastNonce + BigInt(1),
                data,
                str
            }
        });

        await checker.write.useSignature(
            [{
                user: userWallet.account.address,
                token: token.address,
                amount,
                data,
                str,
                signature
            }],
            {
                account: operatorWallet.account.address
            }
        );

        expect(await checker.read.getBalanceByAddress([userWallet.account.address])).to.be.equal(amount);
    });
});