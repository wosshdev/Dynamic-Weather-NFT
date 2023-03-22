// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract DynamicWeatherCard is
    ERC721,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    ERC721Burnable,
    ChainlinkClient,
    ConfirmedOwner,
    AutomationCompatibleInterface
{
    using Chainlink for Chainlink.Request;
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    Counters.Counter private _tokenIdCounter;

    bytes32 private jobId;
    uint256 private fee;
    string private waqiToken;
    uint256 public interval;
    uint256 public lastTimeStamp;

    mapping(string => uint256) public _cityToPollution;
    mapping(bytes32 => string) public _requestIdToCity;
    mapping(uint256 => string) public _tokenIdToCity;

    constructor(
        string memory token
    ) ERC721("DynamicWeatherCard", "DWC") ConfirmedOwner(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        setWaqiToken(token);
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        setChainlinkOracle(0x40193c8518BB267228Fc409a613bDbD8eC5a97b3);
        jobId = "ca98366cc7314957b8c012c72f05aeeb";
        fee = (1 * LINK_DIVISIBILITY) / 10;
        interval = 86400; // Every day
        lastTimeStamp = block.timestamp;
    }

    function setWaqiToken(
        string memory token
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        waqiToken = token;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function safeMint(address to, string memory city) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _tokenIdToCity[tokenId] = city;
        _cityToPollution[city] = 0; // Default Temporary value
        _safeMint(to, tokenId);
        _setTokenURI(
            tokenId,
            "https://gateway.pinata.cloud/ipfs/QmX2kdRQECvbBxJbaQQ5FigeGA83JoUG9bG8UDRVFRx6St?_gl=1*2y7ov4*_ga*NmU3YzFhNjEtZmVlZi00MzJmLTllNzQtMTk5YmU2ZDNhODA1*_ga_5RMPXG14TE*MTY3ODg2NTM2Ny4zLjEuMTY3ODg2NjQ4Mi40NC4wLjA."
        );
        requestPollutionData(city);
    }

    function _getMetadata(
        uint256 _pollution
    ) private pure returns (string memory) {
        if (_pollution >= 0 && _pollution < 49)
            return
                "https://gateway.pinata.cloud/ipfs/QmPAenLUKbZGR6QYdoFUNe2SURp1n3dcWp2pfq8utKDSjf/low-pollution.json";
        else if (_pollution >= 50 && _pollution < 99)
            return
                "https://gateway.pinata.cloud/ipfs/QmPAenLUKbZGR6QYdoFUNe2SURp1n3dcWp2pfq8utKDSjf/medium-pollution.json";
        else if (_pollution >= 100)
            return
                "https://gateway.pinata.cloud/ipfs/QmPAenLUKbZGR6QYdoFUNe2SURp1n3dcWp2pfq8utKDSjf/high-pollution.json";
    }

    function requestPollutionData(
        string memory _city
    ) public returns (bytes32) {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        string memory url = string(
            abi.encodePacked(
                "https://api.waqi.info/feed/",
                _city,
                "/?token=",
                waqiToken
            )
        );
        req.add("get", url);
        req.add("path", "data,aqi");

        bytes32 requestId = sendChainlinkRequest(req, fee);
        _requestIdToCity[requestId] = _city;

        return requestId;
    }

    function fulfill(
        bytes32 _requestId,
        uint256 _pollution
    ) public recordChainlinkFulfillment(_requestId) {
        _cityToPollution[_requestIdToCity[_requestId]] = _pollution;
        updateTokens();
    }

    function checkUpkeep(
        bytes calldata
    ) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            updateTokens();
        }
    }

    function withdrawLink() public onlyRole(DEFAULT_ADMIN_ROLE) {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    function updateTokens() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 numberOfExistingTokens = _tokenIdCounter.current();
        uint256 currentIndex = 0;
        for (uint256 i = 1; i < numberOfExistingTokens + 1; i++) {
            updateToken(currentIndex);
            currentIndex += 1;
        }
    }

    function updateToken(uint256 tokenId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory city = _tokenIdToCity[tokenId];
        uint256 pollution = _cityToPollution[city];
        _setTokenURI(tokenId, _getMetadata(pollution));
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
