// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/ISimpleMarketplace.sol";
import "./interfaces/ITicketNFT.sol";
import "./interfaces/IEventRegistry.sol";

/**
 * @title SimpleMarketplace
 * @notice Minimal marketplace for primary and secondary ticket sales
 * @dev Enforces price caps and platform fees for ticket resales
 */
contract SimpleMarketplace is Ownable, ReentrancyGuard, ISimpleMarketplace {
    // Reference to TicketNFT contract
    ITicketNFT public immutable ticketNFT;

    // Reference to EventRegistry contract
    IEventRegistry public immutable eventRegistry;

    // Platform fee in basis points (100 = 1%)
    uint256 public immutable override platformFeeBps;

    // Maximum platform fee allowed (10%)
    uint256 public constant MAX_PLATFORM_FEE = 1000;

    // Mapping from token ID to listing
    mapping(uint256 => Listing) private _listings;

    // Mapping from event ID to maximum resale markup percentage
    mapping(uint256 => uint256) public override resaleCaps;

    // Mapping from event ID to original face value (set on first listing)
    mapping(uint256 => uint256) public eventFaceValues;

    // Accumulated platform fees
    uint256 public accumulatedFees;

    /**
     * @notice Constructor
     * @param _ticketNFT Address of the TicketNFT contract
     * @param _eventRegistry Address of the EventRegistry contract
     * @param _platformFeeBps Platform fee in basis points
     */
    constructor(
        address _ticketNFT,
        address _eventRegistry,
        uint256 _platformFeeBps
    ) Ownable(msg.sender) {
        require(_ticketNFT != address(0), "Invalid ticket NFT address");
        require(_eventRegistry != address(0), "Invalid registry address");
        require(_platformFeeBps <= MAX_PLATFORM_FEE, "Platform fee too high");

        ticketNFT = ITicketNFT(_ticketNFT);
        eventRegistry = IEventRegistry(_eventRegistry);
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @notice Get listing data
     * @param tokenId The ID of the token
     * @return Listing data struct
     */
    function listings(uint256 tokenId) external view override returns (Listing memory) {
        return _listings[tokenId];
    }

    /**
     * @notice List a ticket for sale
     * @param tokenId The ID of the ticket to list
     * @param price The listing price in wei
     */
    function listForSale(uint256 tokenId, uint256 price) external override {
        require(price > 0, "Price must be greater than 0");
        require(ticketNFT.ownerOf(tokenId) == msg.sender, "Not ticket owner");

        // Get event ID for this ticket
        uint256 eventId = ticketNFT.eventOf(tokenId);

        // If this is the first listing for this event, set face value
        if (eventFaceValues[eventId] == 0) {
            eventFaceValues[eventId] = price;
        } else {
            // For secondary sales, check resale cap if set
            uint256 maxMarkup = resaleCaps[eventId];
            if (maxMarkup > 0) {
                uint256 maxPrice = eventFaceValues[eventId] * (100 + maxMarkup) / 100;
                require(price <= maxPrice, "Price exceeds resale cap");
            }
        }

        // Ensure marketplace is approved to transfer the ticket
        require(
            ticketNFT.getApproved(tokenId) == address(this) ||
            ticketNFT.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit TicketListed(tokenId, msg.sender, price);
    }

    /**
     * @notice Buy a listed ticket
     * @param tokenId The ID of the ticket to buy
     */
    function buy(uint256 tokenId) external payable override nonReentrant {
        Listing storage listing = _listings[tokenId];
        require(listing.isActive, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        require(ticketNFT.ownerOf(tokenId) == listing.seller, "Seller no longer owns ticket");

        // Mark listing as inactive
        listing.isActive = false;

        // Calculate platform fee
        uint256 platformFee = (listing.price * platformFeeBps) / 10000;
        uint256 sellerProceeds = listing.price - platformFee;

        // Accumulate platform fees
        accumulatedFees += platformFee;

        // Transfer ticket to buyer
        ticketNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer proceeds to seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        require(success, "Failed to send proceeds to seller");

        emit TicketSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @notice Cancel a listing
     * @param tokenId The ID of the ticket to delist
     */
    function cancelListing(uint256 tokenId) external override {
        Listing storage listing = _listings[tokenId];
        require(listing.isActive, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.isActive = false;
        emit ListingCancelled(tokenId);
    }

    /**
     * @notice Set the maximum resale markup percentage for an event
     * @dev Only event creator or contract owner can set
     * @param eventId The ID of the event
     * @param maxMarkupPct Maximum markup percentage (e.g., 10 for 10%)
     */
    function setResaleCap(uint256 eventId, uint256 maxMarkupPct) external override {
        IEventRegistry.EventData memory eventData = eventRegistry.events(eventId);
        require(eventData.ipfsHash != bytes32(0), "Event does not exist");
        require(
            msg.sender == eventData.creator || msg.sender == owner(),
            "Not authorized to set resale cap"
        );
        require(maxMarkupPct <= 100, "Markup cannot exceed 100%");

        resaleCaps[eventId] = maxMarkupPct;
        emit ResaleCapSet(eventId, maxMarkupPct);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @dev Only owner can withdraw
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed to withdraw fees");
    }

    /**
     * @notice Get the current accumulated fees
     * @return The amount of fees accumulated
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    /**
     * @notice Emergency pause - remove all listings
     * @dev Only owner can call in case of emergency
     */
    function emergencyDelistAll() external onlyOwner {
        // TODO: Implement emergency delisting with proper iteration
        // This would require maintaining a list of active listings
    }

    // TODO: Future extensions could include:
    // - Dutch auction pricing
    // - Bundle sales
    // - Time-based pricing strategies
    // - Integration with external pricing oracles
}
