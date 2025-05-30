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
    
    // Create event
    eventId = await createEvent(eventRegistry, eventData);
    
    // Make the owner a minter
    await eventRegistry.setMinter(owner.address, true);
  });

  describe("Overflow/Underflow Protection", function () {
    it("Should handle maximum uint256 values safely", async function () {
      const maxEventData = {
        ...eventData,
        totalTickets: ethers.MaxUint256
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
      
      const newEventId = await createEvent(eventRegistry, zeroEventData);
      const event = await eventRegistry.events(newEventId);
      
      expect(event.maxSupply).to.equal(zeroEventData.totalTickets);
    });
  });

  describe("Invalid Input Handling", function () {
    it("Should reject invalid IPFS hash", async function () {
      await expect(
        eventRegistry.createEvent(ethers.ZeroHash, 100)
      ).to.be.revertedWith("Invalid IPFS hash");
    });

    it("Should reject zero supply", async function () {
      await expect(
        eventRegistry.createEvent(ethers.keccak256(ethers.toUtf8Bytes("Test Event")), 0)
      ).to.be.revertedWith("Max supply must be greater than 0");
    });
  });
  
  // Note: Additional edge case tests for re-entrancy protection, race conditions,
  // and marketplace operations will be implemented in future phases as those
  // features are developed.
});
