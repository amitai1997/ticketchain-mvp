// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IEventRegistry.sol";

/**
 * @title EventRegistry
 * @notice Registry for event metadata and minting permissions
 * @dev Manages event creation, minter authorization, and event state
 */
contract EventRegistry is Ownable, IEventRegistry {
    // Counter for event IDs
    uint256 private _eventIdCounter;

    // Mapping from event ID to event data
    mapping(uint256 => EventData) private _events;

    // Mapping of authorized minters
    mapping(address => bool) private _minters;

    constructor() Ownable(msg.sender) {
        // No initialization needed
    }

    /**
     * @notice Create a new event
     * @param ipfsHash IPFS hash containing event metadata
     * @param maxSupply Maximum number of tickets for this event
     * @return eventId The ID of the created event
     */
    function createEvent(bytes32 ipfsHash, uint256 maxSupply) external override returns (uint256 eventId) {
        require(ipfsHash != bytes32(0), "Invalid IPFS hash");
        require(maxSupply > 0, "Max supply must be greater than 0");

        // Increment counter and get new event ID
        _eventIdCounter++;
        eventId = _eventIdCounter;

        // Store event data
        _events[eventId] = EventData({
            ipfsHash: ipfsHash,
            maxSupply: maxSupply,
            isPaused: false,
            creator: msg.sender
        });

        emit EventCreated(eventId, msg.sender, ipfsHash, maxSupply);
    }

    /**
     * @notice Set minter permissions
     * @dev Only owner can update minter permissions
     * @param minter The address to update permissions for
     * @param allowed Whether the minter should be allowed to mint
     */
    function setMinter(address minter, bool allowed) external override onlyOwner {
        require(minter != address(0), "Invalid minter address");
        _minters[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    /**
     * @notice Pause or unpause an event
     * @dev Only event creator or owner can pause/unpause
     * @param eventId The ID of the event to pause/unpause
     */
    function pauseEvent(uint256 eventId) external override {
        EventData storage eventData = _events[eventId];
        require(eventData.ipfsHash != bytes32(0), "Event does not exist");
        require(
            msg.sender == eventData.creator || msg.sender == owner(),
            "Not authorized to pause event"
        );

        eventData.isPaused = !eventData.isPaused;
        emit EventPaused(eventId, eventData.isPaused);
    }

    /**
     * @notice Check if an address is an authorized minter
     * @param minter The address to check
     * @return Whether the address is an authorized minter
     */
    function isMinter(address minter) external view override returns (bool) {
        return _minters[minter];
    }

    /**
     * @notice Get the total number of events created
     * @return The current event count
     */
    function eventCount() external view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @notice Update event metadata
     * @dev Only event creator or owner can update
     * @param eventId The ID of the event
     * @param newIpfsHash New IPFS hash for event metadata
     */
    function updateEventMetadata(uint256 eventId, bytes32 newIpfsHash) external {
        EventData storage eventData = _events[eventId];
        require(eventData.ipfsHash != bytes32(0), "Event does not exist");
        require(
            msg.sender == eventData.creator || msg.sender == owner(),
            "Not authorized to update event"
        );
        require(newIpfsHash != bytes32(0), "Invalid IPFS hash");

        eventData.ipfsHash = newIpfsHash;

        // TODO: Emit event for metadata update
    }

    /**
     * @notice Get event data
     * @param eventId The ID of the event
     * @return Event data struct
     */
    function events(uint256 eventId) external view override returns (EventData memory) {
        return _events[eventId];
    }

    // TODO: Future extensions could include:
    // - Event categories/tags
    // - Venue verification
    // - Multi-sig event creation
    // - Upgradeable configuration pointers
}
