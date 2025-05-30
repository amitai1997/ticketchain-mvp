const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification on Polygonscan...");
  console.log("Network:", hre.network.name);
  console.log("--------------------------------------------");

  // Load latest deployment data
  const deploymentPath = path.join(__dirname, "..", "deployments", `latest-${hre.network.name}.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment data found for network:", hre.network.name);
    console.error("   Please run 'npm run deploy:amoy' first");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📄 Loaded deployment from:", deployment.deployedAt);
  console.log("--------------------------------------------");

  // Verify EventRegistry
  console.log("\n1. Verifying EventRegistry...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.EventRegistry.address,
      constructorArguments: []
    });
    console.log("✅ EventRegistry verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  EventRegistry already verified");
    } else {
      console.error("❌ EventRegistry verification failed:", error.message);
    }
  }

  // Verify SimpleMarketplace
  console.log("\n2. Verifying SimpleMarketplace...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.SimpleMarketplace.address,
      constructorArguments: deployment.contracts.SimpleMarketplace.constructorArgs
    });
    console.log("✅ SimpleMarketplace verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  SimpleMarketplace already verified");
    } else {
      console.error("❌ SimpleMarketplace verification failed:", error.message);
    }
  }

  // Verify TicketNFT
  console.log("\n3. Verifying TicketNFT...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.TicketNFT.address,
      constructorArguments: deployment.contracts.TicketNFT.constructorArgs
    });
    console.log("✅ TicketNFT verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  TicketNFT already verified");
    } else {
      console.error("❌ TicketNFT verification failed:", error.message);
    }
  }

  console.log("\n🎉 Verification process completed!");
  console.log("\n📍 View contracts on Polygonscan:");
  console.log(`   EventRegistry: https://amoy.polygonscan.com/address/${deployment.contracts.EventRegistry.address}`);
  console.log(`   SimpleMarketplace: https://amoy.polygonscan.com/address/${deployment.contracts.SimpleMarketplace.address}`);
  console.log(`   TicketNFT: https://amoy.polygonscan.com/address/${deployment.contracts.TicketNFT.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
