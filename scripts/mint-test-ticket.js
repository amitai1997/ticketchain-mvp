const { ethers, network } = require("hardhat");

/**
 * Convert a seat label like "A-1" to a numeric ID
 * This is a simple encoding - using the first character as a row multiplier (A=1, B=2, etc.)
 * and the number after the dash as the seat number
 *
 * @param {string} seatLabel - The seat label (e.g., "A-1", "B-12")
 * @returns {number} - Numeric seat ID
 */
function seatLabelToId(seatLabel) {
  if (typeof seatLabel === 'number') {
    return seatLabel; // Already a number
  }

  // Check if it's a simple seat label format (e.g., "A-1")
  const match = seatLabel.match(/^([A-Z])-(\d+)$/);
  if (match) {
    const [, row, seat] = match;
    // Convert row letter to number (A=1, B=2, ...)
    const rowNum = row.charCodeAt(0) - 64; // ASCII 'A' is 65, so A-64=1
    const seatNum = parseInt(seat, 10);

    // Encode as rowNum*1000 + seatNum, so A-1 becomes 1001, B-12 becomes 2012, etc.
    return rowNum * 1000 + seatNum;
  }

  // If not in the expected format, try to parse as a number
  const numericId = parseInt(seatLabel, 10);
  if (!isNaN(numericId)) {
    return numericId;
  }

  throw new Error(`Invalid seat label format: ${seatLabel}. Use either a number or a format like "A-1"`);
}

async function main() {
  // Get the deployer's signer
  const [deployer] = await ethers.getSigners();
  console.log("Minting with account:", deployer.address);

  // Load deployed contract addresses based on the network
  let deploymentFile;
  if (network.name === "amoy") {
    deploymentFile = "../deployments/latest-amoy.json";
  } else {
    deploymentFile = "../deployments/latest-localhost.json";
  }

  console.log(`Using deployment file for network: ${network.name}`);
  const deployment = require(deploymentFile);

  // Get contract instances
  const eventRegistry = await ethers.getContractAt("EventRegistry", deployment.contracts.EventRegistry.address);
  const ticketNFT = await ethers.getContractAt("TicketNFT", deployment.contracts.TicketNFT.address);

  // First, create an event
  console.log("\n1. Creating test event...");

  // For now, we'll use a dummy IPFS hash (in production, you'd upload metadata to IPFS first)
  const ipfsHash = ethers.encodeBytes32String("QmTestHash123"); // Dummy IPFS hash
  const maxSupply = 100;

  try {
    const createTx = await eventRegistry.createEvent(ipfsHash, maxSupply);
    console.log("Transaction hash:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Debug log count
    console.log(`Logs in receipt: ${receipt.logs.length}`);

    // Find the EventCreated event directly by topic - first topic is the event signature
    const eventCreatedSignature = "EventCreated(uint256,address,bytes32,uint256)";
    const eventCreatedTopic = ethers.keccak256(ethers.toUtf8Bytes(eventCreatedSignature));

    console.log("Looking for event with topic:", eventCreatedTopic);

    const eventLog = receipt.logs.find(log =>
      log.topics && log.topics[0] === eventCreatedTopic
    );

    if (!eventLog) {
      console.error("EventCreated event not found in logs");
      console.log("Available log topics:");
      receipt.logs.forEach((log, i) => {
        console.log(`Log ${i}:`, log.topics[0]);
      });
      process.exit(1);
    }

    // Manually decode the event data
    const eventId = parseInt(eventLog.topics[1], 16);
    console.log("Event created with ID:", eventId);

    // Check if we need to authorize our account as a minter
    console.log("\n2. Authorizing our account as minter...");
    const isAccountAuthorized = await eventRegistry.isMinter(deployer.address);
    console.log("Account authorization status:", isAccountAuthorized);

    if (!isAccountAuthorized) {
      const authTx = await eventRegistry.setMinter(deployer.address, true);
      await authTx.wait();
      console.log("Account authorized as minter");

      // Verify the authorization went through
      const checkAuth = await eventRegistry.isMinter(deployer.address);
      console.log("Verification - Account is now authorized:", checkAuth);
    }

    // Mint a ticket to your wallet
    console.log("\n3. Minting ticket...");

    // The seat can be provided as a command line argument or default to "A-1"
    const seatLabel = process.env.SEAT || "A-1";
    const seatId = seatLabelToId(seatLabel);

    console.log(`Using seat label "${seatLabel}" (converted to ID: ${seatId})`);

    const mintTx = await ticketNFT.mintTicket(
      deployer.address, // Your wallet address
      eventId,
      seatId // Seat number - converted to numeric ID
    );

    console.log("Mint transaction hash:", mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log("Mint transaction confirmed in block:", mintReceipt.blockNumber);

    // Debug log count
    console.log(`Logs in receipt: ${mintReceipt.logs.length}`);

    // Find the Transfer event directly by topic
    const transferSignature = "Transfer(address,address,uint256)";
    const transferTopic = ethers.keccak256(ethers.toUtf8Bytes(transferSignature));

    const transferLog = mintReceipt.logs.find(log =>
      log.topics && log.topics[0] === transferTopic
    );

    if (!transferLog) {
      console.error("Transfer event not found in logs");
      console.log("Available log topics:");
      mintReceipt.logs.forEach((log, i) => {
        console.log(`Log ${i}:`, log.topics[0]);
      });
      process.exit(1);
    }

    // Manually decode the event data - tokenId is the 3rd topic (index 2)
    const ticketId = parseInt(transferLog.topics[3], 16);

    console.log("\n✅ Success! Ticket minted:");
    console.log("- Token ID:", ticketId.toString());
    console.log("- Owner:", deployer.address);
    console.log("- Event ID:", eventId.toString());
    console.log("- Seat Label:", seatLabel);
    console.log("- Seat ID:", seatId.toString());

    console.log("\n📱 To add to MetaMask:");
    console.log("1. Go to NFTs tab");
    console.log("2. Click 'Import NFT' (you might need to enable NFT detection first)");
    console.log("3. Enter:");
    console.log("   - Contract Address:", ticketNFT.target);
    console.log("   - Token ID:", ticketId.toString());
    console.log("\nNote: The NFT might not show an image as we haven't implemented tokenURI yet.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
