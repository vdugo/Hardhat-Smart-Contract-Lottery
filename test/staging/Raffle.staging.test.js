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

    describe("fulfillRandomWords", async () =>
    {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () =>
        {
            const startingTimestamp = await raffle.getLatestTimestamp()
            const accounts = await ethers.getSigners()

            await new Promise(async (resolve, reject) =>
            {
                raffle.once("WinnerPicked", async () =>
                {
                    console.log("WinnerPicked event fired!")
                    try
                    {
                        const recentWinner = await raffle.getRecentWinner()
                        const raffleState = await raffle.getRaffleState()
                        const winnerBalance = await accounts[0].getBalance()
                        const endingTimestamp = await raffle.getLatestTimestamp()

                        expect (raffle.getPlayer(0)).to.be.reverted
                        assert.equal(recentWinner.toString(), accounts[0].address)
                        assert.equal(raffleState.toString, "0")
                        assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee).toString())
                        assert(endingTimestamp > startingTimestamp)
                        resolve()
                    }
                    catch(e)
                    {
                        console.log(e)
                        reject(e)
                    }
                })
            })

            await raffle.enterRaffle({value: raffleEntranceFee})
            const winnerStartingBalance = await accounts[0].getBalance() 
        })
    })
})
