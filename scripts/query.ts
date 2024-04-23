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

    //const yieldTracker = await ethers.getContractAt("YieldTracker","0x22d07f7CBB8302f30A676f17178EA97688829157") as unknown as YieldTracker;
    //console.log(await yieldTracker.claimable(signer.address));
    const  glp = await ethers.getContractAt("GLP", "0x375011c89953184132eb771aede06a16861dd214") as unknown as GLP;
    const tx = await glp.claim(signer.address);
    await tx.wait();
    console.log(tx.hash);







}




// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


