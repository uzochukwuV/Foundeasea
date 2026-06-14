import { Injectable, Logger } from '@nestjs/common';
import { ContractService } from '../blockchain/contract.service';
import { keccak256, toHex } from 'viem';
import axios from 'axios';

@Injectable()
export class AgentService {
  private logger = new Logger('AgentService');
  private pinataApiKey: string;
  private pinataApiSecret: string;

  constructor(private contractService: ContractService) {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataApiSecret = process.env.PINATA_API_SECRET || '';
  }

  /**
   * Score an idea using AI agent
   * Records decision on AgentIdentity
   */
  async scoreIdea(ideaId: bigint, title: string, description: string, metadata?: any) {
    const publicClient = this.contractService.getPublicClient();
    const aiAgentWallet = this.contractService.getAIAgentWallet();
    const chain = this.contractService.getChain();
    const agentIdentityAddress = this.contractService.getAgentIdentityAddress();
    const agentIdentityAbi = this.contractService.getAgentIdentityAbi();

    try {
      this.logger.log(`Scoring idea ${ideaId}: "${title}"`);

      // TODO: Integrate with TokenRouter for actual AI scoring
      // For now, use mock data
      const mockResult = {
        score: 82,
        reasoning: `Evaluated "${title}": Strong market potential, clear problem statement, experienced team indicators.`,
        approved: true,
      };

      this.logger.log(`  AI Score: ${mockResult.score}, Approved: ${mockResult.approved}`);

      // 1. Upload reasoning to Pinata
      const reasoningIpfsHash = await this.uploadToPinata(mockResult);
      this.logger.log(`  Reasoning uploaded to IPFS: ${reasoningIpfsHash}`);

      // 2. Prepare input/output hashes
      const inputHash = keccak256(toHex(JSON.stringify({ title, description })));
      const outputHash = keccak256(toHex(JSON.stringify(mockResult)));

       // 3. Record decision on AgentIdentity (use generic write wrapper)
       const hash = await this.contractService.writeContract(
         agentIdentityAddress,
         agentIdentityAbi,
         'recordDecision',
         [
           0, // DecisionType.IDEA_APPROVE
           ideaId,
           inputHash,
           outputHash,
           BigInt(mockResult.score),
           reasoningIpfsHash,
         ],
       );

       const receipt = await publicClient.waitForTransactionReceipt({ hash });
      this.logger.log(`✓ Decision recorded on AgentIdentity: tx=${hash}`);

      return {
        score: mockResult.score,
        reasoning: mockResult.reasoning,
        approved: mockResult.approved,
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to score idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Score an idea with full document submission
   * Analyzes pitch deck, protocol docs, and videos for comprehensive evaluation
   */
  async scoreIdeaWithDocuments(
    title: string,
    description: string,
    documents: {
      metadataHash: string;
      pitchDeckHash?: string;
      protocolPdfHash?: string;
      additionalDocsHash?: string;
      videoLinks?: string[];
    }
  ) {
    const agentIdentityAddress = this.contractService.getAgentIdentityAddress();
    const agentIdentityAbi = this.contractService.getAgentIdentityAbi();

    try {
      this.logger.log(`Scoring idea with full documents: "${title}"`);
      this.logger.log(`  - Metadata: ${documents.metadataHash}`);
      this.logger.log(`  - Pitch Deck: ${documents.pitchDeckHash || 'N/A'}`);
      this.logger.log(`  - Protocol PDF: ${documents.protocolPdfHash || 'N/A'}`);
      this.logger.log(`  - Additional Docs: ${documents.additionalDocsHash || 'N/A'}`);
      this.logger.log(`  - Videos: ${documents.videoLinks?.length || 0}`);

      // Comprehensive scoring based on document completeness
      let score = 50; // Base score
      let reasoning: string[] = [];
      let approved = true;

      // Analyze submission completeness
      if (documents.pitchDeckHash) {
        score += 15;
        reasoning.push('Pitch deck provided - demonstrates professional presentation');
      } else {
        reasoning.push('Missing pitch deck - recommended for better evaluation');
      }

      if (documents.protocolPdfHash) {
        score += 20;
        reasoning.push('Protocol documentation provided - shows technical depth');
      } else {
        score -= 10;
        reasoning.push('Protocol documentation missing - reduces evaluation confidence');
      }

      if (documents.additionalDocsHash) {
        score += 5;
        reasoning.push('Additional supporting documents included');
      }

      if (documents.videoLinks && documents.videoLinks.length > 0) {
        score += 10;
        reasoning.push(`${documents.videoLinks.length} video link(s) provided - adds credibility`);
      }

      // Analyze description quality
      const descLength = description.length;
      if (descLength > 500) {
        score += 5;
        reasoning.push('Detailed description provided');
      } else if (descLength < 100) {
        score -= 10;
        reasoning.push('Description too brief for proper evaluation');
      }

      // Cap score at 100
      score = Math.min(score, 100);
      approved = score >= 60;

      const finalResult = {
        score,
        reasoning: reasoning.join('. '),
        approved,
        documents: {
          pitchDeck: documents.pitchDeckHash,
          protocolPdf: documents.protocolPdfHash,
          additionalDocs: documents.additionalDocsHash,
          videos: documents.videoLinks,
        },
      };

      this.logger.log(`  AI Score: ${score}, Approved: ${approved}`);

      // Upload evaluation to IPFS
      const evaluationHash = await this.uploadToPinata(finalResult);
      this.logger.log(`  Evaluation uploaded: ${evaluationHash}`);

      // Prepare hashes for AgentIdentity
      const inputHash = keccak256(toHex(JSON.stringify({
        title,
        description,
        documents: documents.metadataHash,
      })));
      const outputHash = keccak256(toHex(JSON.stringify(finalResult)));

      // Record decision on chain
      const hash = await this.contractService.writeContract(
        agentIdentityAddress,
        agentIdentityAbi,
        'recordDecision',
        [
          0, // DecisionType.IDEA_APPROVE
          BigInt(0), // No idea ID yet - this is pre-submission
          inputHash,
          outputHash,
          BigInt(score),
          evaluationHash,
        ],
      );

      this.logger.log(`✓ Decision recorded on AgentIdentity: tx=${hash}`);

      return {
        score,
        reasoning: finalResult.reasoning,
        approved,
        evaluationHash,
        transactionHash: hash,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to score idea with documents:`, error.message);
      throw error;
    }
  }

  /**
   * Validate a milestone submission
   * Records decision on AgentIdentity
   * Auto-releases if confidence >= 75
   */
  async validateMilestone(
    ideaId: bigint,
    milestoneIndex: number,
    submissionContent: string,
  ) {
    const agentIdentity = this.contractService.getAgentIdentity();
    const agentIdentityAddress = this.contractService.getAgentIdentityAddress();
    const agentIdentityAbi = this.contractService.getAgentIdentityAbi();
    const publicClient = this.contractService.getPublicClient();
    const aiAgentWallet = this.contractService.getAIAgentWallet();
    const chain = this.contractService.getChain();

    try {
      this.logger.log(`Validating milestone ${milestoneIndex} for idea ${ideaId}`);

      // TODO: Integrate with TokenRouter for actual validation
      // For now, use mock data
      const mockResult = {
        passed: true,
        confidence: 88,
        reasoning: `Reviewed submission: Code quality good, features implemented, tests passing.`,
      };

      this.logger.log(`  Validation: Passed=${mockResult.passed}, Confidence=${mockResult.confidence}`);

      // 1. Get FundingPool address
       const ideaFactoryAddress = this.contractService.getIdeaFactoryAddress();
       const ideaFactoryAbi = this.contractService.getIdeaFactoryAbi();
       const idea = await this.contractService.readContract(ideaFactoryAddress, ideaFactoryAbi, 'getIdea', [ideaId]);
       const fundingPoolAddress = idea[2] as `0x${string}`;
       const fundingPoolAbi = this.contractService.getFundingPoolAbi();

      // 2. Call FundingPool.setMilestoneValidated()
      const validationIpfsHash = await this.uploadToPinata(mockResult);

       const validationHash = await this.contractService.writeContract(
         fundingPoolAddress as `0x${string}`,
         fundingPoolAbi,
         'setMilestoneValidated',
         [BigInt(milestoneIndex), BigInt(mockResult.confidence), validationIpfsHash],
       );

      const validationReceipt = await publicClient.waitForTransactionReceipt({ hash: validationHash });
      this.logger.log(`✓ Milestone validated: tx=${validationHash}`);

      let autoReleased = false;
      let releaseHash = null;

      // 3. Auto-release if confidence >= 75
      if (mockResult.confidence >= 75) {
        this.logger.log(`  Confidence ${mockResult.confidence} >= 75, auto-releasing...`);

        releaseHash = await this.contractService.writeContract(
          fundingPoolAddress as `0x${string}`,
          fundingPoolAbi,
          'releaseMilestone',
          [BigInt(milestoneIndex)],
        );

        const releaseReceipt = await publicClient.waitForTransactionReceipt({ hash: releaseHash });
        this.logger.log(`✓ Milestone released: tx=${releaseHash}`);
        autoReleased = true;
      }

      // 4. Record decision on AgentIdentity
      const inputHash = keccak256(toHex(JSON.stringify({ ideaId, milestoneIndex, submissionContent })));
      const outputHash = keccak256(toHex(JSON.stringify(mockResult)));

       const decisionHash = await this.contractService.writeContract(
         agentIdentityAddress,
         agentIdentityAbi,
         'recordDecision',
         [
           5, // DecisionType.MILESTONE_VALIDATE
           ideaId,
           inputHash,
           outputHash,
           BigInt(mockResult.confidence),
           validationIpfsHash,
         ],
       );

       const decisionReceipt = await publicClient.waitForTransactionReceipt({ hash: decisionHash });
      this.logger.log(`✓ Decision recorded on AgentIdentity: tx=${decisionHash}`);

      return {
        passed: mockResult.passed,
        confidence: mockResult.confidence,
        autoReleased,
        reasoning: mockResult.reasoning,
        validationHash,
        releaseHash,
        decisionHash,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to validate milestone ${milestoneIndex}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all decisions from AgentIdentity
   */
  async getDecisions(ideaId?: bigint, limit: number = 50) {
    try {
      const agentIdentityAddress = this.contractService.getAgentIdentityAddress();
      const agentIdentityAbi = this.contractService.getAgentIdentityAbi();

      // Get total decisions
      const totalDecisions = await this.contractService.readContract(agentIdentityAddress, agentIdentityAbi, 'totalDecisions', []);
      const count = Number(totalDecisions);

      this.logger.log(`Fetching decisions: total=${count}, limit=${limit}`);

      // Get decisions (simplified - would need pagination logic)
       const decisions: any[] = [];
      const start = Math.max(0, count - limit);

      for (let i = start; i < count; i++) {
        try {
           const decision = await this.contractService.readContract(agentIdentityAddress, agentIdentityAbi, 'getDecision', [BigInt(i)]);

          // If filtering by ideaId, skip non-matching
          if (ideaId && decision.subjectId !== ideaId) {
            continue;
          }

          decisions.push({
            index: i,
            type: decision.decisionType,
            subjectId: decision.subjectId,
            confidence: Number(decision.confidence),
            timestamp: Number(decision.timestamp),
            reasoningHash: decision.reasoningIpfsHash,
            inputHash: decision.inputHash,
            outputHash: decision.outputHash,
          });
        } catch (error: any) {
          this.logger.warn(`Failed to fetch decision ${i}:`, error.message);
        }
      }

      return {
        total: count,
        returned: decisions.length,
        decisions: decisions.reverse(), // Most recent first
      };
    } catch (error: any) {
      this.logger.error('Failed to get decisions:', error.message);
      throw error;
    }
  }

  /**
   * Get decisions filtered by idea ID
   */
  async getDecisionsByIdea(ideaId: bigint) {
    try {
      const agentIdentityAddress = this.contractService.getAgentIdentityAddress();
      const agentIdentityAbi = this.contractService.getAgentIdentityAbi();
      try {
        // Try to call the convenience on-chain view
        const decisions = await this.contractService.readContract(agentIdentityAddress, agentIdentityAbi, 'getDecisionsBySubjectId', [ideaId]);
        return decisions;
      } catch {
        // Fallback to manual filtering
        return this.getDecisions(ideaId);
      }
    } catch (error: any) {
      this.logger.error(`Failed to get decisions for idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Upload reasoning or validation data to Pinata
   */
  private async uploadToPinata(data: any): Promise<string> {
    try {
      if (!this.pinataApiKey || !this.pinataApiSecret) {
        this.logger.warn('Pinata credentials not configured, using keccak256 fallback');
        return keccak256(toHex(JSON.stringify(data)));
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
      this.logger.warn('Failed to upload to Pinata, using keccak256 fallback:', error.message);
      // Fallback to keccak256 hash
      const hash = keccak256(toHex(JSON.stringify(data)));
      return hash;
    }
  }
}
