const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("Full Flow Integration Tests", function () {
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
    
    // Configure marketplace
    await ticketNFT.setMarketplace(marketplace.address);
    await marketplace.setTicketNFT(ticketNFT.address);
    await marketplace.setPlatformFee(250); // 2.5%
    await marketplace.setPlatformAddress(platform.address);
  });

  describe("Complete Ticket Lifecycle", function () {
    it("Should complete full flow: create event → mint → list → purchase", async function () {
      // Step 1: Create event
      console.log("      Step 1: Creating event...");
      eventId = await createEvent(eventRegistry, eventData);
      expect(eventId).to.equal(1);

      // Step 2: Mint ticket
      console.log("      Step 2: Minting ticket...");
      const seatNumber = 42;
      const [tokenId] = await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer.address);

      // Step 3: List ticket on marketplace
      console.log("      Step 3: Listing ticket...");
      const listingPrice = ethers.utils.parseEther("0.11"); // 10% markup
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, listingPrice);
      
      const listing = await marketplace.getListing(1);
      expect(listing.isActive).to.be.true;

      // Step 4: Purchase ticket
      console.log("      Step 4: Purchasing ticket...");
      const buyer2InitialBalance = await buyer2.getBalance();
      
      const tx = await marketplace.connect(buyer2).purchaseListing(1, { 
        value: listingPrice 
      });
      const receipt = await tx.wait();
      
      // Verify ownership transfer
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer2.address);
      
      // Verify listing is inactive
      const updatedListing = await marketplace.getListing(1);
      expect(updatedListing.isActive).to.be.false;
      
      // Verify funds distribution happened
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const buyer2FinalBalance = await buyer2.getBalance();
      const totalSpent = buyer2InitialBalance.sub(buyer2FinalBalance);
      expect(totalSpent).to.equal(listingPrice.add(gasUsed));
    });

    it("Should handle multiple tickets and listings", async function () {
      // Create event
      eventId = await createEvent(eventRegistry, eventData);
      
      // Mint multiple tickets
      const seatNumbers = [1, 2, 3, 4, 5];
      const tokenIds = await mintTickets(ticketNFT, eventId, seatNumbers, buyer.address);
      
      // List all tickets
      for (let i = 0; i < tokenIds.length; i++) {
        await ticketNFT.connect(buyer).approve(marketplace.address, tokenIds[i]);
        const price = ethers.utils.parseEther("0.1").add(
          ethers.utils.parseEther("0.002").mul(i) // Slight price variation
        );
        await marketplace.connect(buyer).createListing(tokenIds[i], price);
      }
      
      // Verify all listings are active
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(5);
      
      // Purchase some tickets
      await marketplace.connect(buyer2).purchaseListing(1, { 
        value: await (await marketplace.getListing(1)).price 
      });
      await marketplace.connect(buyer2).purchaseListing(3, { 
        value: await (await marketplace.getListing(3)).price 
      });
      
      // Verify ownership changes
      expect(await ticketNFT.ownerOf(tokenIds[0])).to.equal(buyer2.address);
      expect(await ticketNFT.ownerOf(tokenIds[2])).to.equal(buyer2.address);
      expect(await ticketNFT.ownerOf(tokenIds[1])).to.equal(buyer.address);
      
      // Verify active listings updated
      const remainingListings = await marketplace.getActiveListings();
      expect(remainingListings.length).to.equal(3);
    });
  });

  describe("Access Control Integration", function () {
    it("Should enforce minting permissions across contracts", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Non-authorized user cannot mint
      await expect(
        ticketNFT.connect(buyer).mintTicket(eventId, buyer.address, 1, "")
      ).to.be.revertedWith("Not authorized to mint");
      
      // Authorize user
      await eventRegistry.setAuthorizedMinter(buyer.address, true);
      
      // Now they can mint
      await expect(
        ticketNFT.connect(buyer).mintTicket(eventId, buyer.address, 1, "")
      ).to.not.be.reverted;
    });

    it("Should respect event pause status", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Pause event
      await eventRegistry.pauseEvent(eventId);
      
      // Cannot mint for paused event
      await expect(
        ticketNFT.mintTicket(eventId, buyer.address, 1, "")
      ).to.be.revertedWith("Event is not active");
    });
  });

  describe("Price Cap Enforcement", function () {
    it("Should enforce price caps throughout the system", async function () {
      // Create event with specific price cap
      const customEventData = {
        ...eventData,
        pricePerTicket: ethers.utils.parseEther("1"),
        maxResalePrice: ethers.utils.parseEther("1.05") // Only 5% markup allowed
      };
      
      eventId = await createEvent(eventRegistry, customEventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      
      // Should accept price at cap
      await expect(
        marketplace.connect(buyer).createListing(tokenId, customEventData.maxResalePrice)
      ).to.not.be.reverted;
      
      // Cancel that listing
      await marketplace.connect(buyer).cancelListing(1);
      
      // Should reject price above cap
      const aboveCap = ethers.utils.parseEther("1.06");
      await expect(
        marketplace.connect(buyer).createListing(tokenId, aboveCap)
      ).to.be.revertedWith("Price exceeds max resale price");
    });
  });

  describe("Royalty Distribution", function () {
    it("Should correctly distribute royalties to artist", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      // List and sell ticket
      const resalePrice = ethers.utils.parseEther("0.11");
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, resalePrice);
      
      // Track artist balance
      const artistInitial = await artist.getBalance();
      
      // Purchase
      await marketplace.connect(buyer2).purchaseListing(1, { value: resalePrice });
      
      // Calculate expected royalty (5%)
      const expectedRoyalty = resalePrice.mul(eventData.royaltyPercentage).div(10000);
      
      // Verify artist received royalty
      const artistFinal = await artist.getBalance();
      expect(artistFinal.sub(artistInitial)).to.equal(expectedRoyalty);
    });

    it("Should handle zero royalty events", async function () {
      const zeroRoyaltyEvent = {
        ...eventData,
        royaltyPercentage: 0
      };
      
      eventId = await createEvent(eventRegistry, zeroRoyaltyEvent);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      const resalePrice = ethers.utils.parseEther("0.11");
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, resalePrice);
      
      const artistInitial = await artist.getBalance();
      await marketplace.connect(buyer2).purchaseListing(1, { value: resalePrice });
      const artistFinal = await artist.getBalance();
      
      // Artist should receive nothing
      expect(artistFinal).to.equal(artistInitial);
    });
  });

  describe("Emergency Scenarios", function () {
    it("Should handle marketplace pause during active listings", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      // Create listing
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Pause marketplace
      await marketplace.pause();
      
      // Cannot purchase
      await expect(
        marketplace.connect(buyer2).purchaseListing(1, { 
          value: ethers.utils.parseEther("0.1") 
        })
      ).to.be.revertedWith("Pausable: paused");
      
      // Cannot create new listings
      const [tokenId2] = await mintTickets(ticketNFT, eventId, [2], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId2);
      
      await expect(
        marketplace.connect(buyer).createListing(tokenId2, ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Pausable: paused");
      
      // Unpause and verify functionality restored
      await marketplace.unpause();
      
      await expect(
        marketplace.connect(buyer2).purchaseListing(1, { 
          value: ethers.utils.parseEther("0.1") 
        })
      ).to.not.be.reverted;
    });

    it("Should handle transfer pause in TicketNFT", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      // Pause transfers
      await ticketNFT.setTransfersPaused(true);
      
      // Direct transfer should fail
      await expect(
        ticketNFT.connect(buyer).transferFrom(buyer.address, buyer2.address, tokenId)
      ).to.be.revertedWith("Transfers paused");
      
      // But marketplace transfers should still work
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      await expect(
        marketplace.connect(buyer2).purchaseListing(1, { 
          value: ethers.utils.parseEther("0.1") 
        })
      ).to.not.be.reverted;
      
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer2.address);
    });
  });

  describe("Data Consistency", function () {
    it("Should maintain consistent state across all contracts", async function () {
      // Create multiple events
      const event1 = await createEvent(eventRegistry, eventData);
      const event2 = await createEvent(eventRegistry, { 
        ...eventData, 
        name: "Test Concert 2" 
      });
      
      // Mint tickets for both events
      const [token1] = await mintTickets(ticketNFT, event1, [1], buyer.address);
      const [token2] = await mintTickets(ticketNFT, event2, [1], buyer.address);
      
      // Verify ticket info matches event data
      const ticket1Info = await ticketNFT.getTicketInfo(token1);
      const ticket2Info = await ticketNFT.getTicketInfo(token2);
      
      expect(ticket1Info.eventId).to.equal(event1);
      expect(ticket2Info.eventId).to.equal(event2);
      expect(ticket1Info.seatNumber).to.equal(ticket2Info.seatNumber); // Same seat, different events
      
      // List both tickets
      await ticketNFT.connect(buyer).approve(marketplace.address, token1);
      await ticketNFT.connect(buyer).approve(marketplace.address, token2);
      
      await marketplace.connect(buyer).createListing(token1, ethers.utils.parseEther("0.1"));
      await marketplace.connect(buyer).createListing(token2, ethers.utils.parseEther("0.105"));
      
      // Verify marketplace respects individual event price caps
      const listing1 = await marketplace.getListing(1);
      const listing2 = await marketplace.getListing(2);
      
      const event1Data = await eventRegistry.getEvent(event1);
      const event2Data = await eventRegistry.getEvent(event2);
      
      expect(listing1.price).to.be.lte(event1Data.maxResalePrice);
      expect(listing2.price).to.be.lte(event2Data.maxResalePrice);
    });
  });
});
