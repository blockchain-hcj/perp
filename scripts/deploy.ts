import {ethers} from "hardhat";
import fs from "fs";
import * as config from "../config";
import {validateConfig} from "hardhat/internal/core/config/config-validation";
import {GLP, GMX} from "../typechain-types/gmx";
import {TimeDistributor, YieldTracker} from "../typechain-types/tokens";
import {RewardDistributor} from "../typechain-types/staking";
import {min} from "hardhat/internal/util/bigint";
async function main() {



    const [signer] = await ethers.getSigners();

    console.log(signer.address)
    const vault = await ethers.deployContract("Vault");
    await vault.waitForDeployment();
    console.log(await vault.getAddress());


    //usdg
    const usdg = await ethers.deployContract("USDG",[await vault.getAddress()]);
    await usdg.waitForDeployment();


    //router
    const router = await ethers.deployContract("Router", [await vault.getAddress(), await usdg.getAddress(), config.WETH_ADDRESS] );
    await router.waitForDeployment();

    //pricefeed
    const vaultPriceFeed = await ethers.deployContract("VaultPriceFeed");
    await vaultPriceFeed.waitForDeployment();

    const setMaxStrictPriceDeviation = await vaultPriceFeed.setMaxStrictPriceDeviation( 10n ** 28n);
    await setMaxStrictPriceDeviation.wait();


    const setPriceSampleSpace = await vaultPriceFeed.setPriceSampleSpace(1);
    await setPriceSampleSpace.wait();

    const setIsAmmEnabled = await vaultPriceFeed.setIsAmmEnabled(false);
    await setIsAmmEnabled.wait();

    const glp = await ethers.deployContract("GLP") as GLP;
    await glp.waitForDeployment()


    const setInPrivateTransferMode = await glp.setInPrivateTransferMode(true);
    await setInPrivateTransferMode.wait();

    const shortsTracker = await ethers.deployContract("ShortsTracker", [await vault.getAddress()] );
    await shortsTracker.waitForDeployment();

    const setIsGlobalShortDataReady = await shortsTracker.setIsGlobalShortDataReady(true);
    await setIsGlobalShortDataReady.wait();



    const glpManager = await ethers.deployContract("GlpManager", [
        await vault.getAddress(),
        await usdg.getAddress(),
        await glp.getAddress(),
        await shortsTracker.getAddress(),
        config.COOL_DOWN_DURATION
    ])

    await glpManager.waitForDeployment();


    //setin private

    const glpSetMinter = await glp.setMinter(await glpManager.getAddress(), true);
    await glpSetMinter.wait();

    const usdgAddVault = await usdg.addVault(await glpManager.getAddress());
    await usdgAddVault.wait();

    const vaultInit = await vault.initialize(
        await router.getAddress(),
        await usdg.getAddress(),
        await vaultPriceFeed.getAddress(),
        (2n * 10n ** 10n) * (10n ** 20n),
        100,// fundingRateFactor
        100// stableFundingRateFactor
    )
    await vaultInit.wait();


    const setFundingRate = await vault.setFundingRate(60 * 60, 100, 100);
    await setFundingRate.wait();

    const setInManagerMode = await vault.setInManagerMode(true);
    await setInManagerMode.wait();

    const vaultSetManager = await vault.setManager(await glpManager.getAddress(), true);
    await vaultSetManager.wait();

    const setFees = await vault.setFees(
        10,
        5,
        20,
        20,
        1,
        10,
        (2n * 10n ** 10n) * (10n ** 20n),
        24 * 60 * 60,
        true
    )
    await setFees.wait();

    const vaultErrorController = await ethers.deployContract("VaultErrorController");
    await vaultErrorController.waitForDeployment();

    const setErrorController = await vault.setErrorController(await vaultErrorController.getAddress());
    await setErrorController.wait();

    const setErrors = await vaultErrorController.setErrors(await vault.getAddress(), config.ERRORS);
    await setErrors.wait();

    const vaultUtils = await ethers.deployContract("VaultUtils", [await vault.getAddress()]);
    await vaultUtils.waitForDeployment();

    const setVaultUtils = await vault.setVaultUtils(await vaultUtils.getAddress());
    await setVaultUtils.wait();



    const mockToken = await ethers.deployContract("MockToken");
    await mockToken.waitForDeployment();


    const setPriceFeed = await vaultPriceFeed.setTokenConfig(
        await mockToken.getAddress(),
        config.ETH_ORACLE,
        8,
        false
    );
    await setPriceFeed.wait();

    const setTokenConfig = await vault.setTokenConfig(
        await mockToken.getAddress(),
        18,
        10000,
        75,
        0,
        false,
        true
    );
    await setTokenConfig.wait();

    console.log("approve")
    const mint = await mockToken.mint(signer.address, ethers.parseEther("100000000"));
    await mint.wait();
    const  approve = await mockToken.approve(await glpManager.getAddress(), ethers.parseEther("1000000"));
    await approve.wait();


    const gmx = await ethers.deployContract("GMX") as GMX;
    await gmx.waitForDeployment();

    const setMinter = await gmx.setMinter(signer.address, true);
    await setMinter.wait();




    const yieldTracker = await ethers.deployContract("YieldTracker",[ await glp.getAddress()]) as YieldTracker;
    await yieldTracker.waitForDeployment();

    const glpSetTracker = await glp.setYieldTrackers([await yieldTracker.getAddress()]);
    await glpSetTracker.wait();

    const rewardDistributor = await ethers.deployContract("TimeDistributor") as TimeDistributor;
    await rewardDistributor.waitForDeployment();


    const setRewardDistributor = await yieldTracker.setDistributor(await rewardDistributor.getAddress());
    await setRewardDistributor.wait();

    const setDistribution = await rewardDistributor.setDistribution([await yieldTracker.getAddress()], [0], [await gmx.getAddress()]);
    await setDistribution.wait();
    console.log("update last Distribution time success");
    //TODO
    const gmxmint = await gmx.mint(await rewardDistributor.getAddress(), ethers.parseEther('10000'));
    await gmxmint.wait();
      const setTokenPerInterval = await rewardDistributor.setTokensPerInterval(await yieldTracker.getAddress(), ethers.parseEther('1'));
      await setTokenPerInterval.wait();
      console.log("set Token interval success")




    const  addLiquidity = await glpManager.addLiquidity(await mockToken.getAddress(), ethers.parseEther('1000'), 0, 0);
    await addLiquidity.wait();

    console.log(await glp.balanceOf(signer.address));
    console.log( await glpManager.getAumInUsdg(true));
    console.log( await glpManager.getAumInUsdg(false));

    console.log(await yieldTracker.claimable(signer.address));


    const decreaseLiquidity = await glpManager.removeLiquidity(await mockToken.getAddress(), ethers.parseEther('10'), 0, signer.address);
    await decreaseLiquidity.wait();
    console.log("decrease Liquidity success");


    console.log(await glp.balanceOf(signer.address));
    console.log( await glpManager.getAumInUsdg(true));
    console.log( await glpManager.getAumInUsdg(false));

    console.log(await yieldTracker.claimable(signer.address));









}





function loadPreviousDeployment() {
    let previousDeployment = {};
    if (fs.existsSync("./DeploymentOutput.json")) {
        console.log(`Loading previous deployment...`);
        previousDeployment = require( "../DeploymentOutput.json");
        console.log(previousDeployment);
    }
    return previousDeployment;
}


function saveDeployment(deploymentState: any) {
    const deploymentStateJSON = JSON.stringify(deploymentState, null, 2);
    fs.writeFileSync("./DeploymentOutput.json", deploymentStateJSON);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


