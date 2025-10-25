// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ChainMindRegistry
 * @dev Registry contract for managing AI agents, protocols, and security assessments
 */
contract ChainMindRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct AIAgent {
        uint256 id;
        address owner;
        string name;
        string description;
        string modelHash;
        uint256 reputation;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Protocol {
        uint256 id;
        address contractAddress;
        string name;
        string description;
        uint8 riskScore; // 0-100
        bool isVerified;
        uint256 auditCount;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct SecurityAssessment {
        uint256 id;
        uint256 protocolId;
        address assessor;
        uint8 riskScore;
        string reportHash;
        bool isVerified;
        uint256 createdAt;
    }

    // Counters
    Counters.Counter private _agentIds;
    Counters.Counter private _protocolIds;
    Counters.Counter private _assessmentIds;

    // Mappings
    mapping(uint256 => AIAgent) public agents;
    mapping(uint256 => Protocol) public protocols;
    mapping(uint256 => SecurityAssessment) public assessments;
    mapping(address => uint256[]) public userAgents;
    mapping(address => uint256[]) public protocolsByAddress;
    mapping(uint256 => uint256[]) public protocolAssessments;

    // Events
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name);
    event AgentUpdated(uint256 indexed agentId, string name, string description);
    event AgentDeactivated(uint256 indexed agentId);
    event ProtocolRegistered(uint256 indexed protocolId, address indexed contractAddress, string name);
    event ProtocolVerified(uint256 indexed protocolId, bool verified);
    event AssessmentSubmitted(uint256 indexed assessmentId, uint256 indexed protocolId, address indexed assessor);
    event AssessmentVerified(uint256 indexed assessmentId, bool verified);
    event ReputationUpdated(uint256 indexed agentId, uint256 newReputation);

    // Modifiers
    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        _;
    }

    modifier validAgent(uint256 agentId) {
        require(agentId > 0 && agentId <= _agentIds.current(), "Invalid agent ID");
        require(agents[agentId].isActive, "Agent not active");
        _;
    }

    modifier validProtocol(uint256 protocolId) {
        require(protocolId > 0 && protocolId <= _protocolIds.current(), "Invalid protocol ID");
        _;
    }

    /**
     * @dev Register a new AI agent
     */
    function registerAgent(
        string memory name,
        string memory description,
        string memory modelHash
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(modelHash).length > 0, "Model hash cannot be empty");

        _agentIds.increment();
        uint256 agentId = _agentIds.current();

        agents[agentId] = AIAgent({
            id: agentId,
            owner: msg.sender,
            name: name,
            description: description,
            modelHash: modelHash,
            reputation: 100, // Starting reputation
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        userAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name);
        return agentId;
    }

    /**
     * @dev Update an existing AI agent
     */
    function updateAgent(
        uint256 agentId,
        string memory name,
        string memory description,
        string memory modelHash
    ) external onlyAgentOwner(agentId) validAgent(agentId) {
        require(bytes(name).length > 0, "Name cannot be empty");

        AIAgent storage agent = agents[agentId];
        agent.name = name;
        agent.description = description;
        if (bytes(modelHash).length > 0) {
            agent.modelHash = modelHash;
        }
        agent.updatedAt = block.timestamp;

        emit AgentUpdated(agentId, name, description);
    }

    /**
     * @dev Deactivate an AI agent
     */
    function deactivateAgent(uint256 agentId) external onlyAgentOwner(agentId) {
        agents[agentId].isActive = false;
        agents[agentId].updatedAt = block.timestamp;

        emit AgentDeactivated(agentId);
    }

    /**
     * @dev Register a new protocol
     */
    function registerProtocol(
        address contractAddress,
        string memory name,
        string memory description
    ) external returns (uint256) {
        require(contractAddress != address(0), "Invalid contract address");
        require(bytes(name).length > 0, "Name cannot be empty");

        _protocolIds.increment();
        uint256 protocolId = _protocolIds.current();

        protocols[protocolId] = Protocol({
            id: protocolId,
            contractAddress: contractAddress,
            name: name,
            description: description,
            riskScore: 50, // Default medium risk
            isVerified: false,
            auditCount: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        protocolsByAddress[contractAddress].push(protocolId);

        emit ProtocolRegistered(protocolId, contractAddress, name);
        return protocolId;
    }

    /**
     * @dev Submit a security assessment
     */
    function submitAssessment(
        uint256 protocolId,
        uint8 riskScore,
        string memory reportHash
    ) external validProtocol(protocolId) returns (uint256) {
        require(riskScore <= 100, "Risk score must be 0-100");
        require(bytes(reportHash).length > 0, "Report hash cannot be empty");

        _assessmentIds.increment();
        uint256 assessmentId = _assessmentIds.current();

        assessments[assessmentId] = SecurityAssessment({
            id: assessmentId,
            protocolId: protocolId,
            assessor: msg.sender,
            riskScore: riskScore,
            reportHash: reportHash,
            isVerified: false,
            createdAt: block.timestamp
        });

        protocolAssessments[protocolId].push(assessmentId);
        protocols[protocolId].auditCount++;

        emit AssessmentSubmitted(assessmentId, protocolId, msg.sender);
        return assessmentId;
    }

    /**
     * @dev Verify a protocol (only owner)
     */
    function verifyProtocol(uint256 protocolId, bool verified) external onlyOwner validProtocol(protocolId) {
        protocols[protocolId].isVerified = verified;
        protocols[protocolId].updatedAt = block.timestamp;

        emit ProtocolVerified(protocolId, verified);
    }

    /**
     * @dev Verify an assessment (only owner)
     */
    function verifyAssessment(uint256 assessmentId, bool verified) external onlyOwner {
        require(assessmentId > 0 && assessmentId <= _assessmentIds.current(), "Invalid assessment ID");

        assessments[assessmentId].isVerified = verified;

        emit AssessmentVerified(assessmentId, verified);
    }

    /**
     * @dev Update agent reputation (only owner)
     */
    function updateReputation(uint256 agentId, uint256 newReputation) external onlyOwner validAgent(agentId) {
        require(newReputation <= 1000, "Reputation cannot exceed 1000");

        agents[agentId].reputation = newReputation;
        agents[agentId].updatedAt = block.timestamp;

        emit ReputationUpdated(agentId, newReputation);
    }

    /**
     * @dev Get agent details
     */
    function getAgent(uint256 agentId) external view returns (AIAgent memory) {
        require(agentId > 0 && agentId <= _agentIds.current(), "Invalid agent ID");
        return agents[agentId];
    }

    /**
     * @dev Get protocol details
     */
    function getProtocol(uint256 protocolId) external view returns (Protocol memory) {
        require(protocolId > 0 && protocolId <= _protocolIds.current(), "Invalid protocol ID");
        return protocols[protocolId];
    }

    /**
     * @dev Get assessment details
     */
    function getAssessment(uint256 assessmentId) external view returns (SecurityAssessment memory) {
        require(assessmentId > 0 && assessmentId <= _assessmentIds.current(), "Invalid assessment ID");
        return assessments[assessmentId];
    }

    /**
     * @dev Get user's agents
     */
    function getUserAgents(address user) external view returns (uint256[] memory) {
        return userAgents[user];
    }

    /**
     * @dev Get protocols by contract address
     */
    function getProtocolsByAddress(address contractAddress) external view returns (uint256[] memory) {
        return protocolsByAddress[contractAddress];
    }

    /**
     * @dev Get assessments for a protocol
     */
    function getProtocolAssessments(uint256 protocolId) external view returns (uint256[] memory) {
        return protocolAssessments[protocolId];
    }

    /**
     * @dev Get total counts
     */
    function getTotalCounts() external view returns (uint256 agents, uint256 protocols, uint256 assessments) {
        return (_agentIds.current(), _protocolIds.current(), _assessmentIds.current());
    }

    /**
     * @dev Calculate average risk score for a protocol
     */
    function getProtocolAverageRisk(uint256 protocolId) external view validProtocol(protocolId) returns (uint8) {
        uint256[] memory assessmentIds = protocolAssessments[protocolId];
        if (assessmentIds.length == 0) {
            return protocols[protocolId].riskScore;
        }

        uint256 totalRisk = 0;
        uint256 verifiedCount = 0;

        for (uint256 i = 0; i < assessmentIds.length; i++) {
            SecurityAssessment memory assessment = assessments[assessmentIds[i]];
            if (assessment.isVerified) {
                totalRisk += assessment.riskScore;
                verifiedCount++;
            }
        }

        if (verifiedCount == 0) {
            return protocols[protocolId].riskScore;
        }

        return uint8(totalRisk / verifiedCount);
    }
}
