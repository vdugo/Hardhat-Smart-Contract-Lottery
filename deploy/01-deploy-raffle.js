const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) =>
{
    const { deploy, logs } = deployments
    const { deployer } = await getNamedAccounts()

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })
}