// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ITicketNFT
 * @notice Interface for the TicketNFT contract
 * @dev Core asset contract that mints unique non-fungible tokens for event tickets
 */
interface ITicketNFT is IERC721 {
    /**
     * @notice Emitted when a new ticket is minted
     * @param to The address receiving the ticket
     * @param tokenId The ID of the minted ticket
     * @param eventId The ID of the event this ticket belongs to
     * @param seatId The seat ID for this ticket
     */
    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 indexed eventId, uint256 seatId);

    /**
     * @notice Emitted when a ticket is burned
     * @param tokenId The ID of the burned ticket
     */
    event TicketBurned(uint256 indexed tokenId);

    /**
     * @notice Mint a new ticket NFT
     * @param to The address to mint the ticket to
     * @param eventId The ID of the event
     * @param seatId The seat ID for this ticket
     * @return tokenId The ID of the newly minted ticket
     */
    function mintTicket(address to, uint256 eventId, uint256 seatId) external returns (uint256 tokenId);

    /**
     * @notice Burn a ticket (for cancelled events)
     * @param tokenId The ID of the ticket to burn
     */
    function burn(uint256 tokenId) external;

    /**
     * @notice Get the event ID associated with a ticket
     * @param tokenId The ID of the ticket
     * @return eventId The ID of the event
     */
    function eventOf(uint256 tokenId) external view returns (uint256 eventId);
}
