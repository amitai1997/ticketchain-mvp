const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting TicketChain MVP deployment...");
  console.log("Network:", hre.network.name);
  console.log("--------------------------------------------");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  console.log("--------------------------------------------");

  // Deploy EventRegistry
  console.log("1. Deploying EventRegistry...");
  const EventRegistry = await ethers.getContractFactory("EventRegistry");
  const eventRegistry = await EventRegistry.deploy();
  await eventRegistry.deployed();
  console.log("✅ EventRegistry deployed to:", eventRegistry.address);
  console.log("   Gas used:", (await eventRegistry.deployTransaction.wait()).gasUsed.toString());

  // Deploy SimpleMarketplace  
  console.log("\n2. Deploying SimpleMarketplace...");
  const SimpleMarketplace = await ethers.getContractFactory("SimpleMarketplace");
  const marketplace = await SimpleMarketplace.deploy();
  await marketplace.deployed();
  console.log("✅ SimpleMarketplace deployed to:", marketplace.address);
  console.log("   Gas used:", (await marketplace.deployTransaction.wait()).gasUsed.toString());

  // Deploy TicketNFT
  console.log("\n3. Deploying TicketNFT...");
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(
    "TicketChain Event Tickets",
    "TCKT",
    eventRegistry.address
  );
  await ticketNFT.deployed();
  console.log("✅ TicketNFT deployed to:", ticketNFT.address);
  console.log("   Gas used:", (await ticketNFT.deployTransaction.wait()).gasUsed.toString());

  // Save deployment addresses
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      EventRegistry: {
        address: eventRegistry.address,
        transactionHash: eventRegistry.deployTransaction.hash
      },
      SimpleMarketplace: {
        address: marketplace.address,
        transactionHash: marketplace.deployTransaction.hash
      },
      TicketNFT: {
        address: ticketNFT.address,
        transactionHash: ticketNFT.deployTransaction.hash,
        constructorArgs: [
          "TicketChain Event Tickets",
          "TCKT",
          eventRegistry.address
        ]
      }
    }
  };

  // Create deployment directory if it doesn't exist
  const deploymentDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Save deployment data
  const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  
  // Also save as latest
  const latestPath = path.join(deploymentDir, `latest-${hre.network.name}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));

  console.log("\n--------------------------------------------");
  console.log("📄 Deployment Summary:");
  console.log("--------------------------------------------");
  console.log("EventRegistry:", eventRegistry.address);
  console.log("SimpleMarketplace:", marketplace.address);
  console.log("TicketNFT:", ticketNFT.address);
  console.log("\n💾 Deployment data saved to:");
  console.log("  ", filepath);
  console.log("  ", latestPath);

  // Wait for confirmations if on testnet/mainnet
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    const confirmations = hre.network.config.confirmations || 2;
    console.log(`\n⏳ Waiting for ${confirmations} confirmations...`);
    
    await eventRegistry.deployTransaction.wait(confirmations);
    await marketplace.deployTransaction.wait(confirmations);
    await ticketNFT.deployTransaction.wait(confirmations);
    
    console.log("✅ All contracts confirmed!");
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Run 'npm run verify' to verify contracts on Polygonscan");
  console.log("2. Update .env with contract addresses if needed");
  console.log("3. Run tests against deployed contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
