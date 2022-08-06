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

contract Raffle is VRFConsumerBaseV2
{
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /* Events */
    event RaffleEnter(address indexed player);

    constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2)
    {   
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable
    {
        if (msg.value < i_entranceFee)
        {
            revert Raffle__NotEnoughETHEntered();
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

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override
    {

    }

    function getEntranceFee() public view returns(uint256)
    {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns(address)
    {
        return s_players[index];
    }
}