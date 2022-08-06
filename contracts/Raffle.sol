// Raffle

// Enter the lottery (pay some amount)
// pick a random winner (verifiably random)
// winner to be selected every X minutes -> completely automated

// Chainlink Oracle -> randomness, automated execution (chainlink keeper)

// SPDX-License-Identifier: MIT
pragma solidity  ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__NotEnoughETHEntered();

contract Raffle
{
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /* Events */
    event RaffleEnter(address indexed player);

    constructor(uint256 entranceFee)
    {   
        i_entranceFee = entranceFee;
    }

    function enterRaffle()
    {
        if (msg.value < i_entranceFee)
        {
            revert Raffle__NotEnoughETHEntered;
        }
        s_players.push(payable(msg.sender));

        emit RaffleEnter(msg.sender);
    }

    function requestRandomWinner() external 
    {
        // request the random number
        // once we get it, do something with it
        // 2 transaction process
    }

    function fulfillRandomWords() internal override
    {

    }

    function getEntranceFee() public view returns(uint256)
    {
        return i_entranceFee
    }

    function getPlayer(uint256 index) public view returns(address)
    {
        return s_players[index]
    }
}