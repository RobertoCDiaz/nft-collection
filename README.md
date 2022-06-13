# NFT Collection

A new NFT Collection defined by a Solidity Contract using the ERC-721 standard with the Enumerable Extension, which will be accessible through a web dapp using Next.js.

This collection will have a determined date on which it will be published and anyone can mint a NFT for themselves, and will use a previously created whitelist to allow early supporters to mint NFTs before the actual publication date.

Check it out [in production](https://nft-collection-nffy79zbv-robertocdiaz.vercel.app/).

You can also see the whole NFT collection [at OpenSea](https://testnets.opensea.io/collection/whitelistnftcollection-v2).

## Characteristics of the collection
* There will be a limit of 20 NFTs, and each one of them will be a unique piece.  

* Users will only be able to mint 1 NFT per transaction.

* Whitelisted users will have a 5 minute window before the actual sale begin to mint NFTs.

* Each NFT should have a determined price defined in Ether ($ETH).

* You must be able to see the collection at [OpenSea](https://testnets.opensea.io).

## Installation

1. Clone repository and cd into it:
```bash
git clone https://github.com/RobertoCDiaz/nft-collection
cd nft-collection

2. Get into both the `app` and `hardhat` repositories and install their npm dependencies:
```bash
cd app && npm i && cd ../hardhat && npm i
```

## Smart Contract configuration and deployment
Go into the `hardhat` directory. Once there, do as following steps indicate. 

1. Create an Alchemy node in the Rinkeby network
    * Sign up to the [Alchemy](https://www.alchemyapi.io) service and create a new app using the Rinkeby network

2. Deploy the Next.js application using a hosting provider like [Vercel](https://vercel.com) and associate it to a domain. Append `/api/` to your URL and save this endpoint as you will use it later. You must end up with a URL like `https://nft-collection-nffy79zbv-robertocdiaz.vercel.app/api/`

3. Configure environment variables
    * Create a `.env` as a copy of the `.env-template` file and replace the values of the following variables.
    * **ALCHEMY_URL** is the URL with the API Key that Alchemy provides on the dashboard for your new app (the one created on the previous step).
    * **PRIVATE_KEY** is the private key for your account on the Rinkeby Network. You can use Metamask for this.
    * **WHITELIST_CONTRACT_ADDRESS** is the address of the Whitelist Contract created at [this repo](https://github.com/RobertoCDiaz/whitelist-dapp).
    * **METADATA_URL** is the endpoint of the app which will provide the required metadata of each NFT according to the [OpenSea's documentation](https://docs.opensea.io/docs/metadata-standards). This is where you paste the endpoint you obtained in the last step.
```bash
ALCHEMY_URL=
PRIVATE_KEY=
WHITELIST_CONTRACT_ADDRESS=
METADATA_URL=
```

3. Run the `deploy` npm command to compile and deploy the smart contract

```bash
cd hardhat
npm run deploy
```

## Web dApp server start

To start a development server to preview the application on your localhost, go to the `app` directory and run the following command:

```bash
npm run dev
```

This will run a development server for the Next.js app.