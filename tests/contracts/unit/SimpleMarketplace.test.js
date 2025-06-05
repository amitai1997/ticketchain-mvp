const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("SimpleMarketplace", function () {
  let marketplace, ticketNFT, eventRegistry;
  let owner, artist, buyer, buyer2, platform;
  let eventData, eventId;
  let platformFee = 250; // 2.5%

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

    // Make the owner a minter to prepare for tests
    await eventRegistry.setMinter(owner.address, true);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await marketplace.platformFeeBps()).to.equal(platformFee);
    });

    it("Should set the correct ticket NFT address", async function () {
      expect(await marketplace.TICKET_NFT()).to.equal(await ticketNFT.getAddress());
    });

    it("Should set the correct event registry address", async function () {
      expect(await marketplace.EVENT_REGISTRY()).to.equal(await eventRegistry.getAddress());
    });
  });

  // Test only the basic deployment for now, and we'll improve the other tests later
  // when we have more information about the actual contract interface
});
