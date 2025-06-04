const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Reports", function () {
  let eventRegistry;
  let ticketNFT;
  let marketplace;
  let owner, artist, buyer;
  const EVENT_URI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/1";
  const MAX_TICKETS = 100;

  beforeEach(async function () {
    [owner, artist, buyer] = await ethers.getSigners();

    const EventRegistry = await ethers.getContractFactory("EventRegistry");
    eventRegistry = await EventRegistry.deploy();

    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy(eventRegistry.address);

    const SimpleMarketplace = await ethers.getContractFactory("SimpleMarketplace");
    marketplace = await SimpleMarketplace.deploy(ticketNFT.address, eventRegistry.address, 250); // 2.5% fee

    // Set minter
    await eventRegistry.setMinter(owner.address, true);
    await ticketNFT.setApprovalForAll(marketplace.address, true);
  });

  it("Gas report: Create event", async function () {
    await eventRegistry.createEvent(EVENT_URI, MAX_TICKETS);
  });

  it("Gas report: Mint ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI, MAX_TICKETS);
    await ticketNFT.mintTicket(artist.address, 1, 1);
  });

  it("Gas report: List ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI, MAX_TICKETS);
    await ticketNFT.mintTicket(owner.address, 1, 1);
    await marketplace.listTicket(1, ethers.parseEther("0.1"));
  });

  it("Gas report: Buy ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI, MAX_TICKETS);
    await ticketNFT.mintTicket(owner.address, 1, 1);
    await marketplace.listTicket(1, ethers.parseEther("0.1"));
    await marketplace.connect(buyer).buy(1, { value: ethers.parseEther("0.1") });
  });
});
