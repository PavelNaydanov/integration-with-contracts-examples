// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ArrayChecker is EIP712 {
    bytes32 private constant ORDER_TYPE_HASH =
        keccak256("Order(address operator,address[] tokens,uint256[] amounts,uint256 nonce)");

    struct SigArgs {
        address user;
        address[] tokens;
        uint256[] amounts;
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
            keccak256(abi.encodePacked(args.tokens)),
            keccak256(abi.encodePacked(args.amounts)),
            _nonces[args.user] + 1
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

        for(uint256 i = 0; i < args.tokens.length; i++) {
            _tokenBalances[args.user] += args.amounts[i];
        }

        emit Checked(args.user, args.signature);
    }

    function getNonceByAddress(address user) external view returns (uint256) {
        return _nonces[user];
    }

    function getBalanceByAddress(address user) external view returns (uint256) {
        return _tokenBalances[user];
    }
}
