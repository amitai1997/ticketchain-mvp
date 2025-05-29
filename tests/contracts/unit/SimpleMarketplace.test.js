const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("SimpleMarketplace", function () {
  let marketplace, ticketNFT, eventRegistry;
  let owner, artist, buyer, buyer2, platform;
  let eventData, eventId;

  beforeEach(async function () {
    const fixture = await deployFixture();
    marketplace = fixture.marketplace;
    ticketNFT = fixture.ticketNFT;
    eventRegistry = fixture.eventRegistry;
    owner = fixture.owner;
    artist = fixture.artist;
    buyer = fixture.buyer;
    buyer2 = fixture.buyer2;
    platform = fixture.platform;
    eventData = fixture.eventData;
    
    // Create event and set marketplace
    eventId = await createEvent(eventRegistry, eventData);
    await ticketNFT.setMarketplace(marketplace.address);
    await marketplace.setTicketNFT(ticketNFT.address);
    await marketplace.setPlatformFee(250); // 2.5%
    await marketplace.setPlatformAddress(platform.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should start with listing counter at 0", async function () {
      expect(await marketplace.listingCounter()).to.equal(0);
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to set TicketNFT address", async function () {
      const newAddress = buyer.address; // Mock address
      await marketplace.setTicketNFT(newAddress);
      expect(await marketplace.ticketNFT()).to.equal(newAddress);
    });

    it("Should allow owner to set platform fee", async function () {
      await marketplace.setPlatformFee(300); // 3%
      expect(await marketplace.platformFee()).to.equal(300);
    });

    it("Should revert if platform fee exceeds 5%", async function () {
      await expect(marketplace.setPlatformFee(600)) // 6%
        .to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to set platform address", async function () {
      await marketplace.setPlatformAddress(buyer.address);
      expect(await marketplace.platformAddress()).to.equal(buyer.address);
    });

    it("Should revert if non-owner tries to configure", async function () {
      await expect(
        marketplace.connect(buyer).setTicketNFT(buyer.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Listing Creation", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint ticket to buyer
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      // Approve marketplace
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
    });

    it("Should create listing with correct parameters", async function () {
      const price = ethers.utils.parseEther("0.11"); // Max allowed price
      
      await marketplace.connect(buyer).createListing(tokenId, price);
      
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });

    it("Should emit ListingCreated event", async function () {
      const price = ethers.utils.parseEther("0.1");
      
      await expect(marketplace.connect(buyer).createListing(tokenId, price))
        .to.emit(marketplace, "ListingCreated")
        .withArgs(1, tokenId, buyer.address, price);
    });

    it("Should increment listing counter", async function () {
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      expect(await marketplace.listingCounter()).to.equal(1);
    });

    it("Should revert if price exceeds max resale price", async function () {
      const price = ethers.utils.parseEther("0.12"); // Above 10% markup
      
      await expect(
        marketplace.connect(buyer).createListing(tokenId, price)
      ).to.be.revertedWith("Price exceeds max resale price");
    });

    it("Should revert if seller doesn't own the token", async function () {
      await expect(
        marketplace.connect(buyer2).createListing(tokenId, ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Not token owner");
    });

    it("Should revert if marketplace not approved", async function () {
      await ticketNFT.connect(buyer).approve(ethers.constants.AddressZero, tokenId);
      
      await expect(
        marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Marketplace not approved");
    });
  });

  describe("Purchasing", function () {
    let tokenId;
    let listingId;
    const listingPrice = ethers.utils.parseEther("0.1");

    beforeEach(async function () {
      // Setup: mint, approve, and list
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, listingPrice);
      listingId = 1;
    });

    it("Should transfer ticket to buyer on purchase", async function () {
      await marketplace.connect(buyer2).purchaseListing(listingId, { value: listingPrice });
      
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer2.address);
    });

    it("Should mark listing as inactive after purchase", async function () {
      await marketplace.connect(buyer2).purchaseListing(listingId, { value: listingPrice });
      
      const listing = await marketplace.getListing(listingId);
      expect(listing.isActive).to.be.false;
    });

    it("Should emit ListingPurchased event", async function () {
      await expect(
        marketplace.connect(buyer2).purchaseListing(listingId, { value: listingPrice })
      )
        .to.emit(marketplace, "ListingPurchased")
        .withArgs(listingId, tokenId, buyer2.address, listingPrice);
    });

    it("Should distribute funds correctly", async function () {
      // Track initial balances
      const sellerInitial = await buyer.getBalance();
      const artistInitial = await artist.getBalance();
      const platformInitial = await platform.getBalance();
      
      // Purchase
      await marketplace.connect(buyer2).purchaseListing(listingId, { value: listingPrice });
      
      // Calculate expected distributions
      const royalty = listingPrice.mul(eventData.royaltyPercentage).div(10000); // 5%
      const platformCut = listingPrice.mul(250).div(10000); // 2.5%
      const sellerAmount = listingPrice.sub(royalty).sub(platformCut);
      
      // Check balances
      expect(await buyer.getBalance()).to.equal(sellerInitial.add(sellerAmount));
      expect(await artist.getBalance()).to.equal(artistInitial.add(royalty));
      expect(await platform.getBalance()).to.equal(platformInitial.add(platformCut));
    });

    it("Should revert if payment is insufficient", async function () {
      const insufficientPayment = listingPrice.sub(1);
      
      await expect(
        marketplace.connect(buyer2).purchaseListing(listingId, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if listing is not active", async function () {
      // First purchase
      await marketplace.connect(buyer2).purchaseListing(listingId, { value: listingPrice });
      
      // Try to purchase again
      await expect(
        marketplace.connect(owner).purchaseListing(listingId, { value: listingPrice })
      ).to.be.revertedWith("Listing not active");
    });

    it("Should revert if buyer tries to buy own listing", async function () {
      await expect(
        marketplace.connect(buyer).purchaseListing(listingId, { value: listingPrice })
      ).to.be.revertedWith("Cannot buy own listing");
    });

    it("Should refund excess payment", async function () {
      const excessPayment = listingPrice.add(ethers.utils.parseEther("0.1"));
      const buyerInitial = await buyer2.getBalance();
      
      const tx = await marketplace.connect(buyer2).purchaseListing(listingId, { 
        value: excessPayment 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Buyer should only spend listing price + gas
      const buyerFinal = await buyer2.getBalance();
      expect(buyerInitial.sub(buyerFinal)).to.equal(listingPrice.add(gasUsed));
    });
  });

  describe("Listing Cancellation", function () {
    let tokenId;
    let listingId;

    beforeEach(async function () {
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      listingId = 1;
    });

    it("Should allow seller to cancel listing", async function () {
      await marketplace.connect(buyer).cancelListing(listingId);
      
      const listing = await marketplace.getListing(listingId);
      expect(listing.isActive).to.be.false;
    });

    it("Should emit ListingCancelled event", async function () {
      await expect(marketplace.connect(buyer).cancelListing(listingId))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(listingId);
    });

    it("Should revert if non-seller tries to cancel", async function () {
      await expect(
        marketplace.connect(buyer2).cancelListing(listingId)
      ).to.be.revertedWith("Not the seller");
    });

    it("Should revert if listing already inactive", async function () {
      await marketplace.connect(buyer).cancelListing(listingId);
      
      await expect(
        marketplace.connect(buyer).cancelListing(listingId)
      ).to.be.revertedWith("Listing not active");
    });
  });

  describe("View Functions", function () {
    it("Should return active listings", async function () {
      // Create multiple listings
      const [token1, token2] = await mintTickets(ticketNFT, eventId, [1, 2], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, token1);
      await ticketNFT.connect(buyer).approve(marketplace.address, token2);
      
      await marketplace.connect(buyer).createListing(token1, ethers.utils.parseEther("0.1"));
      await marketplace.connect(buyer).createListing(token2, ethers.utils.parseEther("0.11"));
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(2);
      expect(activeListings[0]).to.equal(1);
      expect(activeListings[1]).to.equal(2);
    });

    it("Should return listings by seller", async function () {
      const [token1] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      const [token2] = await mintTickets(ticketNFT, eventId, [2], buyer2.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, token1);
      await ticketNFT.connect(buyer2).approve(marketplace.address, token2);
      
      await marketplace.connect(buyer).createListing(token1, ethers.utils.parseEther("0.1"));
      await marketplace.connect(buyer2).createListing(token2, ethers.utils.parseEther("0.1"));
      
      const buyerListings = await marketplace.getListingsBySeller(buyer.address);
      expect(buyerListings.length).to.equal(1);
      expect(buyerListings[0]).to.equal(1);
    });

    it("Should return correct listing details", async function () {
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      
      const price = ethers.utils.parseEther("0.105");
      await marketplace.connect(buyer).createListing(tokenId, price);
      
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause marketplace", async function () {
      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;
    });

    it("Should prevent listing creation when paused", async function () {
      await marketplace.pause();
      
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      
      await expect(
        marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should prevent purchases when paused", async function () {
      // Create listing first
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Pause marketplace
      await marketplace.pause();
      
      await expect(
        marketplace.connect(buyer2).purchaseListing(1, { value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause", async function () {
      await marketplace.pause();
      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });
  });
});
