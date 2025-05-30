const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("Gas Optimization Tests", function () {
  let marketplace, ticketNFT, eventRegistry;
  let owner, artist, buyer, buyer2;
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
    eventData = fixture.eventData;
    
    // Make the owner a minter
    await eventRegistry.setMinter(owner.address, true);
  });

  describe("Event Creation Gas", function () {
    it("Should measure gas for creating an event", async function () {
      // Create a simple event with a hash and supply
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes("Test Event"));
      const totalTickets = 100;
      
      const tx = await eventRegistry.createEvent(ipfsHash, totalTickets);
      const receipt = await tx.wait();
      
      console.log("        Gas used for event creation:", receipt.gasUsed.toString());
      
      // Target: < 150,000 gas
      expect(receipt.gasUsed).to.be.lt(150000);
    });
  });

  describe("Minting Gas", function () {
    beforeEach(async function () {
      // Create an event for testing
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes("Test Event"));
      const totalTickets = 100;
      
      const tx = await eventRegistry.createEvent(ipfsHash, totalTickets);
      const receipt = await tx.wait();
      const logs = receipt.logs;
      
      // Extract eventId from logs
      for (const log of logs) {
        try {
          const parsedLog = eventRegistry.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === "EventCreated") {
            eventId = parsedLog.args[0]; // eventId
            break;
          }
        } catch (e) {
          continue;
        }
      }
    });

    it("Should measure gas for single ticket mint", async function () {
      const tx = await ticketNFT.mintTicket(buyer.address, eventId, 1);
      const receipt = await tx.wait();
      
      console.log("        Gas used for single mint:", receipt.gasUsed.toString());
      
      // Target: < 200,000 gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });
  
  // Note: Additional gas tests for marketplace operations, batch operations,
  // and storage optimization will be implemented in future phases as those
  // features are developed.
});
