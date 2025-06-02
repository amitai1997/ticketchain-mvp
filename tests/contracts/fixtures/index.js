// Test fixtures and helper functions for TicketChain tests

const { ethers } = require("hardhat");

async function deployFixture() {
  // Get signers
  const [owner, artist, buyer, buyer2, platform] = await ethers.getSigners();

  // Deploy EventRegistry
  const EventRegistry = await ethers.getContractFactory("EventRegistry");
  const eventRegistry = await EventRegistry.deploy();
  await eventRegistry.waitForDeployment();

  // Deploy TicketNFT with correct constructor arguments
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(
    await eventRegistry.getAddress() // Only pass the event registry address
  );
  await ticketNFT.waitForDeployment();

  // Deploy SimpleMarketplace with the required parameters
  const SimpleMarketplace = await ethers.getContractFactory("SimpleMarketplace");
  // Platform fee is 250 basis points (2.5%)
  const platformFee = 250;
  const marketplace = await SimpleMarketplace.deploy(
    await ticketNFT.getAddress(),
    await eventRegistry.getAddress(),
    platformFee
  );
  await marketplace.waitForDeployment();

  // Create a test event
  const eventData = {
    name: "Test Concert",
    date: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    venue: "Test Arena",
    totalTickets: 1000,
    pricePerTicket: ethers.parseEther("0.1"), // 0.1 ETH
    maxResalePrice: ethers.parseEther("0.11"), // 10% markup allowed
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
  // Create IPFS hash (mock)
  const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(eventData.name));

  const tx = await (signer ? eventRegistry.connect(signer) : eventRegistry).createEvent(
    ipfsHash,
    eventData.totalTickets
  );
  const receipt = await tx.wait();

  // Get the event ID from the logs
  // The eventId is the first parameter in the EventCreated event
  for (const log of receipt.logs) {
    try {
      const parsedLog = eventRegistry.interface.parseLog({
        topics: log.topics,
        data: log.data
      });

      if (parsedLog && parsedLog.name === "EventCreated") {
        return parsedLog.args[0]; // eventId
      }
    } catch (e) {
      // Not the log we're looking for
      continue;
    }
  }

  // Fallback: if we can't find the event, just return 1 (first event)
  return 1;
}

async function mintTickets(ticketNFT, eventId, seatNumbers, to, signer = null) {
  // Default to using the first signer (owner) if none provided
  const defaultSigner = await ethers.getSigners().then(signers => signers[0]);
  const contract = signer ? ticketNFT.connect(signer) : ticketNFT.connect(defaultSigner);
  const tokenIds = [];

  // Make sure the signer is a minter
  const eventRegistry = await ethers.getContractAt(
    "EventRegistry",
    await ticketNFT.eventRegistry()
  );
  await eventRegistry.connect(defaultSigner).setMinter(
    await (signer || defaultSigner).getAddress(),
    true
  );

  // Mint tickets
  for (const seatNumber of seatNumbers) {
    // Use updated contract method signature: mintTicket(to, eventId, seatId)
    const tx = await contract.mintTicket(to, eventId, seatNumber);
    const receipt = await tx.wait();

    // Find tokenId
    for (const log of receipt.logs) {
      try {
        const parsedLog = ticketNFT.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog && parsedLog.name === "TicketMinted") {
          tokenIds.push(parsedLog.args[1]); // tokenId is the second argument
          break;
        }
      } catch (e) {
        // Not the log we're looking for
        continue;
      }
    }
  }

  return tokenIds;
}

module.exports = {
  deployFixture,
  createEvent,
  mintTickets
};
