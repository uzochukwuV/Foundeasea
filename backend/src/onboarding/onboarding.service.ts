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