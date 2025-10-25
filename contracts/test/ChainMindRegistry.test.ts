import { expect } from "chai";
import { ethers } from "hardhat";
import { ChainMindRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ChainMindRegistry", function () {
  let chainMindRegistry: ChainMindRegistry;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const ChainMindRegistryFactory = await ethers.getContractFactory("ChainMindRegistry");
    chainMindRegistry = await ChainMindRegistryFactory.deploy();
    await chainMindRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await chainMindRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero counters", async function () {
      // Verify no AI agents exist initially
      const agentCount = await chainMindRegistry.getActiveAgentsCount();
      expect(agentCount).to.equal(0);
    });
  });

  describe("AI Agent Registration", function () {
    it("Should register a new AI agent", async function () {
      const tx = await chainMindRegistry.registerAIAgent(
        "GPT-4 Agent",
        "Advanced AI agent for DeFi analysis",
        "QmHash123456789"
      );
      
      await expect(tx)
        .to.emit(chainMindRegistry, "AIAgentRegistered")
        .withArgs(1, addr1.address, "GPT-4 Agent");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        chainMindRegistry.registerAIAgent("", "Description", "QmHash")
      ).to.be.revertedWith("Name required");
    });

    it("Should track agent reputation", async function () {
      await chainMindRegistry.registerAIAgent(
        "GPT-4 Agent",
        "Advanced AI agent",
        "QmHash123"
      );
      
      const agent = await chainMindRegistry.getAIAgent(1);
      expect(agent.reputation).to.equal(0);
    });

    it("Should allow agent owner to update agent", async function () {
      await chainMindRegistry.connect(addr1).registerAIAgent(
        "GPT-4 Agent",
        "Description",
        "QmHash"
      );
      
      await chainMindRegistry.connect(addr1).updateAIAgent(
        1,
        "GPT-4 Plus",
        "Updated description",
        "QmHashNew"
      );
      
      const agent = await chainMindRegistry.getAIAgent(1);
      expect(agent.name).to.equal("GPT-4 Plus");
    });

    it("Should not allow non-owner to update agent", async function () {
      await chainMindRegistry.connect(addr1).registerAIAgent(
        "GPT-4 Agent",
        "Description",
        "QmHash"
      );
      
      await expect(
        chainMindRegistry.connect(addr2).updateAIAgent(
          1,
          "GPT-4 Plus",
          "Updated description",
          "QmHashNew"
        )
      ).to.be.revertedWith("Not agent owner");
    });
  });

  describe("Protocol Registration", function () {
    it("Should register a new protocol", async function () {
      const protocolAddress = addr1.address;
      
      const tx = await chainMindRegistry.registerProtocol(
        protocolAddress,
        "Uniswap V3",
        "Leading DEX protocol",
        30 // Risk score
      );
      
      await expect(tx)
        .to.emit(chainMindRegistry, "ProtocolRegistered")
        .withArgs(1, protocolAddress, "Uniswap V3");
    });

    it("Should fail if protocol address is zero", async function () {
      await expect(
        chainMindRegistry.registerProtocol(
          ethers.ZeroAddress,
          "Protocol",
          "Description",
          50
        )
      ).to.be.revertedWith("Invalid address");
    });

    it("Should fail if risk score exceeds 100", async function () {
      await expect(
        chainMindRegistry.registerProtocol(
          addr1.address,
          "Protocol",
          "Description",
          101
        )
      ).to.be.revertedWith("Invalid risk score");
    });

    it("Should allow owner to verify protocol", async function () {
      await chainMindRegistry.registerProtocol(
        addr1.address,
        "Uniswap V3",
        "Leading DEX protocol",
        30
      );
      
      await chainMindRegistry.verifyProtocol(1);
      
      const protocol = await chainMindRegistry.getProtocol(1);
      expect(protocol.isVerified).to.be.true;
    });
  });

  describe("Security Assessment", function () {
    beforeEach(async function () {
      // Register a protocol first
      await chainMindRegistry.registerProtocol(
        addr1.address,
        "Uniswap V3",
        "Leading DEX protocol",
        30
      );
    });

    it("Should submit a security assessment", async function () {
      const tx = await chainMindRegistry.submitSecurityAssessment(
        1, // protocolId
        25, // riskScore
        "QmSecurityReport123"
      );
      
      await expect(tx)
        .to.emit(chainMindRegistry, "SecurityAssessmentSubmitted")
        .withArgs(1, 1, owner.address, 25);
    });

    it("Should fail if protocol doesn't exist", async function () {
      await expect(
        chainMindRegistry.submitSecurityAssessment(
          999, // Non-existent protocol
          25,
          "QmReport"
        )
      ).to.be.revertedWith("Protocol not found");
    });

    it("Should fail if risk score exceeds 100", async function () {
      await expect(
        chainMindRegistry.submitSecurityAssessment(
          1,
          101,
          "QmReport"
        )
      ).to.be.revertedWith("Invalid risk score");
    });

    it("Should allow owner to verify assessment", async function () {
      await chainMindRegistry.submitSecurityAssessment(
        1,
        25,
        "QmReport"
      );
      
      await chainMindRegistry.verifySecurityAssessment(1);
      
      const assessment = await chainMindRegistry.getSecurityAssessment(1);
      expect(assessment.isVerified).to.be.true;
    });

    it("Should update protocol audit count", async function () {
      await chainMindRegistry.submitSecurityAssessment(
        1,
        25,
        "QmReport"
      );
      
      const protocol = await chainMindRegistry.getProtocol(1);
      expect(protocol.auditCount).to.equal(1);
    });
  });

  describe("Reputation System", function () {
    beforeEach(async function () {
      await chainMindRegistry.connect(addr1).registerAIAgent(
        "GPT-4 Agent",
        "AI agent",
        "QmHash"
      );
    });

    it("Should increase agent reputation", async function () {
      await chainMindRegistry.increaseReputation(1, 10);
      
      const agent = await chainMindRegistry.getAIAgent(1);
      expect(agent.reputation).to.equal(10);
    });

    it("Should decrease agent reputation", async function () {
      await chainMindRegistry.increaseReputation(1, 20);
      await chainMindRegistry.decreaseReputation(1, 5);
      
      const agent = await chainMindRegistry.getAIAgent(1);
      expect(agent.reputation).to.equal(15);
    });

    it("Should not allow non-owner to modify reputation", async function () {
      await expect(
        chainMindRegistry.connect(addr1).increaseReputation(1, 10)
      ).to.be.revertedWithCustomError(chainMindRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Register multiple agents
      await chainMindRegistry.registerAIAgent("Agent 1", "Desc 1", "Hash1");
      await chainMindRegistry.registerAIAgent("Agent 2", "Desc 2", "Hash2");
      await chainMindRegistry.registerAIAgent("Agent 3", "Desc 3", "Hash3");
      
      // Register multiple protocols
      await chainMindRegistry.registerProtocol(addr1.address, "Protocol 1", "Desc", 30);
      await chainMindRegistry.registerProtocol(addr2.address, "Protocol 2", "Desc", 50);
    });

    it("Should return correct active agents count", async function () {
      const count = await chainMindRegistry.getActiveAgentsCount();
      expect(count).to.equal(3);
    });

    it("Should return correct protocols count", async function () {
      const count = await chainMindRegistry.getProtocolsCount();
      expect(count).to.equal(2);
    });

    it("Should return agent by owner address", async function () {
      const agents = await chainMindRegistry.getAgentsByOwner(owner.address);
      expect(agents.length).to.equal(3);
    });

    it("Should return verified protocols only", async function () {
      await chainMindRegistry.verifyProtocol(1);
      
      const verified = await chainMindRegistry.getVerifiedProtocols();
      expect(verified.length).to.equal(1);
      expect(verified[0].name).to.equal("Protocol 1");
    });
  });
});
