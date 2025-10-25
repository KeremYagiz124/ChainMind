// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ChainMindToken
 * @dev ERC20 token for ChainMind ecosystem with staking and rewards
 */
contract ChainMindToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million tokens

    // Staking variables
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public rewards;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% per year (100 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // AI Agent rewards
    mapping(address => uint256) public agentRewards;
    mapping(uint256 => address) public agentOwners; // agentId => owner
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event AgentRewarded(address indexed owner, uint256 agentId, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    constructor() ERC20("ChainMind Token", "MIND") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Pause token transfers
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Mint new tokens (only owner, respects max supply)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Stake tokens to earn rewards
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Update rewards before changing stake
        updateRewards(msg.sender);

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);

        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");

        // Update rewards before changing stake
        updateRewards(msg.sender);

        // Update stake info
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        updateRewards(msg.sender);
        
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        
        // Mint reward tokens
        require(totalSupply() + reward <= MAX_SUPPLY, "Exceeds max supply");
        _mint(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @dev Update rewards for a user
     */
    function updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount > 0) {
            uint256 timeStaked = block.timestamp - userStake.timestamp;
            uint256 reward = (userStake.amount * rewardRate * timeStaked) / (10000 * SECONDS_PER_YEAR);
            
            rewards[user] += reward;
            userStake.timestamp = block.timestamp;
        }
    }

    /**
     * @dev Reward AI agent owner for good performance
     */
    function rewardAgent(uint256 agentId, address owner, uint256 amount) external onlyOwner {
        require(owner != address(0), "Invalid owner address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        agentOwners[agentId] = owner;
        agentRewards[owner] += amount;
        
        _mint(owner, amount);

        emit AgentRewarded(owner, agentId, amount);
    }

    /**
     * @dev Set reward rate (only owner)
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate cannot exceed 20%"); // Max 20% APY
        rewardRate = newRate;
        
        emit RewardRateUpdated(newRate);
    }

    /**
     * @dev Get pending rewards for a user
     */
    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) {
            return rewards[user];
        }

        uint256 timeStaked = block.timestamp - userStake.timestamp;
        uint256 pendingReward = (userStake.amount * rewardRate * timeStaked) / (10000 * SECONDS_PER_YEAR);
        
        return rewards[user] + pendingReward;
    }

    /**
     * @dev Get staking info for a user
     */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 timestamp, uint256 pendingRewards) {
        StakeInfo memory userStake = stakes[user];
        uint256 pending = this.getPendingRewards(user);
        
        return (userStake.amount, userStake.timestamp, pending);
    }

    /**
     * @dev Get total agent rewards for an owner
     */
    function getAgentRewards(address owner) external view returns (uint256) {
        return agentRewards[owner];
    }

    /**
     * @dev Calculate APY based on current reward rate
     */
    function getCurrentAPY() external view returns (uint256) {
        return rewardRate; // Returns in basis points (100 = 1%)
    }

    /**
     * @dev Get staking statistics
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSupply,
        uint256 _stakingRatio,
        uint256 _rewardRate
    ) {
        uint256 stakingRatio = totalSupply() > 0 ? (totalStaked * 10000) / totalSupply() : 0;
        
        return (totalStaked, totalSupply(), stakingRatio, rewardRate);
    }

    /**
     * @dev Override transfer functions to include pause functionality
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = balanceOf(address(this));
        if (balance > 0) {
            _transfer(address(this), owner(), balance);
        }
    }

    /**
     * @dev Batch reward multiple agents
     */
    function batchRewardAgents(
        uint256[] calldata agentIds,
        address[] calldata owners,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            agentIds.length == owners.length && owners.length == amounts.length,
            "Array lengths must match"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < agentIds.length; i++) {
            require(owners[i] != address(0), "Invalid owner address");
            require(amounts[i] > 0, "Amount must be greater than 0");

            agentOwners[agentIds[i]] = owners[i];
            agentRewards[owners[i]] += amounts[i];
            
            _mint(owners[i], amounts[i]);

            emit AgentRewarded(owners[i], agentIds[i], amounts[i]);
        }
    }
}
