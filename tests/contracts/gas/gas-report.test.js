const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas Reports", function () {
  let eventRegistry;
  let ticketNFT;
  let marketplace;
  let owner, artist, buyer;

  // Use ethers utils to convert a string to bytes32
  const EVENT_URI_BYTES32 = ethers.encodeBytes32String("event-uri");
  const MAX_TICKETS = 100;

  beforeEach(async function () {
    [owner, artist, buyer] = await ethers.getSigners();

    // Deploy EventRegistry
    const EventRegistry = await ethers.getContractFactory("EventRegistry");
    eventRegistry = await EventRegistry.deploy();
    await eventRegistry.waitForDeployment();
    const eventRegistryAddress = await eventRegistry.getAddress();

    // Deploy TicketNFT with event registry address
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy(eventRegistryAddress);
    await ticketNFT.waitForDeployment();
    const ticketNFTAddress = await ticketNFT.getAddress();

    // Deploy SimpleMarketplace with required addresses
    const SimpleMarketplace = await ethers.getContractFactory("SimpleMarketplace");
    marketplace = await SimpleMarketplace.deploy(ticketNFTAddress, eventRegistryAddress, 250); // 2.5% fee
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();

    // Set minter and approvals
    await eventRegistry.setMinter(await owner.getAddress(), true);
    await ticketNFT.setApprovalForAll(marketplaceAddress, true);
  });

  it("Gas report: Create event", async function () {
    await eventRegistry.createEvent(EVENT_URI_BYTES32, MAX_TICKETS);
  });

  it("Gas report: Mint ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI_BYTES32, MAX_TICKETS);
    await ticketNFT.mintTicket(await artist.getAddress(), 1, 1);
  });

  it("Gas report: List ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI_BYTES32, MAX_TICKETS);
    await ticketNFT.mintTicket(await owner.getAddress(), 1, 1);
    await marketplace.listTicket(1, ethers.parseEther("0.1"));
  });

  it("Gas report: Buy ticket", async function () {
    await eventRegistry.createEvent(EVENT_URI_BYTES32, MAX_TICKETS);
    await ticketNFT.mintTicket(await owner.getAddress(), 1, 1);
    await marketplace.listTicket(1, ethers.parseEther("0.1"));
    await marketplace.connect(buyer).buy(1, { value: ethers.parseEther("0.1") });
  });
});
