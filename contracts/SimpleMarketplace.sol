// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISimpleMarketplace} from "./interfaces/ISimpleMarketplace.sol";
import {ITicketNFT} from "./interfaces/ITicketNFT.sol";
import {IEventRegistry} from "./interfaces/IEventRegistry.sol";

/**
 * @title SimpleMarketplace
 * @notice Minimal marketplace for primary and secondary ticket sales
 * @dev Enforces price caps and platform fees for ticket resales
 */
contract SimpleMarketplace is Ownable, ReentrancyGuard, ISimpleMarketplace {
    // Custom errors
    error InvalidTicketNFTAddress();
    error InvalidRegistryAddress();
    error PlatformFeeTooHigh();
    error PriceMustBeGreaterThanZero();
    error NotTicketOwner();
    error PriceExceedsResaleCap();
    error MarketplaceNotApproved();
    error ListingNotActive();
    error IncorrectPaymentAmount();
    error SellerNoLongerOwnsTicket();
    error FailedToSendProceeds();
    error NotSeller();
    error EventDoesNotExist();
    error NotAuthorizedToSetResaleCap();
    error MarkupExceedsLimit();
    error NoFeesToWithdraw();
    error FailedToWithdrawFees();

    // Reference to TicketNFT contract
    ITicketNFT public immutable TICKET_NFT;

    // Reference to EventRegistry contract
    IEventRegistry public immutable EVENT_REGISTRY;

    // Platform fee in basis points (100 = 1%)
    uint256 public immutable override PLATFORM_FEE_BPS;

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
        if (_ticketNFT == address(0)) revert InvalidTicketNFTAddress();
        if (_eventRegistry == address(0)) revert InvalidRegistryAddress();
        if (_platformFeeBps > MAX_PLATFORM_FEE) revert PlatformFeeTooHigh();

        TICKET_NFT = ITicketNFT(_ticketNFT);
        EVENT_REGISTRY = IEventRegistry(_eventRegistry);
        PLATFORM_FEE_BPS = _platformFeeBps;
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
        if (price == 0) revert PriceMustBeGreaterThanZero();
        if (TICKET_NFT.ownerOf(tokenId) != msg.sender) revert NotTicketOwner();

        // Get event ID for this ticket
        uint256 eventId = TICKET_NFT.eventOf(tokenId);

        // If this is the first listing for this event, set face value
        if (eventFaceValues[eventId] == 0) {
            eventFaceValues[eventId] = price;
        } else {
            // For secondary sales, check resale cap if set
            uint256 maxMarkup = resaleCaps[eventId];
            if (maxMarkup > 0) {
                uint256 maxPrice = eventFaceValues[eventId] * (100 + maxMarkup) / 100;
                if (price > maxPrice) revert PriceExceedsResaleCap();
            }
        }

        // Ensure marketplace is approved to transfer the ticket
        if (TICKET_NFT.getApproved(tokenId) != address(this) &&
            !TICKET_NFT.isApprovedForAll(msg.sender, address(this))) {
            revert MarketplaceNotApproved();
        }

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
        if (!listing.isActive) revert ListingNotActive();
        if (msg.value != listing.price) revert IncorrectPaymentAmount();
        if (TICKET_NFT.ownerOf(tokenId) != listing.seller) revert SellerNoLongerOwnsTicket();

        // Mark listing as inactive
        listing.isActive = false;

        // Calculate platform fee
        uint256 platformFee = (listing.price * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerProceeds = listing.price - platformFee;

        // Accumulate platform fees
        accumulatedFees += platformFee;

        // Transfer ticket to buyer
        TICKET_NFT.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer proceeds to seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        if (!success) revert FailedToSendProceeds();

        emit TicketSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @notice Cancel a listing
     * @param tokenId The ID of the ticket to delist
     */
    function cancelListing(uint256 tokenId) external override {
        Listing storage listing = _listings[tokenId];
        if (!listing.isActive) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

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
        IEventRegistry.EventData memory eventData = EVENT_REGISTRY.events(eventId);
        if (eventData.ipfsHash == bytes32(0)) revert EventDoesNotExist();
        if (msg.sender != eventData.creator && msg.sender != owner())
            revert NotAuthorizedToSetResaleCap();
        if (maxMarkupPct > 100) revert MarkupExceedsLimit();

        resaleCaps[eventId] = maxMarkupPct;
        emit ResaleCapSet(eventId, maxMarkupPct);
    }

    /**
     * @notice Withdraw accumulated platform fees
     * @dev Only owner can withdraw
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert NoFeesToWithdraw();

        accumulatedFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert FailedToWithdrawFees();
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
        emit ListingCancelled(0); // Placeholder event to avoid empty block warning
    }

    // TODO: Future extensions could include:
    // - Dutch auction pricing
    // - Bundle sales
    // - Time-based pricing strategies
    // - Integration with external pricing oracles
}
