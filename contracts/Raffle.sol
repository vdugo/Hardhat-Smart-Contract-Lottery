// Raffle

// Enter the lottery (pay some amount)
// pick a random winner (verifiably random)
// winner to be selected every X minutes -> completely automated

// Chainlink Oracle -> randomness, automated execution (chainlink keeper)

// SPDX-License-Identifier: MIT
pragma solidity  ^0.8.7;

contract Raffle
{
    uint256 private immutable i_entranceFee;

    constructor(uint256 entranceFee)
    {
        i_entranceFee = entranceFee;
    }

    function enterRaffle()
    {

    }

    function pickRandomWinner()
    {
         
    }

    function getEntranceFee() public view returns(uint256)
    {
        return i_entranceFee
    }
}