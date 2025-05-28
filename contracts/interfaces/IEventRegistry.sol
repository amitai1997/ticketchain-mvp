// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEventRegistry
 * @notice Interface for the EventRegistry contract
 * @dev Lightweight registry that records immutable event metadata and manages minting permissions
 */
interface IEventRegistry {
    /**
     * @notice Event data structure
     * @param ipfsHash IPFS hash containing event metadata
     * @param maxSupply Maximum number of tickets for this event
     * @param isPaused Whether the event is paused
     * @param creator Address that created the event
     */
    struct EventData {
        bytes32 ipfsHash;
        uint256 maxSupply;
        bool isPaused;
        address creator;
    }

    /**
     * @notice Emitted when a new event is created
     * @param eventId The ID of the created event
     * @param creator The address that created the event
     * @param ipfsHash IPFS hash containing event metadata
     * @param maxSupply Maximum ticket supply for the event
     */
    event EventCreated(uint256 indexed eventId, address indexed creator, bytes32 ipfsHash, uint256 maxSupply);

    /**
     * @notice Emitted when a minter's permission is updated
     * @param minter The address whose permission was updated
     * @param allowed Whether the minter is allowed to mint
     */
    event MinterUpdated(address indexed minter, bool allowed);

    /**
     * @notice Emitted when an event is paused or unpaused
     * @param eventId The ID of the event
     * @param isPaused Whether the event is paused
     */
    event EventPaused(uint256 indexed eventId, bool isPaused);

    /**
     * @notice Create a new event
     * @param ipfsHash IPFS hash containing event metadata
     * @param maxSupply Maximum number of tickets for this event
     * @return eventId The ID of the created event
     */
    function createEvent(bytes32 ipfsHash, uint256 maxSupply) external returns (uint256 eventId);

    /**
     * @notice Set minter permissions
     * @param minter The address to update permissions for
     * @param allowed Whether the minter should be allowed to mint
     */
    function setMinter(address minter, bool allowed) external;

    /**
     * @notice Pause or unpause an event
     * @param eventId The ID of the event to pause/unpause
     */
    function pauseEvent(uint256 eventId) external;

    /**
     * @notice Get event data
     * @param eventId The ID of the event
     * @return Event data structure
     */
    function events(uint256 eventId) external view returns (EventData memory);

    /**
     * @notice Check if an address is an authorized minter
     * @param minter The address to check
     * @return Whether the address is an authorized minter
     */
    function isMinter(address minter) external view returns (bool);
}
