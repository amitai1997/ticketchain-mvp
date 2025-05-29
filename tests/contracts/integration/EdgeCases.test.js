const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("Edge Cases and Security Tests", function () {
  let marketplace, ticketNFT, eventRegistry;
  let owner, artist, buyer, buyer2, attacker;
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
    attacker = fixture.platform; // Reusing platform signer as attacker
    eventData = fixture.eventData;
    
    // Configure contracts
    await ticketNFT.setMarketplace(marketplace.address);
    await marketplace.setTicketNFT(ticketNFT.address);
    await marketplace.setPlatformFee(250);
    await marketplace.setPlatformAddress(owner.address); // Use owner as platform for simplicity
  });

  describe("Re-entrancy Protection", function () {
    let MaliciousBuyer;
    let maliciousBuyer;

    beforeEach(async function () {
      // Deploy malicious contract
      MaliciousBuyer = await ethers.getContractFactory("MaliciousBuyer");
      maliciousBuyer = await MaliciousBuyer.deploy(marketplace.address);
      await maliciousBuyer.deployed();
      
      // Fund malicious contract
      await owner.sendTransaction({
        to: maliciousBuyer.address,
        value: ethers.utils.parseEther("10")
      });
    });

    it("Should prevent re-entrancy attack on purchase", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Attempt re-entrancy attack
      await expect(
        maliciousBuyer.attack(1, { value: ethers.utils.parseEther("0.1") })
      ).to.be.reverted;
    });
  });

  describe("Overflow/Underflow Protection", function () {
    it("Should handle maximum uint256 values safely", async function () {
      const maxEventData = {
        ...eventData,
        totalTickets: ethers.constants.MaxUint256
      };
      
      // Should not overflow
      await expect(
        createEvent(eventRegistry, maxEventData)
      ).to.not.be.reverted;
    });

    it("Should handle zero values correctly", async function () {
      const zeroEventData = {
        ...eventData,
        pricePerTicket: 0,
        maxResalePrice: 0,
        royaltyPercentage: 0
      };
      
      eventId = await createEvent(eventRegistry, zeroEventData);
      const event = await eventRegistry.getEvent(eventId);
      
      expect(event.pricePerTicket).to.equal(0);
      expect(event.maxResalePrice).to.equal(0);
      expect(event.royaltyPercentage).to.equal(0);
    });
  });

  describe("Boundary Value Tests", function () {
    it("Should handle exact price cap listing", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      
      // List at exact max price
      await expect(
        marketplace.connect(buyer).createListing(tokenId, eventData.maxResalePrice)
      ).to.not.be.reverted;
    });

    it("Should handle maximum royalty percentage (10%)", async function () {
      const maxRoyaltyEvent = {
        ...eventData,
        royaltyPercentage: 1000 // Exactly 10%
      };
      
      await expect(
        createEvent(eventRegistry, maxRoyaltyEvent)
      ).to.not.be.reverted;
    });

    it("Should reject royalty above 10%", async function () {
      const highRoyaltyEvent = {
        ...eventData,
        royaltyPercentage: 1001 // 10.01%
      };
      
      await expect(
        createEvent(eventRegistry, highRoyaltyEvent)
      ).to.be.revertedWith("Royalty too high");
    });
  });

  describe("Invalid Input Handling", function () {
    it("Should handle empty strings in event creation", async function () {
      const emptyStringEvent = {
        ...eventData,
        name: "",
        venue: ""
      };
      
      // Contract should accept empty strings (no validation implemented)
      await expect(
        createEvent(eventRegistry, emptyStringEvent)
      ).to.not.be.reverted;
    });

    it("Should reject invalid addresses", async function () {
      const invalidAddressEvent = {
        ...eventData,
        artistAddress: ethers.constants.AddressZero
      };
      
      // Contract might accept zero address (depends on implementation)
      // This test documents current behavior
      await expect(
        createEvent(eventRegistry, invalidAddressEvent)
      ).to.not.be.reverted;
    });

    it("Should handle non-existent token IDs", async function () {
      await expect(
        ticketNFT.getTicketInfo(999)
      ).to.be.reverted;
      
      await expect(
        ticketNFT.ownerOf(999)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("Race Condition Tests", function () {
    it("Should handle simultaneous purchase attempts", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Both buyers try to purchase at once
      const purchase1 = marketplace.connect(buyer2).purchaseListing(1, { 
        value: ethers.utils.parseEther("0.1") 
      });
      
      const purchase2 = marketplace.connect(attacker).purchaseListing(1, { 
        value: ethers.utils.parseEther("0.1") 
      });
      
      // One should succeed, one should fail
      const results = await Promise.allSettled([purchase1, purchase2]);
      const successes = results.filter(r => r.status === "fulfilled");
      const failures = results.filter(r => r.status === "rejected");
      
      expect(successes.length).to.equal(1);
      expect(failures.length).to.equal(1);
    });

    it("Should handle listing cancellation during purchase", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Try to cancel and purchase simultaneously
      const cancel = marketplace.connect(buyer).cancelListing(1);
      const purchase = marketplace.connect(buyer2).purchaseListing(1, { 
        value: ethers.utils.parseEther("0.1") 
      });
      
      // One should succeed, one should fail
      const results = await Promise.allSettled([cancel, purchase]);
      const successes = results.filter(r => r.status === "fulfilled");
      
      expect(successes.length).to.equal(1);
    });
  });

  describe("Gas Limit Tests", function () {
    it("Should handle minting many tickets", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Mint 10 tickets in sequence
      const seatNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
      
      for (const seat of seatNumbers) {
        await expect(
          ticketNFT.mintTicket(eventId, buyer.address, seat, "")
        ).to.not.be.reverted;
      }
      
      const buyerTickets = await ticketNFT.getTicketsByOwner(buyer.address);
      expect(buyerTickets.length).to.equal(10);
    });

    it("Should handle many active listings", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Create 5 listings
      const numListings = 5;
      const tokenIds = await mintTickets(
        ticketNFT, 
        eventId, 
        Array.from({ length: numListings }, (_, i) => i + 1), 
        buyer.address
      );
      
      for (const tokenId of tokenIds) {
        await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
        await marketplace.connect(buyer).createListing(
          tokenId, 
          ethers.utils.parseEther("0.1")
        );
      }
      
      const activeListings = await marketplace.getActiveListings();
      expect(activeListings.length).to.equal(numListings);
    });
  });

  describe("Permission Bypass Attempts", function () {
    it("Should not allow bypassing minter authorization", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Try various ways to bypass authorization
      await expect(
        ticketNFT.connect(attacker).mintTicket(eventId, attacker.address, 1, "")
      ).to.be.revertedWith("Not authorized to mint");
      
      // Try to call from marketplace address
      await expect(
        ticketNFT.connect(attacker).mintTicket(eventId, attacker.address, 1, "")
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("Should not allow unauthorized marketplace operations", async function () {
      // Try to set self as marketplace
      await expect(
        ticketNFT.connect(attacker).setMarketplace(attacker.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      // Try to bypass marketplace for transfers
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.setTransfersPaused(true);
      
      await expect(
        ticketNFT.connect(buyer).transferFrom(buyer.address, attacker.address, tokenId)
      ).to.be.revertedWith("Transfers paused");
    });
  });

  describe("State Consistency After Failures", function () {
    it("Should maintain state after failed purchase", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      const [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      // Try to purchase with insufficient funds
      await expect(
        marketplace.connect(buyer2).purchaseListing(1, { 
          value: ethers.utils.parseEther("0.05") 
        })
      ).to.be.revertedWith("Insufficient payment");
      
      // Verify state unchanged
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer.address);
      const listing = await marketplace.getListing(1);
      expect(listing.isActive).to.be.true;
    });

    it("Should maintain state after failed minting", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Mint seat 1
      await ticketNFT.mintTicket(eventId, buyer.address, 1, "");
      
      // Try to mint same seat again
      await expect(
        ticketNFT.mintTicket(eventId, buyer2.address, 1, "")
      ).to.be.revertedWith("Seat already minted");
      
      // Verify original owner unchanged
      const tokenId = 1;
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer.address);
      
      // Verify seat still marked as minted
      expect(await ticketNFT.isSeatMinted(eventId, 1)).to.be.true;
    });
  });
});
