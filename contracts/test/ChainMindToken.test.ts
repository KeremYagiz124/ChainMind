import { expect } from "chai";
import { ethers } from "hardhat";
import { ChainMindToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ChainMindToken", function () {
  let token: ChainMindToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const STAKE_AMOUNT = ethers.parseEther("1000");
  const REWARD_RATE = 10; // 10% APY

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const ChainMindTokenFactory = await ethers.getContractFactory("ChainMindToken");
    token = await ChainMindTokenFactory.deploy(); // Constructor has no parameters
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("ChainMind Token");
      expect(await token.symbol()).to.equal("CMIND");
    });

    it("Should have 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.transfer(addr1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      
      await expect(
        token.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should emit Transfer event", async function () {
      await expect(token.transfer(addr1.address, ethers.parseEther("100")))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, ethers.parseEther("100"));
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer tokens to addr1 for staking
      await token.transfer(addr1.address, STAKE_AMOUNT);
    });

    it("Should allow users to stake tokens", async function () {
      await token.connect(addr1).stake(STAKE_AMOUNT);
      
      const stakeInfo = await token.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(STAKE_AMOUNT);
      expect(stakeInfo.isActive).to.be.true;
    });

    it("Should emit Staked event", async function () {
      await expect(token.connect(addr1).stake(STAKE_AMOUNT))
        .to.emit(token, "Staked")
        .withArgs(addr1.address, STAKE_AMOUNT);
    });

    it("Should fail if staking zero amount", async function () {
      await expect(
        token.connect(addr1).stake(0)
      ).to.be.revertedWith("Cannot stake 0");
    });

    it("Should fail if insufficient balance", async function () {
      const tooMuch = STAKE_AMOUNT + ethers.parseEther("1");
      await expect(
        token.connect(addr1).stake(tooMuch)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should transfer tokens from user to contract", async function () {
      const initialBalance = await token.balanceOf(addr1.address);
      const contractAddress = await token.getAddress();
      
      await token.connect(addr1).stake(STAKE_AMOUNT);
      
      expect(await token.balanceOf(addr1.address)).to.equal(initialBalance - STAKE_AMOUNT);
      expect(await token.balanceOf(contractAddress)).to.equal(STAKE_AMOUNT);
    });

    it("Should update total staked amount", async function () {
      await token.connect(addr1).stake(STAKE_AMOUNT);
      expect(await token.totalStaked()).to.equal(STAKE_AMOUNT);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await token.connect(addr1).stake(STAKE_AMOUNT);
    });

    it("Should allow users to unstake tokens", async function () {
      // Fast forward time
      await time.increase(86400); // 1 day
      
      await token.connect(addr1).unstake();
      
      const stakeInfo = await token.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(0);
      expect(stakeInfo.isActive).to.be.false;
    });

    it("Should emit Unstaked event", async function () {
      await time.increase(86400);
      
      await expect(token.connect(addr1).unstake())
        .to.emit(token, "Unstaked")
        .withArgs(addr1.address, STAKE_AMOUNT);
    });

    it("Should return staked tokens to user", async function () {
      const initialBalance = await token.balanceOf(addr1.address);
      await time.increase(86400);
      
      await token.connect(addr1).unstake();
      
      expect(await token.balanceOf(addr1.address)).to.be.gte(STAKE_AMOUNT);
    });

    it("Should fail if no active stake", async function () {
      await expect(
        token.connect(addr2).unstake()
      ).to.be.revertedWith("No active stake");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await token.connect(addr1).stake(STAKE_AMOUNT);
    });

    it("Should calculate rewards correctly", async function () {
      await time.increase(86400 * 365); // 1 year
      
      const rewards = await token.calculateRewards(addr1.address);
      expect(rewards).to.be.gt(0);
    });

    it("Should allow users to claim rewards", async function () {
      await time.increase(86400 * 30); // 30 days
      
      const balanceBefore = await token.balanceOf(addr1.address);
      await token.connect(addr1).claimRewards();
      const balanceAfter = await token.balanceOf(addr1.address);
      
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should emit RewardsClaimed event", async function () {
      await time.increase(86400 * 30);
      
      const tx = await token.connect(addr1).claimRewards();
      await expect(tx).to.emit(token, "RewardsClaimed");
    });

    it("Should reset reward timestamp after claiming", async function () {
      await time.increase(86400 * 30);
      await token.connect(addr1).claimRewards();
      
      const stakeInfo = await token.getStakeInfo(addr1.address);
      const currentTime = await time.latest();
      expect(stakeInfo.lastRewardTimestamp).to.be.closeTo(currentTime, 10);
    });

    it("Should fail to claim if no rewards available", async function () {
      // Claim immediately after staking
      await expect(
        token.connect(addr1).claimRewards()
      ).to.be.revertedWith("No rewards available");
    });
  });

  describe("Governance", function () {
    beforeEach(async function () {
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await token.connect(addr1).stake(STAKE_AMOUNT);
    });

    it("Should create a proposal", async function () {
      const description = "Increase reward rate to 15%";
      
      await expect(token.connect(addr1).createProposal(description))
        .to.emit(token, "ProposalCreated");
    });

    it("Should fail if non-staker tries to create proposal", async function () {
      await expect(
        token.connect(addr2).createProposal("Test proposal")
      ).to.be.revertedWith("Must be staker");
    });

    it("Should allow stakers to vote on proposals", async function () {
      await token.connect(addr1).createProposal("Test proposal");
      
      await expect(token.connect(addr1).vote(1, true))
        .to.emit(token, "Voted");
    });

    it("Should track votes correctly", async function () {
      await token.connect(addr1).createProposal("Test proposal");
      await token.connect(addr1).vote(1, true);
      
      const proposal = await token.getProposal(1);
      expect(proposal.votesFor).to.equal(STAKE_AMOUNT);
      expect(proposal.votesAgainst).to.equal(0);
    });

    it("Should not allow double voting", async function () {
      await token.connect(addr1).createProposal("Test proposal");
      await token.connect(addr1).vote(1, true);
      
      await expect(
        token.connect(addr1).vote(1, false)
      ).to.be.revertedWith("Already voted");
    });

    it("Should execute proposal if passed", async function () {
      // Transfer tokens to multiple stakers
      await token.transfer(addr1.address, ethers.parseEther("5000"));
      await token.transfer(addr2.address, ethers.parseEther("3000"));
      
      await token.connect(addr1).stake(ethers.parseEther("5000"));
      await token.connect(addr2).stake(ethers.parseEther("3000"));
      
      await token.connect(addr1).createProposal("Test proposal");
      await token.connect(addr1).vote(1, true);
      await token.connect(addr2).vote(1, true);
      
      await time.increase(86400 * 7); // Fast forward 7 days
      
      await expect(token.executeProposal(1))
        .to.emit(token, "ProposalExecuted");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set reward rate", async function () {
      await token.setRewardRate(15);
      expect(await token.rewardRate()).to.equal(15);
    });

    it("Should not allow non-owner to set reward rate", async function () {
      await expect(
        token.connect(addr1).setRewardRate(15)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause staking", async function () {
      await token.pauseStaking();
      
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await expect(
        token.connect(addr1).stake(STAKE_AMOUNT)
      ).to.be.revertedWith("Staking is paused");
    });

    it("Should allow owner to unpause staking", async function () {
      await token.pauseStaking();
      await token.unpauseStaking();
      
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await token.connect(addr1).stake(STAKE_AMOUNT);
      
      expect(await token.totalStaked()).to.equal(STAKE_AMOUNT);
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow owner to emergency withdraw", async function () {
      await token.transfer(addr1.address, STAKE_AMOUNT);
      await token.connect(addr1).stake(STAKE_AMOUNT);
      
      const contractAddress = await token.getAddress();
      const balanceBefore = await token.balanceOf(owner.address);
      
      await token.emergencyWithdraw();
      
      const balanceAfter = await token.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should not allow non-owner to emergency withdraw", async function () {
      await expect(
        token.connect(addr1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});
