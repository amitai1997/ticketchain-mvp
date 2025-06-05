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

    // Create event
    eventId = await createEvent(eventRegistry, eventData);

    // Make the owner a minter
    await eventRegistry.setMinter(owner.address, true);
  });

  describe("Access Control Integration", function () {
    it("Should enforce minting permissions across contracts", async function () {
      // Non-authorized user cannot mint
      await expect(
        ticketNFT.connect(buyer).mintTicket(buyer.address, eventId, 1)
      ).to.be.revertedWithCustomError(ticketNFT, "NotAuthorizedMinter");

      // Authorize user
      await eventRegistry.setMinter(buyer.address, true);

      // Now they can mint
      await expect(
        ticketNFT.connect(buyer).mintTicket(buyer.address, eventId, 1)
      ).to.not.be.reverted;
    });

    it("Should respect event pause status", async function () {
      // Pause event
      await eventRegistry.pauseEvent(eventId);

      // Cannot mint for paused event
      await expect(
        ticketNFT.mintTicket(buyer.address, eventId, 1)
      ).to.be.revertedWithCustomError(ticketNFT, "EventIsPaused");
    });
  });

  // Note: Full lifecycle tests for listing and purchasing tickets will be
  // implemented in future phases as marketplace functionality is developed.
});
