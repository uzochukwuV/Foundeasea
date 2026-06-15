// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FundingGate.sol";
import "./FundingPool.sol";
import "./interfaces/IFundingPoolFactory.sol";

contract FundingPoolFactory is Ownable, IFundingPoolFactory {
    constructor(address initialOwner) Ownable(initialOwner) {}

    event FundingPoolCreated(
        uint256 indexed ideaId,
        address fundingPool,
        address fundingGate,
        uint256 softCap,
        uint256 hardCap
    );

    function createFundingPool(
        uint256 ideaId,
        address usdy,
        address creator,
        uint256 softCap,
        uint256 hardCap,
        uint256 competitionPrizeBps,
        address treasury
    ) external override returns (address fundingPool, address fundingGate) {
        address gate = address(new FundingGate(creator, msg.sender));

        // Deploy pool with creator as owner (they can manage milestones)
        FundingPool pool = new FundingPool(
            usdy,
            gate,
            creator,  // Creator becomes owner
            softCap,
            hardCap,
            competitionPrizeBps,
            address(0)  // Start with zero factory - will be set by IdeaFactory
        );
        
        fundingPool = address(pool);
        fundingGate = gate;

        emit FundingPoolCreated(ideaId, fundingPool, fundingGate, softCap, hardCap);
    }

    function setIdeaTokenOnPool(address fundingPool, address ideaToken) external {
        // Anyone can set idea token on a pool - it just needs to be done once
        // Security is enforced by the factory address check in IdeaFactory
        FundingPool(fundingPool).setIdeaToken(ideaToken);
    }
}