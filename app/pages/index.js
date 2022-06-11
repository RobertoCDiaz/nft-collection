import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'

import { Contract, providers, utils } from "ethers";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants/index";
import Web3Modal from 'web3modal';

export default function Home() {
  // state variables
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [hasPresaleStarted, setHasPresaleStarted] = useState(false);
  const [hasPresaleEnded, setHasPresaleEnded] = useState(false);
  const [presaleEndDate, setPresaleEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);

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
    const web3Provider = new providers.Web3Provider(provider);

    
    if ((await web3Provider.getNetwork()).chainId !== 4) {
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
  const contractInstance = async (withSigner = false) => {
    return new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, await getProviderOrSigner(withSigner));
  }  

  /**
   * Tries to mint one WNC NFT for the current user address.
   * 
   * @param {boolean} isPresaleMint - Defines if the minting should be tried in the presale or not.
   */
  const mintNFT = async (isPresaleMint = false) => {
    try {
      const contract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        await getProviderOrSigner(true),
      );

      // options to be passed on each mint operation
      const mintOptions = {
        // value signifies the cost of one WNC which, as the contract defines, is 0.001 ETH.
        value: utils.parseEther("0.001"),
      };

      // creates transaction for mint operation
      const tx = isPresaleMint ? 
        await contract.presaleMint(mintOptions) :
        await contract.mint(mintOptions);

      // wait for transaction to be mined
      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);
      
      alert("You've successfully minted a WNC NFT!");
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Tries to start the presale.
   */
  const startPresale = async () => {
    // await contractTransaction({
    //   contractFunction: contract => contract.startPresale,
    //   fallbackFunction: async () => {
    //     await checkIfPresaleStarted();
    //   },
    //   needSigner: true,
    // });

    try {
      const signer = await getProviderOrSigner(true);
      const contract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const tx = await contract.startPresale();

      setIsLoading(true);
      await tx.wait();
      setIsLoading(false);

      await checkIfPresaleStarted();
    } catch(err) {
      console.error(err)
    };
  }

  /**
   * Checks if the presale has started or not, and update state variables to reflect it.
   * 
   * @returns Whether the presale has started or not.
   */
  const checkIfPresaleStarted = async () => {
    try {
      const contract = await contractInstance();

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
      const contract = await contractInstance();

      const endStamp = await contract.presaleEnded();
      setPresaleEndDate(new Date(endStamp.toNumber()));

      const hasEndedYet = endStamp.lt(Math.floor(Date.now() / 1000));

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
      const contract = await contractInstance();

      // gets the actual address of the owner of the contract
      const owner = await contract.owner();

      // gets user's address
      const address = await (await getProviderOrSigner(true)).getAddress();

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
      const contract = await contractInstance();

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

  useEffect(() => {
    if (!isWalletConnected) {
      // if wallet is not connected, create a new instance of a web3modal
      web3Modal.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      // then connect to wallet
      connectToWallet();

      // check every 5 seconds if presale has started/ended
      // when ended, this interval is cleared
      const presaleEndedInterval = setInterval(async () => {
        const presaleStarted = await checkIfPresaleStarted();
        if (presaleStarted) {
          const presaleEnded = await checkIfPresaleHasEnded();

          if (presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 1 * 1000);

      // when connecting to wallet for the first time, initiate an
      // interval that will update the count of minted nfts every 5 seconds
      setInterval(async () => {
        await updateTokensCount();
      }, 5 * 1000);
    }
  }, [isWalletConnected]);

  const StateButton = () => {
    // if currently loading, show a `loading` message
    if (isLoading) {
      return (
        <div className={styles.msgButton}>
          Loading...
        </div>
      );
    }

    // if wallet not connected, return a button to connect to wallet
    if (!isWalletConnected) {
      return (<div onClick={connectToWallet} className={styles.button}>
        Connect to wallet
      </div>);
    }

    // if presale has not started and the user is the owner, allow them to start presale
    if (!hasPresaleStarted && isOwner) {
      return (<div onClick={startPresale} className={styles.button}>
        Start presale
      </div>);
    }

    // if presale has not started yet, show a `presale has not started yet` message
    if (!hasPresaleStarted) {
      return <div className={styles.msgButton}>
        Presale has not started yet
      </div>
    }

    // at this point, the presale has started, so check if presale has ended or not
    // if not, enable a mint button that says to mint only if whitelisted
    if (!hasPresaleEnded) {
      return <div onClick={async () => await mintNFT(true)} className={styles.button}>
        Presale Mint! *
      </div>
    }

    // if we reach here, then presale has already ended, so enable a public mint button
    return <div onClick={async () => await mintNFT()} className={styles.button}>
      Public mint!
    </div>
  }

  const TimeUntilPresaleEnd = () => {
    const now = Date.now();

    if (presaleEndDate == null || now > presaleEndDate) {
      return <div style={{ visibility: 'none' }}></div>
    }

    return <div>
      Presale ends in { (presaleEndDate - now) } seconds!
    </div>
  }

  return (
    <div className={styles.app}>
      <Head>
        <title>NFT Collection</title>
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
      </Head>
      <div className={styles.main}>
        <div className={styles.info}>
          <h1>Welcome to the WNC NFTs website!</h1>
          <div className={styles.description}>
            It's an NFT collection for crypto devs.
          </div>
          <div className={styles.description}>
            {mintedCount}/20 have been minted
          </div>
          { StateButton() }
          { TimeUntilPresaleEnd() }
        </div>
        <img className={styles.image} src="./nfts/1.svg" alt="NFTs logo" />
      </div>
    </div>
  )
}
