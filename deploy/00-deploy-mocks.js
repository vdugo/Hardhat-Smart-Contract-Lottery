const { developmentChains } = require('../helper-hardhat-config')

const BASE_FEE = ethers.utils.parseEther("0.25") // costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // LINK per gas

module.exports = async({ getNamedAccounts, deployments }) =>
{
    const { deploy, logs } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name))
    {
        log("Local network detected, Deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed")
        log("------------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]