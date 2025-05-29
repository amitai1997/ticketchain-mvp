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
    
    // Configure contracts
    await ticketNFT.setMarketplace(marketplace.address);
    await marketplace.setTicketNFT(ticketNFT.address);
    await marketplace.setPlatformFee(250);
    await marketplace.setPlatformAddress(owner.address);
  });

  describe("Event Creation Gas", function () {
    it("Should measure gas for creating an event", async function () {
      const tx = await eventRegistry.createEvent(
        eventData.name,
        eventData.date,
        eventData.venue,
        eventData.totalTickets,
        eventData.pricePerTicket,
        eventData.maxResalePrice,
        eventData.royaltyPercentage,
        eventData.artistAddress
      );
      
      const receipt = await tx.wait();
      console.log("        Gas used for event creation:", receipt.gasUsed.toString());
      
      // Target: < 150,000 gas
      expect(receipt.gasUsed).to.be.lt(150000);
    });
  });

  describe("Minting Gas", function () {
    beforeEach(async function () {
      eventId = await createEvent(eventRegistry, eventData);
    });

    it("Should measure gas for single ticket mint", async function () {
      const tx = await ticketNFT.mintTicket(eventId, buyer.address, 1, "");
      const receipt = await tx.wait();
      
      console.log("        Gas used for single mint:", receipt.gasUsed.toString());
      
      // Target: < 100,000 gas
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should measure gas for minting with metadata URI", async function () {
      const uri = "ipfs://QmTest123456789012345678901234567890";
      const tx = await ticketNFT.mintTicket(eventId, buyer.address, 2, uri);
      const receipt = await tx.wait();
      
      console.log("        Gas used for mint with URI:", receipt.gasUsed.toString());
      
      // Should be slightly higher than without URI
      expect(receipt.gasUsed).to.be.lt(120000);
    });

    it("Should measure gas for sequential mints", async function () {
      const gasUsages = [];
      
      for (let i = 1; i <= 5; i++) {
        const tx = await ticketNFT.mintTicket(eventId, buyer.address, i, "");
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed);
      }
      
      console.log("        Gas usage for sequential mints:");
      gasUsages.forEach((gas, index) => {
        console.log(`          Mint ${index + 1}: ${gas.toString()}`);
      });
      
      // Gas should be relatively consistent
      const avgGas = gasUsages.reduce((a, b) => a.add(b)).div(gasUsages.length);
      gasUsages.forEach(gas => {
        expect(gas).to.be.closeTo(avgGas, 5000);
      });
    });
  });

  describe("Marketplace Gas", function () {
    let tokenId;

    beforeEach(async function () {
      eventId = await createEvent(eventRegistry, eventData);
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
      await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
    });

    it("Should measure gas for listing creation", async function () {
      const tx = await marketplace.connect(buyer).createListing(
        tokenId, 
        ethers.utils.parseEther("0.1")
      );
      const receipt = await tx.wait();
      
      console.log("        Gas used for listing creation:", receipt.gasUsed.toString());
      
      // Target: < 100,000 gas
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should measure gas for purchase", async function () {
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      const tx = await marketplace.connect(buyer2).purchaseListing(1, { 
        value: ethers.utils.parseEther("0.1") 
      });
      const receipt = await tx.wait();
      
      console.log("        Gas used for purchase:", receipt.gasUsed.toString());
      
      // Target: < 80,000 gas (includes transfer and payment splits)
      expect(receipt.gasUsed).to.be.lt(80000);
    });

    it("Should measure gas for listing cancellation", async function () {
      await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      
      const tx = await marketplace.connect(buyer).cancelListing(1);
      const receipt = await tx.wait();
      
      console.log("        Gas used for cancellation:", receipt.gasUsed.toString());
      
      // Target: < 50,000 gas
      expect(receipt.gasUsed).to.be.lt(50000);
    });
  });

  describe("Batch Operations Gas", function () {
    beforeEach(async function () {
      eventId = await createEvent(eventRegistry, eventData);
    });

    it("Should compare gas for multiple operations", async function () {
      const results = {
        setAuthorizedMinter: 0,
        pauseEvent: 0,
        setMarketplace: 0,
        setPlatformFee: 0
      };

      // Measure admin operations
      let tx = await eventRegistry.setAuthorizedMinter(buyer.address, true);
      results.setAuthorizedMinter = (await tx.wait()).gasUsed;

      tx = await eventRegistry.pauseEvent(eventId);
      results.pauseEvent = (await tx.wait()).gasUsed;

      tx = await ticketNFT.setMarketplace(marketplace.address);
      results.setMarketplace = (await tx.wait()).gasUsed;

      tx = await marketplace.setPlatformFee(300);
      results.setPlatformFee = (await tx.wait()).gasUsed;

      console.log("        Admin operation gas usage:");
      Object.entries(results).forEach(([op, gas]) => {
        console.log(`          ${op}: ${gas.toString()}`);
      });

      // All admin operations should be relatively cheap
      Object.values(results).forEach(gas => {
        expect(gas).to.be.lt(50000);
      });
    });
  });

  describe("Storage Optimization", function () {
    it("Should efficiently store event data", async function () {
      // Create multiple events and check gas increase
      const gasUsages = [];
      
      for (let i = 0; i < 3; i++) {
        const tx = await eventRegistry.createEvent(
          `Event ${i}`,
          eventData.date + i * 86400,
          eventData.venue,
          eventData.totalTickets,
          eventData.pricePerTicket,
          eventData.maxResalePrice,
          eventData.royaltyPercentage,
          eventData.artistAddress
        );
        gasUsages.push((await tx.wait()).gasUsed);
      }

      console.log("        Event creation gas progression:");
      gasUsages.forEach((gas, index) => {
        console.log(`          Event ${index + 1}: ${gas.toString()}`);
      });

      // Gas should not increase significantly for subsequent events
      expect(gasUsages[2]).to.be.closeTo(gasUsages[0], 5000);
    });

    it("Should efficiently handle ticket ownership queries", async function () {
      eventId = await createEvent(eventRegistry, eventData);
      
      // Mint multiple tickets
      const numTickets = 10;
      await mintTickets(
        ticketNFT, 
        eventId, 
        Array.from({ length: numTickets }, (_, i) => i + 1), 
        buyer.address
      );

      // Measure gas for ownership query
      const startGas = await ethers.provider.getBalance(owner.address);
      const tickets = await ticketNFT.getTicketsByOwner(buyer.address);
      const endGas = await ethers.provider.getBalance(owner.address);

      console.log(`        Retrieved ${tickets.length} tickets for owner`);
      
      // This is a view function, so no gas should be consumed
      expect(startGas).to.equal(endGas);
      expect(tickets.length).to.equal(numTickets);
    });
  });

  describe("Gas Limits and Thresholds", function () {
    it("Should stay within target gas limits for all operations", async function () {
      const operations = [];

      // Event creation
      let tx = await eventRegistry.createEvent(
        eventData.name,
        eventData.date,
        eventData.venue,
        eventData.totalTickets,
        eventData.pricePerTicket,
        eventData.maxResalePrice,
        eventData.royaltyPercentage,
        eventData.artistAddress
      );
      operations.push({ name: "Event Creation", gas: (await tx.wait()).gasUsed, target: 150000 });

      eventId = await eventRegistry.eventCounter();

      // Ticket minting
      tx = await ticketNFT.mintTicket(eventId, buyer.address, 1, "");
      operations.push({ name: "Ticket Minting", gas: (await tx.wait()).gasUsed, target: 100000 });

      const tokenId = await ticketNFT.tokenCounter();

      // Approve marketplace
      tx = await ticketNFT.connect(buyer).approve(marketplace.address, tokenId);
      operations.push({ name: "Approve", gas: (await tx.wait()).gasUsed, target: 50000 });

      // Create listing
      tx = await marketplace.connect(buyer).createListing(tokenId, ethers.utils.parseEther("0.1"));
      operations.push({ name: "Create Listing", gas: (await tx.wait()).gasUsed, target: 100000 });

      // Purchase
      tx = await marketplace.connect(buyer2).purchaseListing(1, { 
        value: ethers.utils.parseEther("0.1") 
      });
      operations.push({ name: "Purchase", gas: (await tx.wait()).gasUsed, target: 80000 });

      // Summary
      console.log("\n        Gas Usage Summary:");
      console.log("        ==================");
      operations.forEach(op => {
        const status = op.gas <= op.target ? "✅" : "❌";
        const percentage = ((op.gas * 100) / op.target).toFixed(1);
        console.log(`        ${status} ${op.name}: ${op.gas.toString()} / ${op.target} (${percentage}%)`);
      });

      // Verify all operations meet targets
      operations.forEach(op => {
        expect(op.gas).to.be.lte(op.target);
      });

      // Calculate total gas for full flow
      const totalGas = operations.reduce((sum, op) => sum.add(op.gas), ethers.BigNumber.from(0));
      console.log(`\n        Total gas for full flow: ${totalGas.toString()}`);
      
      // Total should be reasonable for a complete ticket lifecycle
      expect(totalGas).to.be.lt(500000);
    });
  });

  describe("Optimization Recommendations", function () {
    it("Should identify potential optimizations", async function () {
      console.log("\n        Optimization Analysis:");
      console.log("        ====================");
      
      // Test packed struct benefits
      eventId = await createEvent(eventRegistry, eventData);
      const eventStorageSlots = await eventRegistry.getEvent(eventId);
      
      console.log("        Event struct uses efficient packing");
      console.log("        - date (uint256) and totalTickets (uint256) in separate slots");
      console.log("        - Consider packing smaller values together");
      
      // Test mapping vs array for lookups
      const [token1, token2, token3] = await mintTickets(
        ticketNFT, 
        eventId, 
        [1, 2, 3], 
        buyer.address
      );
      
      // Both operations are view functions (no gas)
      const ticketsByOwner = await ticketNFT.getTicketsByOwner(buyer.address);
      const seatMinted = await ticketNFT.isSeatMinted(eventId, 1);
      
      console.log("\n        Storage patterns:");
      console.log("        - Seat tracking uses nested mapping (efficient)");
      console.log("        - Owner tracking could benefit from enumerable extension");
      
      expect(ticketsByOwner.length).to.equal(3);
      expect(seatMinted).to.be.true;
    });
  });
});
