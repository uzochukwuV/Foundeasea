import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ContractService } from '../blockchain/contract.service';
import { IdeaService } from '../ideas/idea.service';
import { AgentService } from '../agents/agent.service';
import axios from 'axios';

@Injectable()
export class OnboardingService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingService.name);
  private pinataApiKey: string;
  private pinataApiSecret: string;

  constructor(
    private contractService: ContractService,
    private ideaService: IdeaService,
    private agentService: AgentService,
  ) {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataApiSecret = process.env.PINATA_SECRET || '';
  }

  async onModuleInit() {
    // Check if we should seed an idea on startup
    const seedOnStartup = process.env.SEED_IDEA_ON_STARTUP !== 'false'; // Default to true
    
    if (!seedOnStartup) {
      this.logger.log('Skipping idea seeding (SEED_IDEA_ON_STARTUP=false)');
      return;
    }

    try {
      // Check if ideas already exist
      const existingIdeas = await this.checkExistingIdeas();
      if (existingIdeas > 0) {
        this.logger.log(`Found ${existingIdeas} existing ideas, skipping seed`);
        return;
      }

      this.logger.log('🚀 Seeding demo idea on startup...');
      await this.seedDemoIdea();
    } catch (error: any) {
      this.logger.warn('⚠️ Could not seed demo idea (RPC may not support write operations):', error.message);
      this.logger.log('💡 Tip: Backend is running for read operations. Use frontend to create ideas.');
    }
  }

  private async checkExistingIdeas(): Promise<number> {
    try {
      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();
      const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi as any);
      const nextIdeaId = await this.contractService.readContract(ideaFactoryAddress, abi, 'nextIdeaId', []);
      return Number(nextIdeaId);
    } catch (error: any) {
      this.logger.warn('Failed to check existing ideas:', error.message);
      return 0;
    }
  }

  private async seedDemoIdea() {
    const demoIdea = {
      title: 'Decentralized AI Research Grant Platform',
      description: 'A blockchain-based platform where researchers can submit grant proposals and receive funding through DAO voting. AI agents evaluate proposals for feasibility, novelty, and potential impact. Funded projects progress through milestone-based funding with automatic release upon AI validation.',
      category: 'Web3',
      targetRaise: 500000,
      softCap: 150000,
      hardCap: 750000,
      fundingDays: 45,
    };

    this.logger.log(`Creating demo idea: "${demoIdea.title}"`);

    // Step 0: Ensure AI agent has USDY and approved IdeaFactory
    this.logger.log('Step 0: Ensuring AI agent has USDY and approval...');
    try {
      const usdyAddress = this.contractService.getUSDYAddress();
      const aiAgentAddress = this.contractService.getAIAgentAddress();
      const publicClient = this.contractService.getPublicClient();
      
      // Check USDY balance
      const balance = await this.contractService.readContract(
        usdyAddress as `0x${string}`,
        [{ "type": "function", "name": "balanceOf", "inputs": [{ "name": "account", "type": "address" }], "outputs": [{ "type": "uint256" }], "stateMutability": "view" }],
        'balanceOf',
        [aiAgentAddress as `0x${string}`]
      );
      const balanceFormatted = Number(balance) / 1e6;
      this.logger.log(`  AI Agent USDY balance: ${balanceFormatted}`);
      
      // Mint if needed
      if (balance < BigInt(500_000_000)) {
        this.logger.log('  Minting 500,000 USDY to AI agent...');
        const mintTx = await this.contractService.mintUSDY(
          aiAgentAddress as `0x${string}`,
          BigInt(500_000_000_000)
        );
        const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
        this.logger.log(`  ✓ Minted USDY, tx: ${mintTx}, confirmed in block ${mintReceipt.blockNumber}`);
      }

      // Check and set approval for IdeaFactory
      const factoryAddress = this.contractService.getIdeaFactoryAddress();
      const allowance = await this.contractService.readContract(
        usdyAddress as `0x${string}`,
        [{ "type": "function", "name": "allowance", "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "outputs": [{ "type": "uint256" }], "stateMutability": "view" }],
        'allowance',
        [aiAgentAddress as `0x${string}`, factoryAddress as `0x${string}`]
      );
      this.logger.log(`  Current USDY allowance for IdeaFactory: ${Number(allowance) / 1e6}`);
      
      if (allowance < BigInt(500_000_000)) {
        this.logger.log('  Approving IdeaFactory to spend USDY...');
        const approveTx = await this.contractService.approveUSDYForFactory(BigInt(1_000_000_000_000));
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
        this.logger.log(`  ✓ Approval granted, tx: ${approveTx}, confirmed in block ${approveReceipt.blockNumber}`);
      } else {
        this.logger.log('  IdeaFactory already approved');
      }
    } catch (error: any) {
      this.logger.warn('  ⚠️ Error in USDY setup:', error.message);
    }

    // Step 0b: Configure IdeaFactory if needed
    this.logger.log('Step 0b: Configuring IdeaFactory...');
    try {
      const fundingPoolFactory = this.contractService.getFundingPoolFactory();
      const ideaTokenFactory = this.contractService.getIdeaTokenFactory();
      const factoryAddress = this.contractService.getIdeaFactoryAddress();
      
      // Check if factories are set
      const currentFundingPoolFactory = await this.contractService.readContract(
        factoryAddress as `0x${string}`,
        [{ "type": "function", "name": "fundingPoolFactory", "inputs": [], "outputs": [{ "type": "address" }], "stateMutability": "view" }],
        'fundingPoolFactory',
        []
      );

      const currentIdeaTokenFactory = await this.contractService.readContract(
        factoryAddress as `0x${string}`,
        [{ "type": "function", "name": "ideaTokenFactory", "inputs": [], "outputs": [{ "type": "address" }], "stateMutability": "view" }],
        'ideaTokenFactory',
        []
      );
      
      this.logger.log(`  Current factories - FundingPoolFactory: ${currentFundingPoolFactory}, IdeaTokenFactory: ${currentIdeaTokenFactory}`);
      
      // Check if IdeaTokenFactory is zero (empty or 0x00...00)
      const isIdeaTokenFactoryUnset = currentIdeaTokenFactory === '0x0000000000000000000000000000000000000000' || currentIdeaTokenFactory === '0x';
      const isFundingPoolFactoryUnset = currentFundingPoolFactory === '0x0000000000000000000000000000000000000000' || currentFundingPoolFactory === '0x';
      
      if (isIdeaTokenFactoryUnset || isFundingPoolFactoryUnset) {
        this.logger.log('  Factories not fully configured, resetting...');
        const setFactoriesTx = await this.contractService.setFactories(
          fundingPoolFactory.address as `0x${string}`,
          ideaTokenFactory.address as `0x${string}`
        );
        const receipt = await this.contractService.getPublicClient().waitForTransactionReceipt({ hash: setFactoriesTx });
        this.logger.log(`  ✓ Factories configured, tx: ${setFactoriesTx}, confirmed in block ${receipt.blockNumber}`);
      } else {
        this.logger.log(`  All factories properly configured`);
      }

      // Check and set treasury
      const currentTreasury = await this.contractService.readContract(
        factoryAddress as `0x${string}`,
        [{ "type": "function", "name": "treasury", "inputs": [], "outputs": [{ "type": "address" }], "stateMutability": "view" }],
        'treasury',
        []
      );
      
      if (currentTreasury === '0x0000000000000000000000000000000000000000') {
        this.logger.log('  Treasury not configured, setting it now...');
        const treasuryAddress = this.contractService.getAIAgentAddress();
        const setTreasuryTx = await this.contractService.setTreasury(treasuryAddress as `0x${string}`);
        const treasuryReceipt = await this.contractService.getPublicClient().waitForTransactionReceipt({ hash: setTreasuryTx });
        this.logger.log(`  ✓ Treasury configured, tx: ${setTreasuryTx}, confirmed in block ${treasuryReceipt.blockNumber}`);
      } else {
        this.logger.log(`  Treasury already configured: ${currentTreasury}`);
      }
    } catch (error: any) {
      this.logger.warn('  ⚠️ Error configuring IdeaFactory:', error.message);
    }

    // Step 1: Create idea on-chain
    this.logger.log('Step 1: Creating idea on IdeaFactory...');
    let ideaId: bigint;
    try {
      const result = await this.ideaService.createIdea({
        title: demoIdea.title,
        description: demoIdea.description,
        category: demoIdea.category,
        creator: this.contractService.getAIAgentAddress(),
      });
      ideaId = result.ideaId;
      this.logger.log(`✓ Idea created with ID: ${ideaId}`);
    } catch (error: any) {
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('No ideas found after creation') || 
          errorMsg.includes('execution reverted') ||
          errorMsg.includes('transferFrom')) {
        // Check if it's a USDY deposit issue
        if (errorMsg.includes('transferFrom') || errorMsg.includes('insufficient')) {
          this.logger.warn('⚠️ USDY deposit required but agent may not have sufficient balance or approval.');
          this.logger.log('💡 To seed ideas, ensure the AI agent wallet has USDY tokens and has approved IdeaFactory.');
        } else {
          this.logger.warn('⚠️ Idea creation transaction may have failed or returned no logs.');
          this.logger.log('💡 Check transaction on explorer or ensure contract setup is complete.');
        }
        this.logger.log('💡 Backend is running. Use frontend to create ideas via user wallet.');
      } else {
        this.logger.warn('⚠️ Could not seed demo idea:', error.message);
      }
      return;
    }

    // Step 2: Setup new idea (FundingPool.setAiAgent + registerBuilderAgreement)
    this.logger.log('Step 2: Setting up idea (FundingPool + BuilderAgreement)...');
    try {
      const builderAgreementAddress = process.env.BUILDER_AGREEMENT_MANTLE || '0x0a1f28ec2e657a97A3341bD1BD187b71842d5881';
      await this.ideaService.setupNewIdea(ideaId, builderAgreementAddress);
      this.logger.log('✓ Idea setup complete');
    } catch (setupError: any) {
      this.logger.warn('⚠️ Setup failed (non-fatal):', setupError.message);
    }

    // Step 3: Upload metadata to IPFS
    this.logger.log('Step 3: Uploading metadata to IPFS...');
    const metadataIpfsHash = await this.uploadToPinata({
      ideaId: ideaId.toString(),
      title: demoIdea.title,
      description: demoIdea.description,
      category: demoIdea.category,
      createdAt: new Date().toISOString(),
      type: 'idea',
      version: '1.0',
    });
    this.logger.log(`✓ Metadata uploaded: ${metadataIpfsHash}`);

    // Step 4: Trigger AI scoring
    this.logger.log('Step 4: Triggering AI scoring...');
    const scoreResult = await this.agentService.scoreIdea(
      ideaId,
      demoIdea.title,
      demoIdea.description,
      { metadataIpfsHash },
    );
    
    this.logger.log(`✓ AI scoring complete: score=${scoreResult.score}, approved=${scoreResult.approved}`);
    
    // Step 5: Approve or reject on-chain based on AI decision
    this.logger.log('Step 5: Recording AI decision on-chain...');
    if (scoreResult.approved) {
      try {
        await this.ideaService.approveIdea(ideaId, scoreResult.score, scoreResult.transactionHash || '');
        this.logger.log('✓ Idea approved on IdeaFactory');
      } catch (approveError: any) {
        this.logger.warn('⚠️ Approval failed (non-fatal):', approveError.message);
      }
    }

    // Step 6: Log the decision to IPFS for transparency
    this.logger.log('Step 6: Logging AI decision to IPFS...');
    const decisionLog = {
      ideaId: ideaId.toString(),
      title: demoIdea.title,
      timestamp: new Date().toISOString(),
      decision: {
        type: 'IDEA_SCORING',
        score: scoreResult.score,
        approved: scoreResult.approved,
        reasoning: scoreResult.reasoning,
        transactionHash: scoreResult.transactionHash,
      },
      metadata: {
        ipfsHash: metadataIpfsHash,
        category: demoIdea.category,
        targetRaise: demoIdea.targetRaise,
      },
    };
    
    const decisionIpfsHash = await this.uploadToPinata(decisionLog);
    this.logger.log(`✓ Decision logged: https://ipfs.io/ipfs/${decisionIpfsHash}`);

    this.logger.log('═══════════════════════════════════════════════════════════');
    this.logger.log('✅ Demo idea seeded and AI validated successfully!');
    this.logger.log(`   Idea ID: ${ideaId}`);
    this.logger.log(`   Score: ${scoreResult.score}/100`);
    this.logger.log(`   Approved: ${scoreResult.approved ? 'Yes ✅' : 'No ❌'}`);
    this.logger.log(`   IPFS: https://ipfs.io/ipfs/${metadataIpfsHash}`);
    this.logger.log('═══════════════════════════════════════════════════════════');
  }

  private async uploadToPinata(data: any): Promise<string> {
    try {
      if (!this.pinataApiKey || !this.pinataApiSecret) {
        this.logger.warn('Pinata not configured, using mock hash');
        return `Qmmock${Date.now()}`;
      }

      const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
      const response = await axios.post(url, data, {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataApiSecret,
          'Content-Type': 'application/json',
        },
      });

      return response.data.IpfsHash;
    } catch (error: any) {
      this.logger.warn('Failed to upload to Pinata:', error.message);
      return `Qmfallback${Date.now()}`;
    }
  }
}