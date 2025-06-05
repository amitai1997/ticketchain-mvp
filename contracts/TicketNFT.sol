// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ITicketNFT} from "./interfaces/ITicketNFT.sol";
import {IEventRegistry} from "./interfaces/IEventRegistry.sol";

/**
 * @title TicketNFT
 * @notice Core NFT contract for event tickets
 * @dev Implements ERC721 with custom ticket-specific functionality
 */
contract TicketNFT is ERC721, Ownable, ITicketNFT {
    // Custom errors
    error InvalidRegistryAddress();
    error NotAuthorizedMinter();
    error EventDoesNotExist();
    error EventIsPaused();
    error SeatAlreadyMinted();
    error NotOwnerOrApproved();
    error TokenDoesNotExist();

    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Reference to the EventRegistry contract
    IEventRegistry public immutable EVENT_REGISTRY;

    // Mapping from token ID to event ID
    mapping(uint256 => uint256) private _tokenToEvent;

    // Mapping from token ID to seat ID
    mapping(uint256 => uint256) private _tokenToSeat;

    // Mapping to track seat assignment per event (eventId => seatId => tokenId)
    mapping(uint256 => mapping(uint256 => uint256)) private _eventSeatToToken;

    /**
     * @notice Contract constructor
     * @param _eventRegistry Address of the EventRegistry contract
     */
    constructor(address _eventRegistry) ERC721("TicketNFT", "TICK") Ownable(msg.sender) {
        if (_eventRegistry == address(0)) revert InvalidRegistryAddress();
        EVENT_REGISTRY = IEventRegistry(_eventRegistry);
    }

    /**
     * @notice Mint a new ticket NFT
     * @dev Only authorized minters can call this function
     * @param to The address to mint the ticket to
     * @param eventId The ID of the event
     * @param seatId The seat ID for this ticket
     * @return tokenId The ID of the newly minted ticket
     */
    function mintTicket(address to, uint256 eventId, uint256 seatId) external override returns (uint256 tokenId) {
        // Check if caller is authorized minter
        if (!EVENT_REGISTRY.isMinter(msg.sender)) revert NotAuthorizedMinter();

        // Get event data to validate
        IEventRegistry.EventData memory eventData = EVENT_REGISTRY.events(eventId);
        if (eventData.ipfsHash == bytes32(0)) revert EventDoesNotExist();
        if (eventData.isPaused) revert EventIsPaused();

        // Check if seat is already taken for this event
        if (_eventSeatToToken[eventId][seatId] != 0) revert SeatAlreadyMinted();

        // TODO: Add check for max supply when ticket count tracking is implemented

        // Increment counter and get new token ID
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        // Store mappings
        _tokenToEvent[tokenId] = eventId;
        _tokenToSeat[tokenId] = seatId;
        _eventSeatToToken[eventId][seatId] = tokenId;

        // Mint the token
        _safeMint(to, tokenId);

        emit TicketMinted(to, tokenId, eventId, seatId);
    }

    /**
     * @notice Burn a ticket (for cancelled events)
     * @dev Only the owner or approved operator can burn
     * @param tokenId The ID of the ticket to burn
     */
    function burn(uint256 tokenId) external override {
        if (!_isAuthorized(msg.sender, address(0), tokenId)) revert NotOwnerOrApproved();

        uint256 eventId = _tokenToEvent[tokenId];
        uint256 seatId = _tokenToSeat[tokenId];

        // Clear mappings
        delete _tokenToEvent[tokenId];
        delete _tokenToSeat[tokenId];
        delete _eventSeatToToken[eventId][seatId];

        _burn(tokenId);

        emit TicketBurned(tokenId);
    }

    /**
     * @notice Get the event ID associated with a ticket
     * @param tokenId The ID of the ticket
     * @return eventId The ID of the event
     */
    function eventOf(uint256 tokenId) external view override returns (uint256 eventId) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return _tokenToEvent[tokenId];
    }

    /**
     * @notice Get the seat ID associated with a ticket
     * @param tokenId The ID of the ticket
     * @return seatId The seat ID
     */
    function seatOf(uint256 tokenId) external view returns (uint256 seatId) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return _tokenToSeat[tokenId];
    }

    /**
     * @notice Check if token exists
     * @param tokenId The ID to check
     * @return Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Override supportsInterface to include ITicketNFT
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(ITicketNFT).interfaceId || super.supportsInterface(interfaceId);
    }

    // TODO: Future extensions could include:
    // - Metadata URI management
    // - Batch minting optimization
    // - Transfer restrictions based on event rules
}
