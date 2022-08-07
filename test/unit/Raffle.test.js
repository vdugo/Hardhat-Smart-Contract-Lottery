const { assert, expect } = require('chai')
const { getNamedAccounts, deployments, ethers, network } = require('hardhat')
const { developmentChains, networkConfig } = require('../../helper-hardhat-config')

!developmentChains.includes(network.name) ? describe.skip 
: 
describe("Raffle Unit Tests", async () => 
{
    let deployer, raffle, vrfCoordinatorV2Mock, raffleEntranceFee, interval
    const chainId = network.config.chainId

    beforeEach(async () =>
    {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        raffleEntranceFee = await raffle.getEntranceFee()
        interval = await raffle.getInterval()
    })

    describe("constructor", async () => 
    {
        it("initializes the raffle correctly", async () =>
        {
            const raffleState = await raffle.getRaffleState()
            const interval = await raffle.getInterval()
            assert.equal(raffleState.toString(), "0")
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
    })

    describe("enterRaffle", async () =>
    {
        it("reverts when you don't pay enough", async () =>
        {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughETHEntered")
        })

        it("records players when they enter", async () => 
        {
            await raffle.enterRaffle({value: raffleEntranceFee})
            const playerFromContract = await raffle.getPlayer(0)
            assert.equal(playerFromContract, deployer)
        })

        it("emits event on enter", async () =>
        {
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(raffle, "RaffleEnter")
        })

        it("doesn't allow entrance when raffle is calculating", async () =>
        {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])

            // pretend to be a Chainlink keeper
            await raffle.performUpkeep([])
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith("Raffle__NotOpen")
        })
    })

    describe("checkUpkeep", async () =>
    {
        it("returns false if people haven't sent any ETH", async () =>
        {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })

        it("returns false if raffle isn't open", async () =>
        {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            const raffleState = await raffle.getRaffleState()
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert.equal(raffleState.toString(), "1") // 1 is CALCULATING state
            assert.equal(upkeepNeeded, false)
        })

        it("returns false if enough time hasn't passed", async () => 
        {
            await raffle.enterRaffle({ value: raffleEntranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => 
        {
            await raffle.enterRaffle({ value: raffleEntranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(upkeepNeeded)
        })
    })

    describe("performUpkeep", async () =>
    {
        it("can only run if checkUpkeep is true", async () =>
        {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const tx = await raffle.performUpkeep([])
            assert(tx)
        })
        it("reverts when checkUpkeep is false", async () =>
        {
            await expect(raffle.performUpkeep([])).to.be.reverted
        })
        it("updates the raffle state, emits an event, and calls the vrf coordinator", async () => 
        {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const txResponse = await raffle.performUpkeep([])
            const txReceipt = await txResponse.wait(1)
            const requestId = txReceipt.events[1].args.requestId
            const raffleState = await raffle.getRaffleState()
            assert(requestId.toNumber() > 0)
            assert(raffleState.toString() == "1")
        })
    })
    describe("fulfillRandomWords", async () =>
    {
        beforeEach(async () =>
        {
             await raffle.enterRaffle({value: raffleEntranceFee})
             await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
             await network.provider.send("evm_mine", [])
        })

        it("can only be called after performUpkeep", async () =>
        {
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
        })

        it("picks a winner, resets the lottery, and sends money", async () =>
        {
            const additionalEntrants = 3
            const startingAccountIndex = 1 // deployer = 0
            const accounts = await ethers.getSigners()

            for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++)
            {
                const accountConnectedRaffle = raffle.connect(accounts[i])
                await accountConnectedRaffle.enterRaffle({value: raffleEntranceFee})
            }
            const startTimestamp = await raffle.getLatestTimestamp()

            await new Promise(async (resolve, reject) =>
            {
                raffle.once("WinnerPicked", async () => 
                {
                    console.log("Found the event!")
                    try
                    {
                        const recentWinner = await raffle.getRecentWinner()
                        console.log(`Recent winner: ${recentWinner}`)
                        const raffleState = await raffle.getRaffleState()
                        const endingTimestamp = await raffle.getLatestTimestamp()
                        const numPlayers = await raffle.getNumberOfPlayers()

                        assert.equal(numPlayers.toString(), "0")
                        assert.equal(raffleState.toString(), "0")
                        assert(endingTimestamp > startTimestamp)
                    }
                    catch (e)
                    {
                        reject(e)
                    }
                    resolve()
                })
                const tx = await raffle.performUpkeep([])
                const txReceipt = await tx.wait(1)
                await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffle.address)
            })
        })
    })
})