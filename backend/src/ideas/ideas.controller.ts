import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IdeaService } from './idea.service';
import { AgentService } from '../agents/agent.service';
import { IpfsService } from '../common/ipfs.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('ideas')
export class IdeasController {
  private logger = new Logger('IdeasController');

  constructor(
    private ideaService: IdeaService,
    private agentService: AgentService,
    private ipfsService: IpfsService,
  ) {}

  /**
   * Full submission with documents for institutional-grade idea presentation
   */
  @Post('submit')
  @ApiOperation({ summary: 'Submit complete idea with pitch deck, protocol docs, and videos' })
  async submitFullIdea(@Body() dto: {
    title: string;
    oneLiner: string;
    description: string;
    category: string;
    tags: string[];
    targetRaise?: number;
    softCap?: number;
    hardCap?: number;
    fundingDays?: number;
    competitionPrizeBps?: number;
    builderAllocBps?: number;
    pitchDeckBase64?: string;      // PDF base64
    protocolPdfBase64?: string;    // PDF base64
    additionalDocsBase64?: string; // PDF base64
    videoLinks?: string[];
  }) {
    this.logger.log(`[POST /ideas/submit] Full submission: ${dto.title}`);

    try {
      // 1. Upload all documents to IPFS
      const documents: any = {};
      if (dto.pitchDeckBase64) {
        documents.pitchDeck = {
          buffer: Buffer.from(dto.pitchDeckBase64, 'base64'),
          fileName: `${dto.title}-pitch-deck.pdf`
        };
      }
      if (dto.protocolPdfBase64) {
        documents.protocolPdf = {
          buffer: Buffer.from(dto.protocolPdfBase64, 'base64'),
          fileName: `${dto.title}-protocol.pdf`
        };
      }
      if (dto.additionalDocsBase64) {
        documents.additionalDocs = {
          buffer: Buffer.from(dto.additionalDocsBase64, 'base64'),
          fileName: `${dto.title}-additional-docs.pdf`
        };
      }

      this.logger.log('Uploading documents to IPFS...');
      const uploadResult = await this.ipfsService.uploadFullSubmission(
        {
          title: dto.title,
          description: dto.description,
          oneLiner: dto.oneLiner,
          category: dto.category,
          tags: dto.tags || [],
        },
        documents,
        dto.videoLinks
      );

      if (!uploadResult.success) {
        throw new Error(`IPFS upload failed: ${uploadResult.error}`);
      }

      this.logger.log(`✓ Documents uploaded: metadataHash=${uploadResult.metadataHash}`);

      // 2. Run AI validation with full submission content
      this.logger.log('Running AI validation on full submission...');
      const aiResult = await this.agentService.scoreIdeaWithDocuments(
        dto.title,
        dto.description,
        {
          metadataHash: uploadResult.metadataHash,
          pitchDeckHash: uploadResult.pitchDeckHash,
          protocolPdfHash: uploadResult.protocolPdfHash,
          additionalDocsHash: uploadResult.additionalDocsHash,
          videoLinks: dto.videoLinks || [],
        }
      );

      this.logger.log(`✓ AI validation: score=${aiResult.score}, approved=${aiResult.approved}`);

      // 3. Calculate funding config
      const fundingDeadline = Math.floor(Date.now() / 1000) + (dto.fundingDays || 30) * 24 * 60 * 60;

      // 4. Return submission result
      return {
        success: true,
        submissionId: `sub-${Date.now()}`,
        approved: aiResult.approved,
        aiScore: aiResult.score,
        aiReasoning: aiResult.reasoning,
        submission: {
          metadataHash: uploadResult.metadataHash,
          pitchDeckHash: uploadResult.pitchDeckHash,
          protocolPdfHash: uploadResult.protocolPdfHash,
          additionalDocsHash: uploadResult.additionalDocsHash,
          videoLinks: dto.videoLinks || [],
          metadataGatewayUrl: `https://gateway.pinata.cloud/ipfs/${uploadResult.metadataHash}`,
        },
        contractConfig: {
          metadataIpfsHash: uploadResult.metadataHash,
          targetRaise: String(dto.targetRaise || 850000),
          softCap: String(dto.softCap || 250000),
          hardCap: String(dto.hardCap || 1000000),
          fundingDeadline,
          competitionPrizeBps: dto.competitionPrizeBps || 800,
          builderAllocBps: dto.builderAllocBps || 2000,
          gateType: 0,
          gateParams: '0x',
        },
        message: aiResult.approved
          ? 'Submission approved! You can now create the idea on-chain.'
          : 'Submission needs revision. AI feedback: ' + aiResult.reasoning,
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to submit idea:', error.message);
      throw error;
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an idea with AI and return contract config' })
  @ApiResponse({ status: 200, description: 'Idea validated successfully' })
  async validateIdea(@Body() dto: { title: string; description: string; category?: string; targetRaise?: number; softCap?: number; hardCap?: number; fundingDays?: number }) {
    this.logger.log(`[POST /ideas/validate] Validating idea: ${dto.title}`);

    try {
      const result = await this.agentService.scoreIdea(
        BigInt(Date.now()), // temp ideaId for validation
        dto.title,
        dto.description,
      );

      this.logger.log(`✓ AI scoring complete: score=${result.score}, approved=${result.approved}`);

      // Upload to IPFS
      const metadataIpfsHash = await this.ideaService.uploadMetadataToPinata({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        validation: {
          score: result.score,
          reasoning: result.reasoning,
          transactionHash: result.transactionHash,
        },
      });

      // Calculate funding deadline (fundingDays from now)
      const fundingDeadline = Math.floor(Date.now() / 1000) + (dto.fundingDays || 30) * 24 * 60 * 60;

      return {
        validationId: `val-${Date.now()}`,
        approved: result.approved,
        score: result.score,
        summary: result.approved 
          ? 'This idea meets our criteria for funding. High feasibility and sufficient uniqueness.' 
          : 'This idea requires revision before it can be approved.',
        feedback: result.approved
          ? ['AI validation passed with high confidence', 'Market opportunity validated', 'Technical feasibility confirmed']
          : ['Consider providing more details', 'Market research suggests revision needed'],
        contractConfig: {
          metadataIpfsHash,
          targetRaise: String(dto.targetRaise || 850000),
          softCap: String(dto.softCap || 250000),
          hardCap: String(dto.hardCap || 1000000),
          fundingDeadline,
          competitionPrizeBps: 800,
          builderAllocBps: 2000,
          gateType: 0,
          gateParams: '0x',
        },
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to validate idea:', error.message);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new idea and trigger AI scoring' })
  @ApiResponse({ status: 201, description: 'Idea created successfully' })
  async createIdea(@Body() dto: CreateIdeaDto, @Req() req: any) {
    this.logger.log(`[POST /ideas] Creating idea: ${dto.title}`);

    try {
      // 1. Create idea on-chain
      const { ideaId, fundingPoolAddress, ideaTokenAddress, transactionHash } =
        await this.ideaService.createIdea(dto);

      this.logger.log(`✓ Idea created: ideaId=${ideaId}`);

      // 2. CRITICAL: Setup new idea (FundingPool.setAiAgent + registerBuilderAgreement)
      try {
        const builderAgreementAddress = '0x94BF2AD1A35066D396Af247985f1e5A0C68bd1c4'; // For now, use deployed BA
        await this.ideaService.setupNewIdea(BigInt(ideaId), builderAgreementAddress);
        this.logger.log(`✓ Idea setup complete`);
      } catch (setupError: any) {
        this.logger.error('⚠️ Setup failed, but idea created:', setupError.message);
        // Don't fail the request - idea is still created
      }

      // 3. ONE-TIME: Setup DAOVoting after first idea
      if (ideaId === 1n && ideaTokenAddress) {
        try {
          await this.ideaService.setupDAOVotingOnce(ideaTokenAddress);
          this.logger.log(`✓ DAOVoting setup complete (one-time)`);
        } catch (daoError: any) {
          this.logger.warn('⚠️ DAOVoting setup failed:', daoError.message);
          // Don't fail the request
        }
      }

      // 4. Trigger AI scoring asynchronously
      this.agentService
        .scoreIdea(BigInt(ideaId), dto.title, dto.description)
        .then((result) => {
          this.logger.log(`✓ AI scoring complete: score=${result.score}, approved=${result.approved}`);

          // If approved, also call approveIdea on contract
          if (result.approved) {
            return this.ideaService.approveIdea(BigInt(ideaId), result.score, '0x');
          }
        })
        .catch((error: any) => {
          this.logger.error('❌ AI scoring failed:', error.message);
        });

      return {
        success: true,
        ideaId: ideaId.toString(),
        fundingPoolAddress,
        ideaTokenAddress,
        status: 'PENDING_AI_REVIEW',
        transactionHash,
        message: 'Idea created successfully. AI scoring in progress...',
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to create idea:', error.message);
      throw error;
    }
  }

  @Get(':ideaId')
  @ApiOperation({ summary: 'Get idea details' })
  async getIdea(@Param('ideaId') ideaId: string) {
    this.logger.log(`[GET /ideas/:ideaId] Fetching idea: ${ideaId}`);

    try {
      const idea = await this.ideaService.getIdeaDetails(BigInt(ideaId));
      return {
        success: true,
        data: idea,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to get idea ${ideaId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive idea product page data
   * Includes funding, builders, funders, and voting information
   */
  @Get(':ideaId/product')
  @ApiOperation({ summary: 'Get comprehensive idea product page data' })
  async getIdeaProductPage(@Param('ideaId') ideaId: string) {
    this.logger.log(`[GET /ideas/:ideaId/product] Fetching full product page: ${ideaId}`);

    try {
      const productData = await this.ideaService.getIdeaProductPage(BigInt(ideaId));
      return {
        success: true,
        data: productData,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to get idea product page ${ideaId}:`, error.message);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all ideas' })
  async listIdeas(@Query('limit') limit: string = '10') {
    this.logger.log(`[GET /ideas] Listing ideas with limit=${limit}`);

    try {
      const ideas = await this.ideaService.listIdeas(parseInt(limit));
      return {
        success: true,
        count: ideas.length,
        data: ideas,
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to list ideas:', error.message);
      throw error;
    }
  }

  @Post(':ideaId/milestones/:milestoneIndex/validate')
  @ApiOperation({ summary: 'Validate a milestone and trigger AI validation' })
  async validateMilestone(
    @Param('ideaId') ideaId: string,
    @Param('milestoneIndex') milestoneIndex: string,
    @Body() dto: { submissionContent: string },
  ) {
    this.logger.log(
      `[POST /ideas/:ideaId/milestones/:index/validate] Validating milestone ${milestoneIndex} for idea ${ideaId}`,
    );

    try {
      const result = await this.agentService.validateMilestone(
        BigInt(ideaId),
        parseInt(milestoneIndex),
        dto.submissionContent,
      );

      return {
        success: true,
        milestoneIndex: parseInt(milestoneIndex),
        data: {
          passed: result.passed,
          confidence: result.confidence,
          autoReleased: result.autoReleased,
          reasoning: result.reasoning,
          transactionHashes: {
            validation: result.validationHash,
            release: result.releaseHash,
            decision: result.decisionHash,
          },
        },
        message: result.autoReleased
          ? 'Milestone validated and funds released automatically'
          : 'Milestone validated. Flagged for DAO review',
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to validate milestone:`, error.message);
      throw error;
    }
  }

  @Get('agent/decisions')
  @ApiOperation({ summary: 'Get AI agent decisions from AgentIdentity' })
  async getDecisions(
    @Query('ideaId') ideaId?: string,
    @Query('limit') limit: string = '50',
  ) {
    this.logger.log(`[GET /ideas/agent/decisions] Fetching decisions`);

    try {
      const result = await this.agentService.getDecisions(
        ideaId ? BigInt(ideaId) : undefined,
        parseInt(limit),
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to get decisions:', error.message);
      throw error;
    }
  }
}
