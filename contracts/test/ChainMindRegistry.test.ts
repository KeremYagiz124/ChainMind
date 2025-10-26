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
      // Contract initialized successfully
      const [totalAgents, totalProtocols, totalAssessments] = await chainMindRegistry.getTotalCounts();
      expect(totalAgents).to.equal(0);
    });
  });

  describe("AI Agent Registration", function () {
    it("Should register a new AI agent", async function () {
      const tx = await chainMindRegistry.registerAgent(
        "GPT-4 Agent",
        "Advanced AI agent for DeFi analysis",
        "QmHash123456789"
      );
      
      await expect(tx)
        .to.emit(chainMindRegistry, "AgentRegistered")
        .withArgs(1, owner.address, "GPT-4 Agent");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        chainMindRegistry.registerAgent("", "Description", "QmHash")
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should track agent reputation", async function () {
      await chainMindRegistry.registerAgent(
        "GPT-4 Agent",
        "Advanced AI agent",
        "QmHash123"
      );
      
      const agent = await chainMindRegistry.agents(1);
      expect(agent.reputation).to.equal(100); // Starting reputation
    });

    it("Should allow agent owner to update agent", async function () {
      await chainMindRegistry.connect(addr1).registerAgent(
        "GPT-4 Agent",
        "Description",
        "QmHash"
      );
      
      await chainMindRegistry.connect(addr1).updateAgent(
        1,
        "GPT-4 Plus",
        "Updated description",
        "QmHashNew"
      );
      
      const agent = await chainMindRegistry.getAgent(1);
      expect(agent.name).to.equal("GPT-4 Plus");
    });

    it("Should not allow non-owner to update agent", async function () {
      await chainMindRegistry.connect(addr1).registerAgent(
        "GPT-4 Agent",
        "Description",
        "QmHash"
      );
      
      await expect(
        chainMindRegistry.connect(addr2).updateAgent(
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
        "Leading DEX protocol"
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
          "Description"
        )
      ).to.be.revertedWith("Invalid contract address");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        chainMindRegistry.registerProtocol(
          addr1.address,
          "",
          "Description"
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should allow owner to verify protocol", async function () {
      await chainMindRegistry.registerProtocol(
        addr1.address,
        "Uniswap V3",
        "Leading DEX protocol"
      );
      
      await chainMindRegistry.verifyProtocol(1, true);
      
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
        "Leading DEX protocol"
      );
    });

    it("Should submit a security assessment", async function () {
      const tx = await chainMindRegistry.submitAssessment(
        1, // protocolId
        25, // riskScore
        "QmSecurityReport123"
      );
      
      await expect(tx)
        .to.emit(chainMindRegistry, "AssessmentSubmitted")
        .withArgs(1, 1, owner.address);
    });

    it("Should fail if protocol doesn't exist", async function () {
      await expect(
        chainMindRegistry.submitAssessment(
          999, // Non-existent protocol
          25,
          "QmReport"
        )
      ).to.be.revertedWith("Invalid protocol ID");
    });

    it("Should fail if risk score exceeds 100", async function () {
      await expect(
        chainMindRegistry.submitAssessment(
          1,
          101,
          "QmReport"
        )
      ).to.be.revertedWith("Risk score must be 0-100");
    });

    it("Should allow owner to verify assessment", async function () {
      await chainMindRegistry.submitAssessment(
        1,
        25,
        "QmReport"
      );
      
      await chainMindRegistry.verifyAssessment(1, true);
      
      const assessment = await chainMindRegistry.getAssessment(1);
      expect(assessment.isVerified).to.be.true;
    });

    it("Should update protocol audit count", async function () {
      await chainMindRegistry.submitAssessment(
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
      await chainMindRegistry.connect(addr1).registerAgent(
        "GPT-4 Agent",
        "AI agent",
        "QmHash"
      );
    });

    it("Should update agent reputation", async function () {
      await chainMindRegistry.updateReputation(1, 200);
      
      const agent = await chainMindRegistry.getAgent(1);
      expect(agent.reputation).to.equal(200);
    });

    it("Should not allow non-owner to modify reputation", async function () {
      await expect(
        chainMindRegistry.connect(addr2).updateReputation(1, 200)
      ).to.be.reverted; // Reverted by onlyOwner modifier
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Register multiple agents
      await chainMindRegistry.registerAgent("Agent 1", "Desc 1", "Hash1");
      await chainMindRegistry.registerAgent("Agent 2", "Desc 2", "Hash2");
      await chainMindRegistry.registerAgent("Agent 3", "Desc 3", "Hash3");
      
      // Register multiple protocols
      await chainMindRegistry.registerProtocol(addr1.address, "Protocol 1", "Desc");
      await chainMindRegistry.registerProtocol(addr2.address, "Protocol 2", "Desc");
    });

    it("Should return correct total counts", async function () {
      const [agentCount, protocolCount, assessmentCount] = await chainMindRegistry.getTotalCounts();
      expect(agentCount).to.equal(3);
      expect(protocolCount).to.equal(2);
      expect(assessmentCount).to.equal(0);
    });

    it("Should return user agents", async function () {
      const agents = await chainMindRegistry.getUserAgents(owner.address);
      expect(agents.length).to.equal(3);
    });

    it("Should verify protocol correctly", async function () {
      await chainMindRegistry.verifyProtocol(1, true);
      
      const protocol = await chainMindRegistry.getProtocol(1);
      expect(protocol.isVerified).to.be.true;
    });
  });
});
