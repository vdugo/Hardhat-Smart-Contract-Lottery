const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')
const { developmentChains, networkConfig } = require('../../helper-hardhat-config')

developmentChains.includes(network.name) ? describe.skip
:
describe("Raffle Staging Tests", async () => 
{
    let deployer, raffle, raffleEntranceFee

    beforeEach(async () =>
    {
        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        raffleEntranceFee = await raffle.getEntranceFee()
    })
})
