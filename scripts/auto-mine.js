/**
 * Script to periodically mine blocks on a local Hardhat network
 * This ensures transactions get confirmed even when no new transactions are being sent
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Starting auto-mining script...");
  console.log("ℹ️ This script will send a small transaction every 5 seconds to ensure blocks are mined");

  // Get the first signer account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Create a second account to send transactions to
  const recipient = ethers.Wallet.createRandom().connect(ethers.provider);

  while (true) {
    try {
      // Send a tiny amount of ETH to the recipient to trigger block mining
      const tx = await deployer.sendTransaction({
        to: recipient.address,
        value: ethers.parseEther("0.0001"),
      });

      // Wait for the transaction to be mined
      await tx.wait();

      console.log(`Block mined: ${await ethers.provider.getBlockNumber()}`);

      // Wait 5 seconds before mining the next block
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err) {
      console.error("Error mining block:", err);
      // Wait a bit before trying again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

main().catch((error) => {
  console.error("Auto-mining script failed:", error);
  process.exit(1);
});
