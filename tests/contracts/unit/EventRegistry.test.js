const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent } = require("../fixtures");

describe("EventRegistry", function () {
  let eventRegistry;
  let owner, artist, user1, user2;
  let eventData;

  beforeEach(async function () {
    const fixture = await deployFixture();
    eventRegistry = fixture.eventRegistry;
    owner = fixture.owner;
    artist = fixture.artist;
    user1 = fixture.buyer;
    user2 = fixture.buyer2;
    eventData = fixture.eventData;
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await eventRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with eventCounter at 0", async function () {
      expect(await eventRegistry.eventCount()).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should create an event with correct parameters", async function () {
      // Create IPFS hash (mock)
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));
      const maxSupply = eventData.totalTickets;

      const tx = await eventRegistry.createEvent(ipfsHash, maxSupply);
      const receipt = await tx.wait();
      const eventId = 1; // First event has ID 1

      const eventRecord = await eventRegistry.events(eventId);
      expect(eventRecord.ipfsHash).to.equal(ipfsHash);
      expect(eventRecord.maxSupply).to.equal(maxSupply);
      expect(eventRecord.creator).to.equal(owner.address);
      expect(eventRecord.isPaused).to.be.false;
    });

    it("Should emit EventCreated event", async function () {
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));
      const maxSupply = eventData.totalTickets;

      await expect(eventRegistry.createEvent(ipfsHash, maxSupply))
        .to.emit(eventRegistry, "EventCreated")
        .withArgs(1, owner.address, ipfsHash, maxSupply);
    });

    it("Should increment event counter", async function () {
      // First create an event
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));
      await eventRegistry.createEvent(ipfsHash, eventData.totalTickets);
      expect(await eventRegistry.eventCount()).to.equal(1);

      // Create another event
      await eventRegistry.createEvent(ipfsHash, eventData.totalTickets);
      expect(await eventRegistry.eventCount()).to.equal(2);
    });

    it("Should revert if IPFS hash is empty", async function () {
      const emptyHash = ethers.ZeroHash;

      await expect(
        eventRegistry.createEvent(emptyHash, eventData.totalTickets)
      ).to.be.revertedWith("Invalid IPFS hash");
    });

    it("Should revert if max supply is zero", async function () {
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));

      await expect(
        eventRegistry.createEvent(ipfsHash, 0)
      ).to.be.revertedWith("Max supply must be greater than 0");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to set minter", async function () {
      await eventRegistry.setMinter(user1.address, true);
      expect(await eventRegistry.isMinter(user1.address)).to.be.true;
    });

    it("Should emit MinterUpdated event", async function () {
      await expect(eventRegistry.setMinter(user1.address, true))
        .to.emit(eventRegistry, "MinterUpdated")
        .withArgs(user1.address, true);
    });

    it("Should revert if non-owner tries to set minter", async function () {
      await expect(
        eventRegistry.connect(user1).setMinter(user2.address, true)
      ).to.be.reverted;
    });

    it("Should allow removing minter authorization", async function () {
      await eventRegistry.setMinter(user1.address, true);
      await eventRegistry.setMinter(user1.address, false);
      expect(await eventRegistry.isMinter(user1.address)).to.be.false;
    });
  });

  describe("Event Management", function () {
    let eventId;

    beforeEach(async function () {
      eventId = await createEvent(eventRegistry, eventData);
    });

    it("Should allow owner to pause an event", async function () {
      await eventRegistry.pauseEvent(eventId);
      const event = await eventRegistry.events(eventId);
      expect(event.isPaused).to.be.true;
    });

    it("Should emit EventPaused event", async function () {
      await expect(eventRegistry.pauseEvent(eventId))
        .to.emit(eventRegistry, "EventPaused")
        .withArgs(eventId, true);
    });

    it("Should revert if non-owner tries to pause event", async function () {
      // Non-creator, non-owner trying to pause
      await expect(
        eventRegistry.connect(user2).pauseEvent(eventId)
      ).to.be.revertedWith("Not authorized to pause event");
    });

    it("Should revert if trying to pause non-existent event", async function () {
      await expect(eventRegistry.pauseEvent(999))
        .to.be.revertedWith("Event does not exist");
    });
  });

  describe("View Functions", function () {
    it("Should return correct event details", async function () {
      const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));
      await eventRegistry.createEvent(ipfsHash, eventData.totalTickets);

      const event = await eventRegistry.events(1);
      expect(event.ipfsHash).to.equal(ipfsHash);
      expect(event.maxSupply).to.equal(eventData.totalTickets);
      expect(event.creator).to.equal(owner.address);
    });

    it("Should check if caller is authorized minter", async function () {
      expect(await eventRegistry.isMinter(user1.address)).to.be.false;

      await eventRegistry.setMinter(user1.address, true);
      expect(await eventRegistry.isMinter(user1.address)).to.be.true;
    });
  });
});
