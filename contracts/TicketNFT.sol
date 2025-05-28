// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITicketNFT.sol";
import "./interfaces/IEventRegistry.sol";

/**
 * @title TicketNFT
 * @notice Core NFT contract for event tickets
 * @dev Implements ERC721 with custom ticket-specific functionality
 */
contract TicketNFT is ERC721, Ownable, ITicketNFT {
    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Reference to the EventRegistry contract
    IEventRegistry public immutable eventRegistry;

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
        require(_eventRegistry != address(0), "Invalid registry address");
        eventRegistry = IEventRegistry(_eventRegistry);
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
        require(eventRegistry.isMinter(msg.sender), "Not authorized minter");

        // Get event data to validate
        IEventRegistry.EventData memory eventData = eventRegistry.events(eventId);
        require(eventData.ipfsHash != bytes32(0), "Event does not exist");
        require(!eventData.isPaused, "Event is paused");

        // Check if seat is already taken for this event
        require(_eventSeatToToken[eventId][seatId] == 0, "Seat already minted");

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
        require(_isAuthorized(msg.sender, address(0), tokenId), "Not owner or approved");
        
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
        require(_exists(tokenId), "Token does not exist");
        return _tokenToEvent[tokenId];
    }

    /**
     * @notice Get the seat ID associated with a ticket
     * @param tokenId The ID of the ticket
     * @return seatId The seat ID
     */
    function seatOf(uint256 tokenId) external view returns (uint256 seatId) {
        require(_exists(tokenId), "Token does not exist");
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
