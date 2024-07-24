

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Treasure is Ownable {
    uint256 private _depositValue;
    mapping(address => bool) _isDeposited;

    event DepositValueSet(uint256 depositValue);
    error InsufficientDeposit();

    constructor(uint256 depositValue) Ownable(msg.sender) {
        _depositValue = depositValue;
    }

    function deposit() external payable {
        if (msg.value < _depositValue) {
            revert InsufficientDeposit();
        }

        _isDeposited[msg.sender] = true;
    }

    function isDeposit(address account) external view returns (bool) {
        return _isDeposited[account];
    }

    function withdraw() external {
        if (!_isDeposited[msg.sender]) {
            revert InsufficientDeposit();
        }

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) {
            revert();
        }
    }

    function getDepositValue() external view returns (uint256) {
        return _depositValue;
    }

    function setDepositValue(uint256 depositValue) external onlyOwner {
        _depositValue = depositValue;

        emit DepositValueSet(depositValue);
    }
}