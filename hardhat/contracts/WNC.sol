// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhiteList.sol";

contract WNC is ERC721Enumerable, Ownable {

    /**
        Used for computing final {tokenURI}. 
        If this is set, the URI for any NFT will be a concatenation of the `baseURI` and the `tokenId`.
     */
    string _baseTokenURI;

    /**
        Price for each NFT token.
     */
    uint public _price = 0.001 ether;

    // The contract can be "paused" in case of emergency by setting this variable to `true`.
    bool public _paused;

    // Limit of tokens available.
    uint8 public maxTokenIds = 20;

    // Count of currently minted tokens.
    uint8 public tokenIds;

    // Whitelist instance.
    IWhiteList whitelist;

    // Keeps track of whether presale has already started or not.
    bool public presaleStarted;

    // Timestamp for when presale would end.
    uint256 public presaleEnded;

    /**
        This modifier will be applied to those functions that require the contract to not be paused to be executed.
     */
    modifier onlyWhenNotPaused() {
        require(!_paused, "This contract is currently paused and no action can be done on it");
        _;
    }

    /**
        Validations required for a successful mint.

        bool forPresale - Determines if the restrictions to be validates should be those required for the presale or not. If false, it will validate as if the normal sale is on.
     */
    modifier mintRestrictions(bool forPresale) {
        require(presaleStarted, "Sale has not yet officially started");

        if (forPresale) {
            require(block.timestamp < presaleEnded, "Presale has ended");
        } else {
            require(block.timestamp >= presaleEnded, "Presale has not yet ended");
        }

        require(tokenIds < maxTokenIds, "There's not more NFT available.");
        require(msg.value >= _price, "Ether sent is not correct");

        _;
    }

    /**
        The constructor of the ERC721 Contract asks for a name for the token (WhitelistNFTCollection) and
        a symbol (WNC). 

        The constructor for this contract will take a `baseURI` that will define the `_baseTokenURI` variable.
        
        It also initializes the Whitelist interface using a previously deployed WhiteList Contract.
     */
    constructor(string memory baseURI, address whitelistContract) ERC721("WhitelistNFTCollection", "WNC") {
        _baseTokenURI = baseURI;
        whitelist = IWhiteList(whitelistContract);
    }

    /**
        Starts the presale for the whitelisted addresses.

        The `onlyOwner` modifier comes from the `Ownable` contract, and will only allow 
        the owner of this contract (the user who deployed it) to run this function.
     */
    function startPresale() public onlyOwner {
        presaleStarted = true;

        // As the presale has now started, and the time it will last is 5 minutes,
        // the presaleEnded timestamp is set to this block's timestamp + 5 minutes.
        presaleEnded = block.timestamp + 30 minutes;
    }

    /**
        Mint a new NFT token while presale is on.
     */
    function presaleMint() public payable onlyWhenNotPaused mintRestrictions(true) {
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
        Mint a new NFT after the presale has ended.
     */
    function mint() public payable onlyWhenNotPaused mintRestrictions(false) {
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
        Changes the `pause` state of the contract. 

        bool val - Value to which the `pause` variable will be set. If true, the contract will be "paused". Otherwise, it will work as normal.
     */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /**
        Sends all the Ether in the contract to the current owner.
     */
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool sent, ) = owner().call{ value: amount }("");
        require(sent, "Failed to send Ether");
    }

    /**
        overrides the OpenZepellin's ERC721 implementation of the _baseURI function
        which is an empty string by default
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // function to be able to receive Ether. msg.data must be empty.
    receive() external payable {}

    // fallback function is called when msg.data is not empty.
    fallback() external payable {}
}