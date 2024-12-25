// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DynamicTypeChecker is EIP712 {
    bytes32 private constant ORDER_TYPE_HASH =
        keccak256("Order(address operator,address token,uint256 amount,uint256 nonce,bytes data,string str)");

    struct SigArgs {
        address user;
        address token;
        uint256 amount;
        bytes data;
        string str;
        bytes signature;
    }

    mapping (address user => uint256 nonce) private _nonces;
    mapping (address user => uint256 balance) private _tokenBalances;

    error InvalidSignature();
    event Checked(address indexed user, bytes signature);

    constructor() EIP712("EIP-712 based on OZ", "1") {}

    function checkSignature(SigArgs calldata args) public view returns (bool) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            ORDER_TYPE_HASH,
            msg.sender, // operator
            args.token,
            args.amount,
            _nonces[args.user] + 1,
            // args.data и args.str - некорректный вариант использования.
            // Для динамических типов нужно использовать хеш
            // А строку надо еще кодировать
            keccak256(args.data),
            keccak256(abi.encodePacked(args.str))
        )));

        address signer = ECDSA.recover(digest, args.signature);
        if (signer != args.user) {
            return false;
        }

        return true;
    }

    function useSignature(SigArgs calldata args) external {
        bool isValidSignature = checkSignature(args);
        if (!isValidSignature) {
            revert InvalidSignature();
        }

        _nonces[args.user] += 1;
        _tokenBalances[args.user] += args.amount;

        emit Checked(args.user, args.signature);
    }

    function getNonceByAddress(address user) external view returns (uint256) {
        return _nonces[user];
    }

    function getBalanceByAddress(address user) external view returns (uint256) {
        return _tokenBalances[user];
    }
}
