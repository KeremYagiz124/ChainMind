import { ethers } from "hardhat";
import { ChainMindRegistry, ChainMindToken } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy ChainMindToken
  console.log("\nDeploying ChainMindToken...");
  const ChainMindTokenFactory = await ethers.getContractFactory("ChainMindToken");
  const token = await ChainMindTokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ChainMindToken deployed to:", tokenAddress);

  // Deploy ChainMindRegistry
  console.log("\nDeploying ChainMindRegistry...");
  const ChainMindRegistryFactory = await ethers.getContractFactory("ChainMindRegistry");
  const registry = await ChainMindRegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ChainMindRegistry deployed to:", registryAddress);

  // Verify deployment
  console.log("\nVerifying deployments...");
  
  // Check token details
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const tokenSupply = await token.totalSupply();
  console.log(`Token: ${tokenName} (${tokenSymbol})`);
  console.log(`Initial Supply: ${ethers.formatEther(tokenSupply)} MIND`);

  // Check registry
  const [agentCount, protocolCount, assessmentCount] = await registry.getTotalCounts();
  console.log(`Registry initialized with ${agentCount} agents, ${protocolCount} protocols, ${assessmentCount} assessments`);

  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    deployer: deployer.address,
    contracts: {
      ChainMindToken: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        initialSupply: ethers.formatEther(tokenSupply)
      },
      ChainMindRegistry: {
        address: registryAddress,
        agentCount: agentCount.toString(),
        protocolCount: protocolCount.toString(),
        assessmentCount: assessmentCount.toString()
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Optional: Register a sample AI agent
  if (process.env.REGISTER_SAMPLE_AGENT === "true") {
    console.log("\nRegistering sample AI agent...");
    const tx = await registry.registerAgent(
      "ChainMind Assistant",
      "AI-powered DeFi analysis and portfolio management assistant",
      "QmSampleModelHash123456789"
    );
    await tx.wait();
    console.log("Sample agent registered successfully");
  }

  // Optional: Register a sample protocol
  if (process.env.REGISTER_SAMPLE_PROTOCOL === "true") {
    console.log("\nRegistering sample protocol...");
    const sampleProtocolAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // UNI token as example
    const tx = await registry.registerProtocol(
      sampleProtocolAddress,
      "Uniswap Protocol",
      "Decentralized exchange protocol for automated liquidity provision"
    );
    await tx.wait();
    console.log("Sample protocol registered successfully");
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
