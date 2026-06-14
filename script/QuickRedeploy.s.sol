// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/contracts/IdeaTokenFactory.sol";
import "../src/contracts/IdeaFactory.sol";
import "../src/contracts/FundingPoolFactory.sol";

contract FullRedeploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);
        address usdy = vm.envAddress("USDY_ADDRESS");
        
        // AI agent address - must be passed as constructor arg
        address aiAgent;
        string memory aiAgentStr = vm.envOr("AI_AGENT_ADDRESS_STR", string(""));
        if (bytes(aiAgentStr).length == 42) {
            aiAgent = vm.parseAddress(aiAgentStr);
        } else {
            aiAgent = deployer; // Default to deployer if not specified
        }

        console2.log("==========================================");
        console2.log("  FULL REDEPLOY (with fixed FundingPoolFactory)");
        console2.log("==========================================");
        console2.log("Deployer:", deployer);
        console2.log("USDY:", usdy);
        console2.log("AI Agent:", aiAgent);

        vm.startBroadcast(deployerKey);
        
        // Deploy new FundingPoolFactory (with fix - creator becomes owner)
        FundingPoolFactory fundingPoolFactory = new FundingPoolFactory(deployer);
        console2.log("FundingPoolFactory:", address(fundingPoolFactory));
        
        // Deploy new IdeaTokenFactory  
        IdeaTokenFactory ideaTokenFactory = new IdeaTokenFactory(deployer);
        console2.log("IdeaTokenFactory:", address(ideaTokenFactory));
        
        // Deploy new IdeaFactory
        IdeaFactory ideaFactory = new IdeaFactory(usdy, deployer, deployer);
        console2.log("IdeaFactory:", address(ideaFactory));
        
        // Set factories on IdeaFactory FIRST (deployer is still owner)
        ideaFactory.setFactories(address(fundingPoolFactory), address(ideaTokenFactory));
        console2.log("Factories set on IdeaFactory");
        
        // Set AI agent address (deployer is still owner)
        ideaFactory.setAiAgent(aiAgent);
        console2.log("AI Agent set:", aiAgent);
        
        // Set treasury
        ideaFactory.setTreasury(aiAgent);
        console2.log("Treasury set:", aiAgent);

        // Transfer ownership of factories to IdeaFactory
        fundingPoolFactory.transferOwnership(address(ideaFactory));
        ideaTokenFactory.transferOwnership(address(ideaFactory));
        console2.log("Ownership transferred to IdeaFactory");
        
        console2.log("==========================================");
        console2.log("New Addresses:");
        console2.log("  IDEA_FACTORY_MANTLE=", address(ideaFactory));
        console2.log("  FUNDING_POOL_FACTORY_MANTLE=", address(fundingPoolFactory));
        console2.log("  IDEA_TOKEN_FACTORY_MANTLE=", address(ideaTokenFactory));
        console2.log("==========================================");

        vm.stopBroadcast();
    }
}