// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract OreNFT is ERC721, Ownable {
    enum OreKind {
        Diamond,
        Genesis
    }

    error UnauthorizedMinter();
    error TokenDoesNotExist();

    address public minter;
    string public baseTokenURI;
    uint256 public nextTokenId = 1;

    mapping(uint256 => OreKind) public oreKinds;

    modifier onlyMinter() {
        if (msg.sender != minter) revert UnauthorizedMinter();
        _;
    }

    constructor(address initialOwner, string memory baseTokenURI_) ERC721("Block Ore NFT", "BORE") Ownable(initialOwner) {
        baseTokenURI = baseTokenURI_;
    }

    function setMinter(address minter_) external onlyOwner {
        minter = minter_;
    }

    function setBaseTokenURI(string calldata baseTokenURI_) external onlyOwner {
        baseTokenURI = baseTokenURI_;
    }

    function mintTo(address to, OreKind oreKind) external onlyMinter returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        oreKinds[tokenId] = oreKind;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();

        string memory suffix = oreKinds[tokenId] == OreKind.Diamond ? "diamond.json" : "genesis.json";
        return string.concat(baseTokenURI, suffix);
    }
}
