const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployFixture, createEvent, mintTickets } = require("../fixtures");

describe("TicketNFT", function () {
  let ticketNFT, eventRegistry;
  let owner, artist, buyer, buyer2;
  let eventData, eventId;

  beforeEach(async function () {
    const fixture = await deployFixture();
    ticketNFT = fixture.ticketNFT;
    eventRegistry = fixture.eventRegistry;
    owner = fixture.owner;
    artist = fixture.artist;
    buyer = fixture.buyer;
    buyer2 = fixture.buyer2;
    eventData = fixture.eventData;
    
    // Create a test event
    eventId = await createEvent(eventRegistry, eventData);
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await ticketNFT.name()).to.equal("TicketChain Event Tickets");
      expect(await ticketNFT.symbol()).to.equal("TCKT");
    });

    it("Should set correct EventRegistry address", async function () {
      expect(await ticketNFT.eventRegistry()).to.equal(eventRegistry.address);
    });
  });

  describe("Minting", function () {
    it("Should mint ticket with correct metadata", async function () {
      const seatNumber = 42;
      const [tokenId] = await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer.address);
      
      const ticketInfo = await ticketNFT.getTicketInfo(tokenId);
      expect(ticketInfo.eventId).to.equal(eventId);
      expect(ticketInfo.seatNumber).to.equal(seatNumber);
    });

    it("Should emit TicketMinted event", async function () {
      const seatNumber = 1;
      await expect(ticketNFT.mintTicket(eventId, buyer.address, seatNumber, ""))
        .to.emit(ticketNFT, "TicketMinted")
        .withArgs(1, eventId, buyer.address, seatNumber);
    });

    it("Should increment token counter", async function () {
      expect(await ticketNFT.tokenCounter()).to.equal(0);
      
      await mintTickets(ticketNFT, eventId, [1], buyer.address);
      expect(await ticketNFT.tokenCounter()).to.equal(1);
      
      await mintTickets(ticketNFT, eventId, [2], buyer.address);
      expect(await ticketNFT.tokenCounter()).to.equal(2);
    });

    it("Should revert if non-authorized minter tries to mint", async function () {
      await expect(
        ticketNFT.connect(buyer).mintTicket(eventId, buyer.address, 1, "")
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("Should allow authorized minter to mint", async function () {
      await eventRegistry.setAuthorizedMinter(buyer.address, true);
      
      await expect(
        ticketNFT.connect(buyer).mintTicket(eventId, buyer2.address, 1, "")
      ).to.not.be.reverted;
    });

    it("Should revert if minting for non-existent event", async function () {
      await expect(
        ticketNFT.mintTicket(999, buyer.address, 1, "")
      ).to.be.revertedWith("Event does not exist");
    });

    it("Should revert if minting duplicate seat for same event", async function () {
      const seatNumber = 1;
      await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      
      await expect(
        ticketNFT.mintTicket(eventId, buyer2.address, seatNumber, "")
      ).to.be.revertedWith("Seat already minted");
    });

    it("Should allow same seat number for different events", async function () {
      const seatNumber = 1;
      await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      
      // Create another event
      const eventId2 = await createEvent(eventRegistry, { ...eventData, name: "Test Concert 2" });
      
      // Should not revert
      await expect(
        ticketNFT.mintTicket(eventId2, buyer2.address, seatNumber, "")
      ).to.not.be.reverted;
    });
  });

  describe("Transfer Restrictions", function () {
    let tokenId;

    beforeEach(async function () {
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
    });

    it("Should allow marketplace to transfer", async function () {
      await ticketNFT.setMarketplace(buyer.address); // Temporarily set buyer as marketplace
      
      await ticketNFT.connect(buyer).transferFrom(buyer.address, buyer2.address, tokenId);
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer2.address);
    });

    it("Should revert on regular transfer when paused", async function () {
      await ticketNFT.setTransfersPaused(true);
      
      await expect(
        ticketNFT.connect(buyer).transferFrom(buyer.address, buyer2.address, tokenId)
      ).to.be.revertedWith("Transfers paused");
    });

    it("Should allow owner to transfer when others are paused", async function () {
      await ticketNFT.setTransfersPaused(true);
      
      // Transfer to owner first
      await ticketNFT.setMarketplace(owner.address);
      await ticketNFT.transferFrom(buyer.address, owner.address, tokenId);
      
      // Owner should be able to transfer
      await ticketNFT.transferFrom(owner.address, buyer2.address, tokenId);
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(buyer2.address);
    });
  });

  describe("Marketplace Integration", function () {
    it("Should allow owner to set marketplace address", async function () {
      const marketplaceAddress = buyer.address; // Using buyer address as mock
      await ticketNFT.setMarketplace(marketplaceAddress);
      expect(await ticketNFT.marketplace()).to.equal(marketplaceAddress);
    });

    it("Should revert if non-owner tries to set marketplace", async function () {
      await expect(
        ticketNFT.connect(buyer).setMarketplace(buyer2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("TokenURI", function () {
    let tokenId;

    beforeEach(async function () {
      [tokenId] = await mintTickets(ticketNFT, eventId, [1], buyer.address);
    });

    it("Should return empty URI by default", async function () {
      expect(await ticketNFT.tokenURI(tokenId)).to.equal("");
    });

    it("Should return custom URI if set during minting", async function () {
      const customURI = "ipfs://QmTest123";
      const tx = await ticketNFT.mintTicket(eventId, buyer.address, 2, customURI);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "Transfer");
      const newTokenId = event.args.tokenId;
      
      expect(await ticketNFT.tokenURI(newTokenId)).to.equal(customURI);
    });

    it("Should revert for non-existent token", async function () {
      await expect(ticketNFT.tokenURI(999))
        .to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("View Functions", function () {
    it("Should return all tickets for an owner", async function () {
      const seatNumbers = [1, 2, 3];
      const tokenIds = await mintTickets(ticketNFT, eventId, seatNumbers, buyer.address);
      
      const buyerTickets = await ticketNFT.getTicketsByOwner(buyer.address);
      expect(buyerTickets.length).to.equal(3);
      
      for (let i = 0; i < tokenIds.length; i++) {
        expect(buyerTickets[i]).to.equal(tokenIds[i]);
      }
    });

    it("Should check if seat is already minted", async function () {
      const seatNumber = 42;
      expect(await ticketNFT.isSeatMinted(eventId, seatNumber)).to.be.false;
      
      await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      expect(await ticketNFT.isSeatMinted(eventId, seatNumber)).to.be.true;
    });

    it("Should return correct ticket info", async function () {
      const seatNumber = 100;
      const [tokenId] = await mintTickets(ticketNFT, eventId, [seatNumber], buyer.address);
      
      const info = await ticketNFT.getTicketInfo(tokenId);
      expect(info.eventId).to.equal(eventId);
      expect(info.seatNumber).to.equal(seatNumber);
    });
  });
});
