const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
    const whitelistAddress = process.env.WHITELIST_CONTRACT_ADDRESS;
    const metadataUrl = process.env.METADATA_URL;

    const contract = await (await ethers.getContractFactory("WNC")).deploy(
        metadataUrl,
        whitelistAddress
    );

    console.log("WNC contract address: ", contract.address);
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
})