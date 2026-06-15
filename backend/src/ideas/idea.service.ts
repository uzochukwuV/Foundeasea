import { Injectable, Logger } from '@nestjs/common';
import { ContractService } from '../blockchain/contract.service';
import { DeploymentService } from '../blockchain/deployment.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { keccak256, toHex } from 'viem';
import axios from 'axios';

@Injectable()
export class IdeaService {
  private logger = new Logger('IdeaService');
  private pinataApiKey: string;
  private pinataApiSecret: string;

  constructor(
    private contractService: ContractService,
    private deploymentService: DeploymentService,
  ) {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataApiSecret = process.env.PINATA_API_SECRET || '';
  }

  /**
   * Create a new idea on-chain
   */
  async createIdea(dto: CreateIdeaDto) {
    const factory = this.contractService.getIdeaFactory();
    const publicClient = this.contractService.getPublicClient();
    const aiAgentWallet = this.contractService.getAIAgentWallet();
    const chain = this.contractService.getChain();

    try {
      this.logger.log(`Creating idea: ${dto.title}`);

      const metadata = {
        title: dto.title,
        description: dto.description,
        image: dto.image || '',
        category: dto.category || 'general',
        creator: dto.creator,
      };

      const metadataIpfsHash = await this.uploadToPinata(metadata);
      this.logger.log(`  Metadata uploaded to Pinata: ${metadataIpfsHash}`);

      // Use generic writeContract wrapper to avoid viem contract typing issues
      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();

      const hash = await this.contractService.writeContract(
        ideaFactoryAddress,
        ideaFactoryAbi,
        'createIdea',
        [
          {
            metadataIpfsHash: metadataIpfsHash,
            targetRaise: BigInt((dto as any).targetRaise || 0),
            softCap: BigInt((dto as any).softCap || 0),
            hardCap: BigInt((dto as any).hardCap || 0),
            fundingDeadline: BigInt((dto as any).fundingDeadline || 0),
            competitionPrizeBps: 1000,
            builderAllocBps: 3000,
            gateType: 0,
            gateParams: '0x',
          },
        ],
      );

      this.logger.log(`  Transaction sent: ${hash}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      this.logger.log(`  Transaction confirmed: ${receipt.blockNumber}`);
      this.logger.log(`  Logs count: ${receipt.logs?.length || 0}`);

      // Parse logs using viem's decodeEventLog
      let ideaId: bigint | null = null;
      let fundingPoolAddress: string | null = null;
      let ideaTokenAddress: string | null = null;

      try {
        const logs = receipt.logs || [];
        this.logger.log(`  Parsing ${logs.length} logs...`);
        
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          this.logger.log(`  Log ${i}: topics=${JSON.stringify(log.topics?.slice(0, 2))}, data length=${log.data?.length}`);
          
          try {
            // Get the event signature from first topic
            const topic0 = log.topics?.[0];
            
            // Try to decode using the ABI
            const parsed = this.contractService.getPublicClient().decodeEventLog({
              abi: ideaFactoryAbi as any,
              data: log.data,
              topics: log.topics,
            });
            
            this.logger.log(`  Log ${i} decoded: eventName=${parsed?.eventName}, args=${JSON.stringify(parsed?.args)}`);
            
            if (parsed && parsed.eventName === 'IdeaCreated') {
              ideaId = parsed.args.ideaId;
              fundingPoolAddress = parsed.args.fundingPool;
              ideaTokenAddress = parsed.args.ideaToken;
              this.logger.log(`  ✓ Found IdeaCreated event!`);
              break;
            }
          } catch (decodeErr: any) {
            this.logger.log(`  Log ${i} decode failed: ${decodeErr.message.substring(0, 100)}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`  Failed to parse logs: ${err.message}`);
      }

      // If we couldn't parse, try to extract ideaId from contract (alternative method)
      if (!ideaId) {
        this.logger.warn(`  Could not parse IdeaCreated event, trying alternative method...`);
        
        // Read nextIdeaId which should be the ID of the newly created idea
        const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
        const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi);
        const nextIdeaId = await this.contractService.readContract(ideaFactoryAddress, abi, 'nextIdeaId', []);
        
        // If nextIdeaId is 0, there are no ideas
        if (nextIdeaId === 0n) {
          throw new Error('No ideas found after creation');
        }
        
        ideaId = nextIdeaId - BigInt(1); // Last created idea
        this.logger.log(`  Got nextIdeaId=${nextIdeaId}, using ideaId=${ideaId}`);
        
        // Get idea details to find funding pool and token
        const idea = await this.contractService.readContract(ideaFactoryAddress, abi, 'getIdea', [ideaId]);
        fundingPoolAddress = idea[2];
        ideaTokenAddress = idea[1];
        
        this.logger.log(`  ✓ Got idea data from contract: ideaId=${ideaId}`);
      }

      this.logger.log(`✓ Idea created: ideaId=${ideaId}`);
      this.logger.log(`  fundingPool: ${fundingPoolAddress}`);
      this.logger.log(`  ideaToken: ${ideaTokenAddress}`);

      return {
        ideaId,
        fundingPoolAddress,
        ideaTokenAddress,
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to create idea:', error.message);
      throw error;
    }
  }

  /**
   * Approve an idea as AI agent
   */
  async approveIdea(ideaId: bigint, score: number, reasonHash: string) {
    const factory = this.contractService.getIdeaFactory();
    const publicClient = this.contractService.getPublicClient();
    const aiAgentWallet = this.contractService.getAIAgentWallet();
    const chain = this.contractService.getChain();

    try {
      this.logger.log(`Approving idea ${ideaId} with score ${score}`);

      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();
      const hash = await this.contractService.writeContract(ideaFactoryAddress, ideaFactoryAbi, 'aiApproveIdea', [ideaId, BigInt(score), reasonHash]);

      this.logger.log(`  Transaction sent: ${hash}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      this.logger.log(`✓ Idea approved: tx=${hash}`);

      return { ideaId, score, transactionHash: hash };
    } catch (error: any) {
      this.logger.error(`❌ Failed to approve idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Setup a new idea after creation
   */
  async setupNewIdea(ideaId: bigint, builderAgreementAddress: string) {
    try {
      this.logger.log(`Setting up idea ${ideaId}...`);
      await this.deploymentService.setupNewIdea(ideaId, builderAgreementAddress);
      this.logger.log(`✓ Idea ${ideaId} setup complete`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to setup idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * One-time setup of DAOVoting with first idea's token
   */
  async setupDAOVotingOnce(ideaTokenAddress: string) {
    try {
      this.logger.log(`Setting up DAOVoting with idea token: ${ideaTokenAddress}`);
      await this.deploymentService.setupDAOVoting(ideaTokenAddress);
      this.logger.log(`✓ DAOVoting setup complete`);
    } catch (error: any) {
      this.logger.error('❌ Failed to setup DAOVoting:', error.message);
      throw error;
    }
  }

  /**
   * Get idea details by ID
   */
  async getIdea(ideaId: bigint) {
    try {
      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();

      // Ensure ABI is an array
      const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi);

      const idea = await this.contractService.readContract(ideaFactoryAddress, abi, 'getIdea', [ideaId]);

      return {
        ideaId,
        creator: idea[0],
        ideaToken: idea[1],
        fundingPool: idea[2],
        fundingGate: idea[3],
        status: idea[4],
        aiScore: idea[5],
        approvalReasonHash: idea[6],
      };
    } catch (error: any) {
      this.logger.error(`Failed to get idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive idea details for frontend display
   */
  async getIdeaDetails(ideaId: bigint) {
    try {
      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();
      const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi);

      // Get basic idea data
      const idea = await this.contractService.readContract(ideaFactoryAddress, abi, 'getIdea', [ideaId]);
      const [creator, ideaToken, fundingPool, , status, aiScore, approvalReasonHash] = idea;

      // Get IPFS metadata from approval reason hash if available
      // Note: For ideas created before Pinata was configured, this will be a keccak256 hash, not retrievable
      let metadata = { title: '', description: '', category: '', image: '' };
      try {
        if (approvalReasonHash && approvalReasonHash.startsWith('Qm') && approvalReasonHash.length > 30) {
          const response = await axios.get(`https://ipfs.io/ipfs/${approvalReasonHash}`, { timeout: 5000 }).catch(() => null);
          if (response?.data) {
            metadata = response.data;
          }
        }
      } catch (e) {
        this.logger.warn(`Could not fetch metadata for idea ${ideaId}`);
      }

      // Get funding pool details
      interface FundingPoolData {
        softCap: number;
        hardCap: number;
        raisedAmount: number;
        competitionPrizeBps: number;
        builderAssigned: boolean;
        fundingClosed: boolean;
      }
      let fundingPoolData: FundingPoolData | null = null;
      try {
        const fundingPoolAbi = this.contractService.getFundingPoolAbi();
        const poolAbi = Array.isArray(fundingPoolAbi) ? fundingPoolAbi : JSON.parse(fundingPoolAbi);
        
        const [softCap, hardCap, raisedAmount, competitionPrizeBps, builderAssigned, fundingClosed] = 
          await Promise.all([
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'softCap', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'hardCap', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'raisedAmount', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'competitionPrizeBps', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'builderAssigned', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'fundingClosed', []),
          ]);

        fundingPoolData = {
          softCap: Number(softCap),
          hardCap: Number(hardCap),
          raisedAmount: Number(raisedAmount),
          competitionPrizeBps: Number(competitionPrizeBps),
          builderAssigned: Boolean(builderAssigned),
          fundingClosed: Boolean(fundingClosed),
        };
      } catch (e) {
        this.logger.warn(`Could not fetch funding pool data for idea ${ideaId}`);
      }

      // Get idea token details
      interface TokenData {
        name: string;
        symbol: string;
        totalSupply: number;
      }
      let tokenData: TokenData | null = null;
      try {
        const [name, symbol, totalSupply] = await Promise.all([
          this.contractService.readContract(ideaToken as `0x${string}`, [{
            name: 'name',
            outputs: [{ type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          }], 'name', []),
          this.contractService.readContract(ideaToken as `0x${string}`, [{
            name: 'symbol',
            outputs: [{ type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          }], 'symbol', []),
          this.contractService.readContract(ideaToken as `0x${string}`, [{
            name: 'totalSupply',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          }], 'totalSupply', []),
        ]);

        tokenData = {
          name: String(name),
          symbol: String(symbol),
          totalSupply: Number(totalSupply),
        };
      } catch (e) {
        this.logger.warn(`Could not fetch token data for idea ${ideaId}`);
      }

      return {
        ideaId: Number(ideaId),
        creator,
        status: Number(status),
        statusText: this.getStatusText(Number(status)),
        aiScore: Number(aiScore),
        approvalReasonHash,
        metadata,
        fundingPool: {
          address: fundingPool,
          softCap: fundingPoolData?.softCap ?? 0,
          hardCap: fundingPoolData?.hardCap ?? 0,
          raisedAmount: fundingPoolData?.raisedAmount ?? 0,
          competitionPrizeBps: fundingPoolData?.competitionPrizeBps ?? 0,
          builderAssigned: fundingPoolData?.builderAssigned ?? false,
          fundingClosed: fundingPoolData?.fundingClosed ?? false,
        },
        ideaToken: {
          address: ideaToken,
          name: tokenData?.name ?? '',
          symbol: tokenData?.symbol ?? '',
          totalSupply: tokenData?.totalSupply ?? 0,
        },
        createdAt: null,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get idea details ${ideaId}:`, error.message);
      throw error;
    }
  }

  private getStatusText(status: number): string {
    const statuses = ['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    return statuses[status] || 'UNKNOWN';
  }

  /**
   * List all ideas
   */
  async listIdeas(limit: number = 10) {
    try {
      const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
      const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();

      // Ensure ABI is an array
      const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi);

      const nextIdeaId = await this.contractService.readContract(ideaFactoryAddress, abi, 'nextIdeaId', []);

      const ideas: any[] = [];
      const totalIdeas = Number(nextIdeaId);
      const start = Math.max(0, totalIdeas - limit);

      for (let i = start; i < totalIdeas; i++) {
        const idea = await this.getIdea(BigInt(i));
        ideas.push(idea as any);
      }

      return ideas;
    } catch (error: any) {
      this.logger.error('Failed to list ideas:', error.message);
      throw error;
    }
  }

  /**
   * Create a BuilderAgreement for an idea
   */
  async createBuilderAgreement(ideaId: bigint, builders: string[], ipfsHash: string) {
    try {
      const builderAgreementAddress = this.contractService.getBuilderAgreement().address;
      const builderAgreementAbi = this.contractService.getBuilderAgreement().abi;
      const publicClient = this.contractService.getPublicClient();

      this.logger.log(`Creating BuilderAgreement for idea ${ideaId}`);

      const hash = await this.contractService.writeContract(
        builderAgreementAddress,
        builderAgreementAbi,
        'createAgreement',
        [ideaId, builders as unknown as `0x${string}`[], ipfsHash as `0x${string}`],
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      this.logger.log(`✓ BuilderAgreement created: tx=${hash}`);

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create BuilderAgreement for idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Upload metadata to Pinata
   */
  private async uploadToPinata(metadata: any): Promise<string> {
    try {
      if (!this.pinataApiKey || !this.pinataApiSecret) {
        this.logger.warn('Pinata credentials not configured, using keccak256 fallback');
        return keccak256(toHex(JSON.stringify(metadata)));
      }

      const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
      const response = await axios.post(url, metadata, {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataApiSecret,
          'Content-Type': 'application/json',
        },
      });

      return response.data.IpfsHash;
    } catch (error: any) {
      this.logger.warn('Failed to upload to Pinata, using keccak256 fallback:', error.message);
      const hash = keccak256(toHex(JSON.stringify(metadata)));
      return hash;
    }
  }

  /**
   * Public method to upload metadata to Pinata (used by controller)
   */
  async uploadMetadataToPinata(metadata: any): Promise<string> {
    return this.uploadToPinata(metadata);
  }

  /**
   * Get comprehensive idea product page data
   * Includes: idea info, funding status, builder, funders, milestones, voting
   */
  async getIdeaProductPage(ideaId: bigint) {
    const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
    const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();
    const abi = Array.isArray(ideaFactoryAbi) ? ideaFactoryAbi : JSON.parse(ideaFactoryAbi);
    const fundingPoolAbi = this.contractService.getFundingPoolAbi();
    const poolAbi = Array.isArray(fundingPoolAbi) ? fundingPoolAbi : JSON.parse(fundingPoolAbi);

    // 1. Get basic idea data
    const idea = await this.contractService.readContract(ideaFactoryAddress, abi, 'getIdea', [ideaId]);
    const [creator, ideaToken, fundingPool, fundingGate, status, aiScore, approvalReasonHash, config] = idea;

    // 2. Get funding pool full data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fundingData: any = null;
    let funders: { address: string; amount: number }[] = [];
    let milestones: any[] = [];
    let builder: { address: string; milestones: any[] } | null = null;

    if (fundingPool && fundingPool !== '0x0000000000000000000000000000000000000000') {
      try {
        // Get funding pool basic data
        const [softCap, hardCap, raisedAmount, competitionPrizeBps, builderAssigned, fundingClosed, fundingToken, daoAddress] =
          await Promise.all([
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'softCap', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'hardCap', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'raisedAmount', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'competitionPrizeBps', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'builderAssigned', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'fundingClosed', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'getFundingToken', []),
            this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'dao', []),
          ]);

        // Get milestones
        const milestoneCount = await this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'getMilestoneCount', []);
        milestones = [];
        for (let i = 0; i < Number(milestoneCount); i++) {
          try {
            const milestone = await this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'milestones', [i]);
            milestones.push({
              index: i,
              amount: Number(milestone[0]),
              deadline: Number(milestone[1]),
              released: milestone[2],
              validated: milestone[3],
              status: milestone[4],
            });
          } catch (e) {
            // Milestone might not exist
          }
        }

        // Get builder info if assigned
        if (builderAssigned) {
          try {
            const builderAddr = await this.contractService.readContract(fundingPool as `0x${string}`, poolAbi, 'builder', []);
            builder = {
              address: builderAddr,
              milestones: milestones,
            };
          } catch (e) {
            this.logger.warn(`Could not get builder for idea ${ideaId}`);
          }
        }

        // Get funders (from FundingPool events or try to get depositor list)
        // Note: Full funder list requires indexing events - returning mock for now
        funders = [
          // In production, this would come from indexing Deposit events
        ];

        fundingData = {
          address: fundingPool,
          softCap: Number(softCap),
          hardCap: Number(hardCap),
          raisedAmount: Number(raisedAmount),
          competitionPrizeBps: Number(competitionPrizeBps),
          builderAssigned: Boolean(builderAssigned),
          fundingClosed: Boolean(fundingClosed),
          fundingToken: fundingToken,
          daoAddress: daoAddress,
          progressPercent: Number(hardCap) > 0 ? Math.min(100, (Number(raisedAmount) / Number(hardCap)) * 100) : 0,
        };
      } catch (e: any) {
        this.logger.warn(`Could not fetch funding pool data for idea ${ideaId}:`, e.message);
      }
    }

    // 3. Get idea token data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenData: any = null;
    if (ideaToken && ideaToken !== '0x0000000000000000000000000000000000000000') {
      try {
        const [name, symbol, totalSupply, owner] = await Promise.all([
          this.contractService.readContract(ideaToken as `0x${string}`, [{ name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }], 'name', []),
          this.contractService.readContract(ideaToken as `0x${string}`, [{ name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }], 'symbol', []),
          this.contractService.readContract(ideaToken as `0x${string}`, [{ name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }], 'totalSupply', []),
          this.contractService.readContract(ideaToken as `0x${string}`, [{ name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' }], 'owner', []),
        ]);

        tokenData = {
          address: ideaToken,
          name: String(name),
          symbol: String(symbol),
          totalSupply: Number(totalSupply),
          owner: owner,
        };
      } catch (e: any) {
        this.logger.warn(`Could not fetch token data for idea ${ideaId}:`, e.message);
      }
    }

    // 4. Get DAO voting proposals
    let daoProposals: any[] = [];
    if (fundingData?.daoAddress && fundingData.daoAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        const daoAbi = [{
          name: 'getProposalCount',
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }];

        const proposalCount = await this.contractService.readContract(fundingData.daoAddress as `0x${string}`, daoAbi, 'getProposalCount', []);
        
        // Get recent proposals
        for (let i = 0; i < Math.min(Number(proposalCount), 10); i++) {
          try {
            const proposal = await this.contractService.readContract(fundingData.daoAddress as `0x${string}`, [
              { name: 'proposals', outputs: [{ type: 'uint256' }, { type: 'string' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }, { type: 'bool' }], stateMutability: 'view', type: 'function' },
            ], 'proposals', [i]);

            daoProposals.push({
              id: i,
              title: proposal[1],
              forVotes: Number(proposal[2]),
              againstVotes: Number(proposal[3]),
              deadline: Number(proposal[4]),
              executed: proposal[5],
              passed: proposal[6],
              status: proposal[5] ? 'EXECUTED' : (Number(proposal[4]) * 1000 < Date.now() ? 'ENDED' : 'ACTIVE'),
            });
          } catch (e) {
            // Proposal might not exist
          }
        }
      } catch (e: any) {
        this.logger.warn(`Could not fetch DAO proposals for idea ${ideaId}:`, e.message);
      }
    }

    // 5. Get IPFS metadata
    let metadata = { title: '', description: '', category: '', image: '', oneLiner: '' };
    try {
      if (approvalReasonHash && approvalReasonHash.startsWith('Qm') && approvalReasonHash.length > 30) {
        const response = await axios.get(`https://ipfs.io/ipfs/${approvalReasonHash}`, { timeout: 5000 }).catch(() => null);
        if (response?.data) {
          metadata = response.data;
        }
      }
    } catch (e) {
      this.logger.warn(`Could not fetch metadata for idea ${ideaId}`);
    }

    // 6. Determine stage based on status and funding state
    const stage = this.determineIdeaStage({
      ideaStatus: Number(status),
      fundingClosed: fundingData?.fundingClosed ?? false,
      raisedAmount: fundingData?.raisedAmount ?? 0,
      softCap: fundingData?.softCap ?? 0,
      builderAssigned: fundingData?.builderAssigned ?? false,
      daoProposalsCount: daoProposals.length,
    });

    return {
      idea: {
        ideaId: Number(ideaId),
        title: metadata.title || `Idea #${ideaId}`,
        oneLiner: metadata.oneLiner || metadata.description?.slice(0, 100) || '',
        description: metadata.description,
        category: metadata.category,
        image: metadata.image,
        creator,
        status: Number(status),
        statusText: this.getStatusText(Number(status)),
        aiScore: Number(aiScore),
        approvalReasonHash,
        stage,
        config: {
          targetRaise: Number(config[1]),
          softCap: Number(config[2]),
          hardCap: Number(config[3]),
          fundingDeadline: Number(config[4]),
          competitionPrizeBps: Number(config[5]),
          builderAllocBps: Number(config[6]),
        },
      },
      funding: fundingData,
      token: tokenData,
      builder,
      milestones,
      funders,
      daoVoting: {
        address: fundingData?.daoAddress,
        proposals: daoProposals,
        totalProposals: daoProposals.length,
      },
      metadata: {
        ipfsHash: approvalReasonHash,
        gatewayUrl: approvalReasonHash?.startsWith('Qm') ? `https://gateway.pinata.cloud/ipfs/${approvalReasonHash}` : null,
      },
    };
  }

  /**
   * Determine the current stage of an idea
   */
  private determineIdeaStage(data: {
    ideaStatus: number;
    fundingClosed: boolean;
    raisedAmount: number;
    softCap: number;
    builderAssigned: boolean;
    daoProposalsCount: number;
  }): string {
    const ideaStatus = data.ideaStatus;
    const fundingClosed = data.fundingClosed;
    const builderAssigned = data.builderAssigned;
    const daoProposalsCount = data.daoProposalsCount;

    // Stage 0: Pending AI Review
    if (ideaStatus === 0) return 'PENDING_REVIEW';

    // Stage 1: Approved, waiting for funding
    if (ideaStatus === 1 && !fundingClosed) return 'FUNDING_OPEN';

    // Stage 2: Funding closed, soft cap not met
    if (ideaStatus === 5) return 'FUNDING_FAILED';

    // Stage 3: Funding succeeded, no builder
    if (ideaStatus === 4 && !builderAssigned) return 'AWAITING_BUILDER';

    // Stage 4: Builder assigned, in development
    if (builderAssigned && ideaStatus === 4) return 'IN_DEVELOPMENT';

    // Stage 5: Active with DAO
    if (daoProposalsCount > 0 && ideaStatus === 4) return 'ACTIVE_WITH_DAO';

    // Stage 6: Completed
    if (ideaStatus === 6) return 'COMPLETED';

    // Stage 7: Rejected
    if (ideaStatus === 2) return 'REJECTED';

    // Default: Active
    return ideaStatus === 4 ? 'ACTIVE' : 'UNKNOWN';
  }
}
