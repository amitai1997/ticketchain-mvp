// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISimpleMarketplace
 * @notice Interface for the SimpleMarketplace contract
 * @dev Minimal peer-to-peer marketplace for primary and capped secondary ticket sales
 */
interface ISimpleMarketplace {
    /**
     * @notice Listing data structure
     * @param seller Address of the ticket seller
     * @param price Listed price in wei
     * @param isActive Whether the listing is active
     */
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    /**
     * @notice Emitted when a ticket is listed for sale
     * @param tokenId The ID of the listed ticket
     * @param seller The address listing the ticket
     * @param price The listing price
     */
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);

    /**
     * @notice Emitted when a ticket is sold
     * @param tokenId The ID of the sold ticket
     * @param seller The address that sold the ticket
     * @param buyer The address that bought the ticket
     * @param price The sale price
     */
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    /**
     * @notice Emitted when a listing is cancelled
     * @param tokenId The ID of the ticket
     */
    event ListingCancelled(uint256 indexed tokenId);

    /**
     * @notice Emitted when the marketplace fee is updated
     * @param newFeeBps The new fee in basis points
     */
    event MarketplaceFeeUpdated(uint256 newFeeBps);

    /**
     * @notice Emitted when a resale cap is set for an event
     * @param eventId The ID of the event
     * @param maxMarkupPct The maximum markup percentage allowed
     */
    event ResaleCapSet(uint256 indexed eventId, uint256 maxMarkupPct);

    /**
     * @notice List a ticket for sale
     * @param tokenId The ID of the ticket to list
     * @param price The listing price in wei
     */
    function listForSale(uint256 tokenId, uint256 price) external;

    /**
     * @notice Buy a listed ticket
     * @param tokenId The ID of the ticket to buy
     */
    function buy(uint256 tokenId) external payable;

    /**
     * @notice Cancel a listing
     * @param tokenId The ID of the ticket to delist
     */
    function cancelListing(uint256 tokenId) external;

    /**
     * @notice Set the maximum resale markup percentage for an event
     * @param eventId The ID of the event
     * @param maxMarkupPct Maximum markup percentage (e.g., 10 for 10%)
     */
    function setResaleCap(uint256 eventId, uint256 maxMarkupPct) external;

    /**
     * @notice Get listing information
     * @param tokenId The ID of the ticket
     * @return Listing data
     */
    function listings(uint256 tokenId) external view returns (Listing memory);

    /**
     * @notice Get the platform fee in basis points
     * @return The platform fee in basis points
     */
    function platformFeeBps() external view returns (uint256);

    /**
     * @notice Get the resale cap for an event
     * @param eventId The ID of the event
     * @return The maximum markup percentage allowed
     */
    function resaleCaps(uint256 eventId) external view returns (uint256);
}
