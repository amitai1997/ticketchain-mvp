const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting TicketChain MVP deployment...");
  console.log("Network:", hre.network.name);
  console.log("--------------------------------------------");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("--------------------------------------------");

  // Deploy EventRegistry
  console.log("1. Deploying EventRegistry...");
  const EventRegistry = await hre.ethers.getContractFactory("EventRegistry");
  const eventRegistry = await EventRegistry.deploy();
  await eventRegistry.waitForDeployment();
  const eventRegistryAddress = await eventRegistry.getAddress();
  console.log("✅ EventRegistry deployed to:", eventRegistryAddress);
  const eventRegistryTx = eventRegistry.deploymentTransaction();
  console.log("   Gas used:", (await eventRegistryTx.wait()).gasUsed.toString());

  // Deploy TicketNFT
  console.log("\n2. Deploying TicketNFT...");
  const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(eventRegistryAddress);
  await ticketNFT.waitForDeployment();
  const ticketNFTAddress = await ticketNFT.getAddress();
  console.log("✅ TicketNFT deployed to:", ticketNFTAddress);
  const ticketNFTTx = ticketNFT.deploymentTransaction();
  console.log("   Gas used:", (await ticketNFTTx.wait()).gasUsed.toString());

  // Deploy SimpleMarketplace with constructor arguments
  console.log("\n3. Deploying SimpleMarketplace...");
  // Set platform fee to 2.5% (250 basis points)
  const platformFeeBps = 250;
  const SimpleMarketplace = await hre.ethers.getContractFactory("SimpleMarketplace");
  const marketplace = await SimpleMarketplace.deploy(
    ticketNFTAddress,
    eventRegistryAddress,
    platformFeeBps
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ SimpleMarketplace deployed to:", marketplaceAddress);
  console.log("   Platform fee set to:", platformFeeBps / 100, "%");
  const marketplaceTx = marketplace.deploymentTransaction();
  console.log("   Gas used:", (await marketplaceTx.wait()).gasUsed.toString());

  // Save deployment addresses
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      EventRegistry: {
        address: eventRegistryAddress,
        transactionHash: eventRegistryTx.hash
      },
      TicketNFT: {
        address: ticketNFTAddress,
        transactionHash: ticketNFTTx.hash,
        constructorArgs: [
          eventRegistryAddress
        ]
      },
      SimpleMarketplace: {
        address: marketplaceAddress,
        transactionHash: marketplaceTx.hash,
        constructorArgs: [
          ticketNFTAddress,
          eventRegistryAddress,
          platformFeeBps
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
  console.log("EventRegistry:", eventRegistryAddress);
  console.log("TicketNFT:", ticketNFTAddress);
  console.log("SimpleMarketplace:", marketplaceAddress);
  console.log("\n💾 Deployment data saved to:");
  console.log("  ", filepath);
  console.log("  ", latestPath);

  // Wait for confirmations if on testnet/mainnet
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    const confirmations = hre.network.config.confirmations || 2;
    console.log(`\n⏳ Waiting for ${confirmations} confirmations...`);
    
    await eventRegistryTx.wait(confirmations);
    await ticketNFTTx.wait(confirmations);
    await marketplaceTx.wait(confirmations);
    
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
