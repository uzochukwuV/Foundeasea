import { Controller, Get, Post, Param, Body, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DaoService } from './dao.service';

@ApiTags('DAO')
@Controller('dao')
export class DaoController {
  private logger = new Logger('DaoController');

  constructor(private daoService: DaoService) {}

  @Get('address')
  @ApiOperation({ summary: 'Get DAO voting contract address' })
  getDaoAddress() {
    return {
      success: true,
      data: {
        address: this.daoService.getDaoAddress(),
      },
    };
  }

  @Get('proposal/:proposalId')
  @ApiOperation({ summary: 'Get proposal details' })
  async getProposal(@Param('proposalId') proposalId: string) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const proposal = await this.daoService.getProposal(daoAddress, BigInt(proposalId));

      if (!proposal) {
        throw new BadRequestException('Proposal not found');
      }

      return {
        success: true,
        data: proposal,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get proposal:`, error.message);
      throw error;
    }
  }

  @Get('proposal/:proposalId/status')
  @ApiOperation({ summary: 'Get proposal voting status' })
  async getProposalStatus(@Param('proposalId') proposalId: string) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const status = await this.daoService.getProposalStatus(daoAddress, BigInt(proposalId));

      if (!status) {
        throw new BadRequestException('Proposal not found');
      }

      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get proposal status:`, error.message);
      throw error;
    }
  }

  @Get('proposal/:proposalId/user/:userAddress')
  @ApiOperation({ summary: 'Get user voting info for a proposal' })
  async getUserProposalInfo(
    @Param('proposalId') proposalId: string,
    @Param('userAddress') userAddress: string,
  ) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const [hasVoted, isDelegated, votingPower, proposal, status] = await Promise.all([
        this.daoService.hasUserVoted(daoAddress, BigInt(proposalId), userAddress),
        this.daoService.isDelegatedToAI(daoAddress, userAddress),
        this.daoService.getVotingPower(daoAddress, userAddress),
        this.daoService.getProposal(daoAddress, BigInt(proposalId)),
        this.daoService.getProposalStatus(daoAddress, BigInt(proposalId)),
      ]);

      return {
        success: true,
        data: {
          hasVoted,
          isDelegatedToAI: isDelegated,
          votingPower,
          canVote: !hasVoted && !isDelegated && votingPower > 0 && (status?.votingActive ?? false),
          proposal,
          status,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get user proposal info:`, error.message);
      throw error;
    }
  }

  @Get('user/:userAddress/delegation')
  @ApiOperation({ summary: 'Check if user has delegated to AI' })
  async getUserDelegation(@Param('userAddress') userAddress: string) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const isDelegated = await this.daoService.isDelegatedToAI(daoAddress, userAddress);
      const totalPower = await this.daoService.getTotalDelegatedPower(daoAddress);

      return {
        success: true,
        data: {
          isDelegatedToAI: isDelegated,
          totalDelegatedPower: totalPower,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get delegation:`, error.message);
      throw error;
    }
  }

  @Post('proposal/:proposalId/vote')
  @ApiOperation({ summary: 'Vote on a proposal' })
  async vote(
    @Param('proposalId') proposalId: string,
    @Body() body: { support: boolean },
  ) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const result = await this.daoService.vote(daoAddress, BigInt(proposalId), body.support);

      return {
        success: true,
        data: {
          transactionHash: result.hash,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to vote:`, error.message);
      throw new BadRequestException(error.message || 'Failed to vote');
    }
  }

  @Post('delegate')
  @ApiOperation({ summary: 'Delegate voting power to AI' })
  async delegateToAI() {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const result = await this.daoService.delegateToAI(daoAddress);

      return {
        success: true,
        data: {
          transactionHash: result.hash,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to delegate:`, error.message);
      throw new BadRequestException(error.message || 'Failed to delegate');
    }
  }

  @Post('revoke-delegation')
  @ApiOperation({ summary: 'Revoke AI delegation' })
  async revokeDelegation() {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const result = await this.daoService.revokeDelegation(daoAddress);

      return {
        success: true,
        data: {
          transactionHash: result.hash,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to revoke delegation:`, error.message);
      throw new BadRequestException(error.message || 'Failed to revoke delegation');
    }
  }

  @Post('proposal/:proposalId/execute')
  @ApiOperation({ summary: 'Execute a proposal after voting deadline' })
  async executeProposal(@Param('proposalId') proposalId: string) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const result = await this.daoService.execute(daoAddress, BigInt(proposalId));

      return {
        success: true,
        data: {
          transactionHash: result.hash,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to execute proposal:`, error.message);
      throw new BadRequestException(error.message || 'Failed to execute proposal');
    }
  }

  @Get('idea/:ideaId/proposals')
  @ApiOperation({ summary: 'Get all proposals for an idea' })
  async getProposalsForIdea(@Param('ideaId') ideaId: string) {
    try {
      const daoAddress = this.daoService.getDaoAddress();
      const proposals = await this.daoService.getProposalsForIdea(daoAddress, BigInt(ideaId));

      return {
        success: true,
        data: {
          proposals,
          count: proposals.length,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get proposals for idea:`, error.message);
      throw error;
    }
  }
}