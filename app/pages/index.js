import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useRef, useState } from 'react'

import { Contracts, providers, utils } from require("ethers");
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants/index";
import { Signer } from 'ethers';

export default function Home() {
  // state variables
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [hasPresaleStarted, setHasPresaleStarted] = useState(false);
  const [hasPresaleEnded, setHasPresaleEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [mintedCount, setMintedCount] = useState(false);

  // modal used to connect to metamask
  const web3Modal = useRef();

  /**
   * Gets a provider or a signer to operate on the blockchain, as needed.
   * 
   * @param {*} shouldBeSigner - Set to `true` if a signer should be returned. Otherwise, a provider will be returned.
   * @returns A signer or a provider.
   */
  const getProviderOrSigner = async (shouldBeSigner = false) => {
    const provider = await web3Modal.current.connect();
    const web3Provider = await providers.Web3Provider(provider);

    if (web3Provider.getNetwork() !== 4) {
      window.alert("Change to Rinkeby network");
      throw new Error("Change to Rinkeby network");
    }

    return shouldBeSigner ? web3Provider.getSigner() : web3Provider;
  }

  /**
   * Creates a new contract instance.
   * 
   * @param {boolean} withSigner - Set to true if a signer will be needed to operate using on the contract.
   * @returns A contract instance to operate on the blockchain.
   */
  const contractInstance = (withSigner = false) => {
    return new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, await getProviderOrSigner(withSigner));
  }

  /**
   * Creates a new instance of the NFT Contract so any function contained in it can be called.
   * 
   * @param {(Contract) => any} contractFunction - Function that returns the (already awaited) function to be called usign the contract.
   * @param {() => any} fallbackFunction - What to do after the transaction has been mined
   * @param {boolean} needSigner - Set to true if a signer is needed to execute the function. Otherwise, it will be called using a provider.
   */
  const contractTransaction = async (contractFunction, fallbackFunction, needSigner = false) => {
    try {
      const contract = contractInstance(needSigner);

      const tx = await contractFunction(contract);

      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);

      fallbackFunction();
    } catch (error) {
      console.error(error);
    }
  }
  

  /**
   * Tries to mint one WNC NFT for the current user address.
   * 
   * @param {*} isPresaleMint - Defines if the minting should be tried in the presale or not.
   */
  const mintNFT = async (isPresaleMint = false) => {
    contractTransaction({
      contractFunction: async (contract) => {
        // options to be passed on each mint operation
        const mintOptions = {
          // value signifies the cost of one WNC which, as the contract defines, is 0.001 ETH.
          value: utils.parseEther("0.001"),
        };

        // creates transaction for mint operation
        const tx = isPresaleMint ? 
          contract.presaleMint(mintOptions) :
          contract.mint(mintOptions);

        return tx;
      },
      fallbackFunction: () => {
        alert("You've successfully minted a WNC NFT!");
      },
      needSigner: true,
    });
  }

  /**
   * Tries to start the presale.
   */
  const startPresale = async () => {
    await contractTransaction({
      contractFunction: async (contract) => {
        return contract.startPresale();
      },
      fallbackFunction: () => {
        await checkIfPresaleStarted();
      },
      needSigner: true,
    });
  }

  /**
   * Checks if the presale has started or not, and update state variables to reflect it.
   * 
   * @returns Whether the presale has started or not.
   */
  const checkIfPresaleStarted = async () => {
    try {
      const contract = contractInstance();

      const hasStartedYet = await contract.presaleStarted();

      if (!hasStartedYet) {
        await checkIfOwner();
      }

      setHasPresaleStarted(hasStartedYet);

      return hasStartedYet;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Checks if the presale has already ended or not, and updates the state of the app to reflect it.
   * 
   * @returns Whether the presale has already ended or not.
   */
  const checkIfPresaleHasEnded = async () => {
    try {
      const contract = contractInstance();

      const hasEndedYet = await contract.presaleEnded();

      setHasPresaleEnded(hasEndedYet);

      return hasEndedYet;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Checks if the current user is the owner of the NFT contract, and updates state to reflect it.
   */
  const checkIfOwner = async () => {
    try {
      const contract = contractInstance();

      // gets the actual address of the owner of the contract
      const owner = await contract.owner();

      // gets user's address
      const address = (await getProviderOrSigner(true)).getAddress();

      // only sets isOwner state variable to true if it is in fact the owner
      // otherwise, it will not touch state, preventing rerendering
      if (owner.toLowerCase() === address.toLowerCase())
        setIsOwner(true);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Updates the current count of minted NFTs right from the contract state on the blockchain.
   */
  const updateTokensCount = async () => {
    try {
      const contract = contractInstance();

      setMintedCount(await contract.tokenIds());
    } catch(err) {
      console.error(err);
    }
  }

  /**
   * Connects to the Ethereum wallet (e.g. Metamask).
   */
  const connectToWallet = async () => {
    try {
      await getProviderOrSigner();

      setIsWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="app">
      <Head>
        <title>NFT Collection</title>
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
      </Head>
    </div>
  )
}
