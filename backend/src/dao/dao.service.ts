import { Injectable, Logger } from '@nestjs/common';
import { ContractService } from '../blockchain/contract.service';

export interface Proposal {
  proposalId: number;
  ideaId: number;
  descriptionIpfsHash: string;
  votingDeadline: number;
  yesVotes: number;
  noVotes: number;
  aiYesVotes: number;
  aiNoVotes: number;
  executed: boolean;
  aiRecommendation: boolean;
  aiConfidence: number;
  created: boolean;
  snapshotBlock: number;
}

export interface ProposalStatus {
  yesVotes: number;
  noVotes: number;
  aiYesVotes: number;
  aiNoVotes: number;
  executed: boolean;
  votingActive: boolean;
}

@Injectable()
export class DaoService {
  private logger = new Logger('DaoService');

  constructor(private contractService: ContractService) {}

  /**
   * Get DAO voting contract address
   */
  getDaoAddress(): string {
    return this.contractService.getDAOVotingAddress();
  }

  /**
   * Get full proposal details
   */
  async getProposal(daoAddress: string, proposalId: bigint): Promise<Proposal | null> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      const proposal = await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'proposals',
        [proposalId],
      );

      if (!proposal || !proposal[10]) {
        return null;
      }

      return {
        proposalId: Number(proposalId),
        ideaId: Number(proposal[0]),
        descriptionIpfsHash: proposal[1],
        votingDeadline: Number(proposal[2]),
        yesVotes: Number(proposal[3]),
        noVotes: Number(proposal[4]),
        aiYesVotes: Number(proposal[5]),
        aiNoVotes: Number(proposal[6]),
        executed: proposal[7],
        aiRecommendation: proposal[8],
        aiConfidence: Number(proposal[9]),
        created: proposal[10],
        snapshotBlock: Number(proposal[11]),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get proposal ${proposalId}:`, error.message);
      return null;
    }
  }

  /**
   * Get proposal status (votes and active state)
   */
  async getProposalStatus(daoAddress: string, proposalId: bigint): Promise<ProposalStatus | null> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      const status = await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'getProposalStatus',
        [proposalId],
      );

      return {
        yesVotes: Number(status[0]),
        noVotes: Number(status[1]),
        aiYesVotes: Number(status[2]),
        aiNoVotes: Number(status[3]),
        executed: status[4],
        votingActive: status[5],
      };
    } catch (error: any) {
      this.logger.error(`Failed to get proposal status ${proposalId}:`, error.message);
      return null;
    }
  }

  /**
   * Check if user has voted on a proposal
   */
  async hasUserVoted(daoAddress: string, proposalId: bigint, userAddress: string): Promise<boolean> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      return await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'hasVoted',
        [proposalId, userAddress as `0x${string}`],
      );
    } catch (error: any) {
      this.logger.error(`Failed to check user vote:`, error.message);
      return false;
    }
  }

  /**
   * Check if user has delegated to AI
   */
  async isDelegatedToAI(daoAddress: string, userAddress: string): Promise<boolean> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      return await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'delegatedToAI',
        [userAddress as `0x${string}`],
      );
    } catch (error: any) {
      this.logger.error(`Failed to check delegation:`, error.message);
      return false;
    }
  }

  /**
   * Get user's voting power (token balance)
   */
  async getVotingPower(daoAddress: string, userAddress: string): Promise<number> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      const ideaToken = await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'ideaToken',
        [],
      );

      // Get IdeaToken ABI
      const ideaTokenAbi = this.contractService.getIdeaTokenAbi();
      const balance = await this.contractService.readContract(
        ideaToken as `0x${string}`,
        ideaTokenAbi,
        'balanceOf',
        [userAddress as `0x${string}`],
      );

      return Number(balance);
    } catch (error: any) {
      this.logger.error(`Failed to get voting power:`, error.message);
      return 0;
    }
  }

  /**
   * Get total delegated power
   */
  async getTotalDelegatedPower(daoAddress: string): Promise<number> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      const power = await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'totalDelegatedPower',
        [],
      );
      return Number(power);
    } catch (error: any) {
      this.logger.error(`Failed to get total delegated power:`, error.message);
      return 0;
    }
  }

  /**
   * Get all proposals for an idea
   */
  async getProposalsForIdea(daoAddress: string, ideaId: bigint): Promise<Proposal[]> {
    try {
      const abi = this.contractService.getDAOVotingAbi();
      const nextProposalId = await this.contractService.readContract(
        daoAddress as `0x${string}`,
        abi,
        'nextProposalId',
        [],
      );

      const proposals: Proposal[] = [];
      for (let i = 0; i < Number(nextProposalId); i++) {
        const proposal = await this.getProposal(daoAddress, BigInt(i));
        if (proposal && proposal.created && proposal.ideaId === Number(ideaId)) {
          proposals.push(proposal);
        }
      }
      return proposals;
    } catch (error: any) {
      this.logger.error(`Failed to get proposals for idea ${ideaId}:`, error.message);
      return [];
    }
  }

  /**
   * Vote on a proposal (write transaction)
   */
  async vote(daoAddress: string, proposalId: bigint, support: boolean): Promise<{ hash: string }> {
    const abi = this.contractService.getDAOVotingAbi();
    const hash = await this.contractService.writeContract(
      daoAddress as `0x${string}`,
      abi,
      'vote',
      [proposalId, support],
    );
    this.logger.log(`Vote cast on proposal ${proposalId}: ${hash}`);
    return { hash };
  }

  /**
   * Delegate votes to AI (write transaction)
   */
  async delegateToAI(daoAddress: string): Promise<{ hash: string }> {
    const abi = this.contractService.getDAOVotingAbi();
    const hash = await this.contractService.writeContract(
      daoAddress as `0x${string}`,
      abi,
      'delegateToAI',
      [],
    );
    this.logger.log(`Delegated votes to AI: ${hash}`);
    return { hash };
  }

  /**
   * Revoke delegation from AI (write transaction)
   */
  async revokeDelegation(daoAddress: string): Promise<{ hash: string }> {
    const abi = this.contractService.getDAOVotingAbi();
    const hash = await this.contractService.writeContract(
      daoAddress as `0x${string}`,
      abi,
      'revokeDelegation',
      [],
    );
    this.logger.log(`Revoked AI delegation: ${hash}`);
    return { hash };
  }

  /**
   * Execute a proposal (after voting deadline)
   */
  async execute(daoAddress: string, proposalId: bigint): Promise<{ hash: string }> {
    const abi = this.contractService.getDAOVotingAbi();
    const hash = await this.contractService.writeContract(
      daoAddress as `0x${string}`,
      abi,
      'execute',
      [proposalId],
    );
    this.logger.log(`Proposal ${proposalId} executed: ${hash}`);
    return { hash };
  }

  /**
   * Get proposal metadata from IPFS
   */
  async getProposalMetadata(ipfsHash: string): Promise<any> {
    if (!ipfsHash || !ipfsHash.startsWith('Qm') || ipfsHash.length < 30) {
      return null;
    }

    try {
      const axios = require('axios');
      const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch IPFS metadata for ${ipfsHash}`);
      return null;
    }
  }
}