//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Token.sol";
import "hardhat/console.sol";

contract TokenSale {
    Token public token;
    uint256 public SALE_DURATION = 30 days;
    uint256 public startTime;
    uint256 public tokensSold;
    uint256 public totalSupply;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 price);
    
    constructor(address _tokenAddress, uint256 _totalSupply) {
        token = Token(_tokenAddress);
        totalSupply = _totalSupply;
        startTime = block.timestamp;
    }

    function buyTokens(uint256 amountTokens) public payable {
        require(block.timestamp <= startTime + SALE_DURATION, "Token sale campaign is stopped");
        require(tokensSold + amountTokens <= (totalSupply / 2), "Buying tokens is stopped");

        uint256 price = getTokenPrice(amountTokens);
        require(msg.value >= price, "Insufficient ETH sent");

        tokensSold += amountTokens;
        token.transferFrom(token.owner(), msg.sender, amountTokens);

        emit TokensPurchased(msg.sender, amountTokens, price);
    }

    function getTokenPrice(uint256 amountTokens) public view returns (uint256) {
        uint256 firstTime = totalSupply / 4;
        uint256 price;

        if (tokensSold + amountTokens <= firstTime) {
            price = amountTokens * 5;
        } else {
            price = amountTokens * 10;
        }
        return price;
    }
}