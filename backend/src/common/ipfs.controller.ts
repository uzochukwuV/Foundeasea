import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IpfsService } from './ipfs.service';

@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  /**
   * Upload submission with documents
   * Documents are uploaded to IPFS and metadata is returned
   */
  @Post('upload-submission')
  async uploadSubmission(@Body() body: {
    title: string;
    description: string;
    oneLiner: string;
    category: string;
    tags: string[];
    videoLinks: string[];
    pitchDeckBase64?: string;
    protocolPdfBase64?: string;
    additionalDocsBase64?: string;
  }) {
    const documents: any = {};

    // Decode base64 files if provided
    if (body.pitchDeckBase64) {
      const buffer = Buffer.from(body.pitchDeckBase64, 'base64');
      documents.pitchDeck = { buffer, fileName: `${body.title}-pitch-deck.pdf` };
    }

    if (body.protocolPdfBase64) {
      const buffer = Buffer.from(body.protocolPdfBase64, 'base64');
      documents.protocolPdf = { buffer, fileName: `${body.title}-protocol.pdf` };
    }

    if (body.additionalDocsBase64) {
      const buffer = Buffer.from(body.additionalDocsBase64, 'base64');
      documents.additionalDocs = { buffer, fileName: `${body.title}-additional-docs.pdf` };
    }

    const result = await this.ipfsService.uploadFullSubmission(
      {
        title: body.title,
        description: body.description,
        oneLiner: body.oneLiner,
        category: body.category,
        tags: body.tags,
      },
      documents,
      body.videoLinks
    );

    return {
      success: result.success,
      data: result.success ? {
        metadataHash: result.metadataHash,
        pitchDeckHash: result.pitchDeckHash,
        protocolPdfHash: result.protocolPdfHash,
        additionalDocsHash: result.additionalDocsHash,
        metadataGatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.metadataHash}`,
      } : null,
      error: result.error,
    };
  }

  /**
   * Validate submission completeness for AI review
   */
  @Post('validate-submission')
  async validateSubmission(@Body() body: {
    metadataHash: string;
    pitchDeckHash?: string;
    protocolPdfHash?: string;
    additionalDocsHash?: string;
    videoLinks?: string[];
  }) {
    const validation = {
      hasPitchDeck: !!body.pitchDeckHash,
      hasProtocolPdf: !!body.protocolPdfHash,
      hasAdditionalDocs: !!body.additionalDocsHash,
      hasVideoLinks: body.videoLinks && body.videoLinks.length > 0,
      completenessScore: 0,
      recommendations: [] as string[],
    };

    // Calculate completeness score
    let score = 30; // Base score for basic metadata
    if (validation.hasPitchDeck) {
      score += 25;
    } else {
      validation.recommendations.push('Add a pitch deck for better AI evaluation');
    }
    if (validation.hasProtocolPdf) {
      score += 30;
    } else {
      validation.recommendations.push('Add a protocol description document');
    }
    if (validation.hasVideoLinks) {
      score += 15;
    }
    validation.completenessScore = score;

    return {
      success: true,
      data: validation,
    };
  }

  /**
   * Fetch submission content from IPFS
   */
  @Post('fetch-submission')
  async fetchSubmission(@Body() body: { metadataHash: string }) {
    const result = await this.ipfsService.fetchFromIpfs(body.metadataHash);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: result.data,
    };
  }
}