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
      expect(await eventRegistry.eventCounter()).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should create an event with correct parameters", async function () {
      const eventId = await createEvent(eventRegistry, eventData);
      
      const event = await eventRegistry.getEvent(eventId);
      expect(event.name).to.equal(eventData.name);
      expect(event.date).to.equal(eventData.date);
      expect(event.venue).to.equal(eventData.venue);
      expect(event.totalTickets).to.equal(eventData.totalTickets);
      expect(event.pricePerTicket).to.equal(eventData.pricePerTicket);
      expect(event.maxResalePrice).to.equal(eventData.maxResalePrice);
      expect(event.royaltyPercentage).to.equal(eventData.royaltyPercentage);
      expect(event.artistAddress).to.equal(eventData.artistAddress);
      expect(event.isActive).to.be.true;
    });

    it("Should emit EventCreated event", async function () {
      await expect(eventRegistry.createEvent(
        eventData.name,
        eventData.date,
        eventData.venue,
        eventData.totalTickets,
        eventData.pricePerTicket,
        eventData.maxResalePrice,
        eventData.royaltyPercentage,
        eventData.artistAddress
      ))
        .to.emit(eventRegistry, "EventCreated")
        .withArgs(1, eventData.name, owner.address);
    });

    it("Should increment eventCounter", async function () {
      await createEvent(eventRegistry, eventData);
      expect(await eventRegistry.eventCounter()).to.equal(1);
      
      await createEvent(eventRegistry, eventData);
      expect(await eventRegistry.eventCounter()).to.equal(2);
    });

    it("Should revert if max resale price is less than original price", async function () {
      const invalidData = { ...eventData };
      invalidData.maxResalePrice = ethers.utils.parseEther("0.05"); // Less than 0.1
      
      await expect(
        eventRegistry.createEvent(
          invalidData.name,
          invalidData.date,
          invalidData.venue,
          invalidData.totalTickets,
          invalidData.pricePerTicket,
          invalidData.maxResalePrice,
          invalidData.royaltyPercentage,
          invalidData.artistAddress
        )
      ).to.be.revertedWith("Invalid max resale price");
    });

    it("Should revert if royalty percentage exceeds 10%", async function () {
      const invalidData = { ...eventData };
      invalidData.royaltyPercentage = 1100; // 11%
      
      await expect(
        eventRegistry.createEvent(
          invalidData.name,
          invalidData.date,
          invalidData.venue,
          invalidData.totalTickets,
          invalidData.pricePerTicket,
          invalidData.maxResalePrice,
          invalidData.royaltyPercentage,
          invalidData.artistAddress
        )
      ).to.be.revertedWith("Royalty too high");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to set authorized minter", async function () {
      await eventRegistry.setAuthorizedMinter(user1.address, true);
      expect(await eventRegistry.authorizedMinters(user1.address)).to.be.true;
    });

    it("Should emit MinterAuthorized event", async function () {
      await expect(eventRegistry.setAuthorizedMinter(user1.address, true))
        .to.emit(eventRegistry, "MinterAuthorized")
        .withArgs(user1.address, true);
    });

    it("Should revert if non-owner tries to set authorized minter", async function () {
      await expect(
        eventRegistry.connect(user1).setAuthorizedMinter(user2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow removing minter authorization", async function () {
      await eventRegistry.setAuthorizedMinter(user1.address, true);
      await eventRegistry.setAuthorizedMinter(user1.address, false);
      expect(await eventRegistry.authorizedMinters(user1.address)).to.be.false;
    });
  });

  describe("Event Management", function () {
    let eventId;

    beforeEach(async function () {
      eventId = await createEvent(eventRegistry, eventData);
    });

    it("Should allow owner to pause an event", async function () {
      await eventRegistry.pauseEvent(eventId);
      const event = await eventRegistry.getEvent(eventId);
      expect(event.isActive).to.be.false;
    });

    it("Should emit EventPaused event", async function () {
      await expect(eventRegistry.pauseEvent(eventId))
        .to.emit(eventRegistry, "EventPaused")
        .withArgs(eventId);
    });

    it("Should revert if non-owner tries to pause event", async function () {
      await expect(
        eventRegistry.connect(user1).pauseEvent(eventId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if trying to pause non-existent event", async function () {
      await expect(eventRegistry.pauseEvent(999))
        .to.be.revertedWith("Event does not exist");
    });
  });

  describe("View Functions", function () {
    it("Should return correct event details", async function () {
      const eventId = await createEvent(eventRegistry, eventData);
      const event = await eventRegistry.getEvent(eventId);
      
      expect(event.name).to.equal(eventData.name);
      expect(event.organizer).to.equal(owner.address);
    });

    it("Should check if caller is authorized minter", async function () {
      expect(await eventRegistry.isAuthorizedMinter(user1.address)).to.be.false;
      
      await eventRegistry.setAuthorizedMinter(user1.address, true);
      expect(await eventRegistry.isAuthorizedMinter(user1.address)).to.be.true;
    });

    it("Should return owner as authorized minter", async function () {
      expect(await eventRegistry.isAuthorizedMinter(owner.address)).to.be.true;
    });
  });
});
