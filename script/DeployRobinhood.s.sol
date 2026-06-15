// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/contracts/MockUSDY.sol";
import "../src/contracts/IdeaTokenFactory.sol";
import "../src/contracts/IdeaFactory.sol";
import "../src/contracts/FundingPoolFactory.sol";

contract DeployRobinhood is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);
        
        // AI agent address - defaults to deployer if not specified
        address aiAgent;
        string memory aiAgentStr = vm.envOr("AI_AGENT_ADDRESS_STR", string(""));
        if (bytes(aiAgentStr).length == 42) {
            aiAgent = vm.parseAddress(aiAgentStr);
        } else {
            aiAgent = deployer;
        }

        console2.log("==========================================");
        console2.log("  ROBINHOOD TESTNET DEPLOYMENT");
        console2.log("==========================================");
        console2.log("Deployer:", deployer);
        console2.log("AI Agent:", aiAgent);

        vm.startBroadcast(deployerKey);
        
        // Deploy MockUSDY first
        MockUSDY usdy = new MockUSDY(deployer);
        console2.log("MockUSDY:", address(usdy));
        
        // Deploy FundingPoolFactory
        FundingPoolFactory fundingPoolFactory = new FundingPoolFactory(deployer);
        console2.log("FundingPoolFactory:", address(fundingPoolFactory));
        
        // Deploy IdeaTokenFactory  
        IdeaTokenFactory ideaTokenFactory = new IdeaTokenFactory(deployer);
        console2.log("IdeaTokenFactory:", address(ideaTokenFactory));
        
        // Deploy IdeaFactory with USDY
        IdeaFactory ideaFactory = new IdeaFactory(address(usdy), deployer, deployer);
        console2.log("IdeaFactory:", address(ideaFactory));
        
        // Set factories on IdeaFactory
        ideaFactory.setFactories(address(fundingPoolFactory), address(ideaTokenFactory));
        console2.log("Factories set on IdeaFactory");
        
        // Set AI agent
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
        console2.log("Robinhood Testnet Addresses:");
        console2.log("  USDY_RHC=", address(usdy));
        console2.log("  IDEA_FACTORY_RHC=", address(ideaFactory));
        console2.log("  FUNDING_POOL_FACTORY_RHC=", address(fundingPoolFactory));
        console2.log("  IDEA_TOKEN_FACTORY_RHC=", address(ideaTokenFactory));
        console2.log("==========================================");

        vm.stopBroadcast();
    }
}
