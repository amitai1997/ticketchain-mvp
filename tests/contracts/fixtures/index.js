// Test fixtures and helper functions for TicketChain tests

const { ethers } = require("hardhat");

async function deployFixture() {
  // Get signers
  const [owner, artist, buyer, buyer2, platform] = await ethers.getSigners();

  // Deploy EventRegistry
  const EventRegistry = await ethers.getContractFactory("EventRegistry");
  const eventRegistry = await EventRegistry.deploy();
  await eventRegistry.deployed();

  // Deploy SimpleMarketplace
  const SimpleMarketplace = await ethers.getContractFactory("SimpleMarketplace");
  const marketplace = await SimpleMarketplace.deploy();
  await marketplace.deployed();

  // Deploy TicketNFT
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(
    "TicketChain Event Tickets",
    "TCKT",
    eventRegistry.address
  );
  await ticketNFT.deployed();

  // Create a test event
  const eventData = {
    name: "Test Concert",
    date: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    venue: "Test Arena",
    totalTickets: 1000,
    pricePerTicket: ethers.utils.parseEther("0.1"), // 0.1 ETH
    maxResalePrice: ethers.utils.parseEther("0.11"), // 10% markup allowed
    royaltyPercentage: 500, // 5%
    artistAddress: artist.address
  };

  return {
    // Contracts
    eventRegistry,
    marketplace,
    ticketNFT,
    // Signers
    owner,
    artist,
    buyer,
    buyer2,
    platform,
    // Test data
    eventData
  };
}

async function createEvent(eventRegistry, eventData, signer = null) {
  const tx = await (signer ? eventRegistry.connect(signer) : eventRegistry).createEvent(
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
  const event = receipt.events.find(e => e.event === "EventCreated");
  return event.args.eventId;
}

async function mintTickets(ticketNFT, eventId, seatNumbers, to, signer = null) {
  const contract = signer ? ticketNFT.connect(signer) : ticketNFT;
  const tokenIds = [];
  
  for (const seatNumber of seatNumbers) {
    const tx = await contract.mintTicket(eventId, to, seatNumber, "");
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "Transfer");
    tokenIds.push(event.args.tokenId);
  }
  
  return tokenIds;
}

module.exports = {
  deployFixture,
  createEvent,
  mintTickets
};
