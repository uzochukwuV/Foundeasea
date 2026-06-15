import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PinataUploadResult {
  success: boolean;
  ipfsHash: string;
  gatewayUrl: string;
  error?: string;
}

export interface SubmissionDocuments {
  pitchDeck?: string;      // Base64 or file path
  protocolPdf?: string;    // Base64 or file path
  additionalDocs?: string; // Base64 or file path
  videoLinks?: string[];
}

export interface FullSubmission {
  metadata: {
    title: string;
    description: string;
    oneLiner: string;
    category: string;
    tags: string[];
  };
  pitchDeckHash: string;
  protocolPdfHash: string;
  additionalDocsHash: string;
  videoLinks: string[];
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      this.logger.warn('Pinata API keys not configured. File uploads will be mocked.');
    } else {
      this.logger.log('Pinata API configured for IPFS uploads');
    }
  }

  /**
   * Upload a single file to IPFS via Pinata
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options?: { pinataMetadata?: Record<string, string> }
  ): Promise<PinataUploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return this.mockUpload(fileName);
    }

    try {
      const formData = new FormData();
      
      // Create temp file for upload
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, fileName);
      fs.writeFileSync(tempFile, fileBuffer);
      
      formData.append('file', fs.createReadStream(tempFile), {
        filename: fileName,
      });

      const pinataMetadata = options?.pinataMetadata || { name: fileName };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1,
      }));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      // Clean up temp file
      fs.unlinkSync(tempFile);

      const ipfsHash = response.data.IpfsHash;
      this.logger.log(`Uploaded ${fileName} to IPFS: ${ipfsHash}`);

      return {
        success: true,
        ipfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      };
    } catch (error: any) {
      this.logger.error(`Failed to upload ${fileName}:`, error.message);
      return {
        success: false,
        ipfsHash: '',
        gatewayUrl: '',
        error: error.message,
      };
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJson(metadata: Record<string, any>): Promise<PinataUploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return this.mockUpload('metadata.json');
    }

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: metadata,
          pinataMetadata: {
            name: metadata.name || 'FounderSea Metadata',
          },
          pinataOptions: {
            cidVersion: 1,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      this.logger.log(`Uploaded metadata to IPFS: ${ipfsHash}`);

      return {
        success: true,
        ipfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      };
    } catch (error: any) {
      this.logger.error('Failed to upload metadata:', error.message);
      return {
        success: false,
        ipfsHash: '',
        gatewayUrl: '',
        error: error.message,
      };
    }
  }

  /**
   * Upload submission documents and create comprehensive metadata
   */
  async uploadFullSubmission(
    metadata: FullSubmission['metadata'],
    documents: {
      pitchDeck?: { buffer: Buffer; fileName: string };
      protocolPdf?: { buffer: Buffer; fileName: string };
      additionalDocs?: { buffer: Buffer; fileName: string };
    },
    videoLinks?: string[]
  ): Promise<{
    success: boolean;
    metadataHash: string;
    pitchDeckHash: string;
    protocolPdfHash: string;
    additionalDocsHash: string;
    error?: string;
  }> {
    const results: { [key: string]: string } = {};

    // Upload pitch deck if provided
    if (documents.pitchDeck) {
      const result = await this.uploadFile(
        documents.pitchDeck.buffer,
        documents.pitchDeck.fileName,
        { pinataMetadata: { name: `pitch-deck-${metadata.title}` } }
      );
      if (!result.success) {
        return { success: false, metadataHash: '', pitchDeckHash: '', protocolPdfHash: '', additionalDocsHash: '', error: result.error };
      }
      results.pitchDeck = result.ipfsHash;
    }

    // Upload protocol PDF if provided
    if (documents.protocolPdf) {
      const result = await this.uploadFile(
        documents.protocolPdf.buffer,
        documents.protocolPdf.fileName,
        { pinataMetadata: { name: `protocol-pdf-${metadata.title}` } }
      );
      if (!result.success) {
        return { success: false, metadataHash: '', pitchDeckHash: '', protocolPdfHash: '', additionalDocsHash: '', error: result.error };
      }
      results.protocolPdf = result.ipfsHash;
    }

    // Upload additional docs if provided
    if (documents.additionalDocs) {
      const result = await this.uploadFile(
        documents.additionalDocs.buffer,
        documents.additionalDocs.fileName,
        { pinataMetadata: { name: `additional-docs-${metadata.title}` } }
      );
      if (!result.success) {
        return { success: false, metadataHash: '', pitchDeckHash: '', protocolPdfHash: '', additionalDocsHash: '', error: result.error };
      }
      results.additionalDocs = result.ipfsHash;
    }

    // Create comprehensive metadata
    const fullMetadata = {
      name: metadata.title,
      description: metadata.description,
      oneLiner: metadata.oneLiner,
      category: metadata.category,
      tags: metadata.tags,
      pitchDeck: results.pitchDeck ? `ipfs://${results.pitchDeck}` : null,
      protocolPdf: results.protocolPdf ? `ipfs://${results.protocolPdf}` : null,
      additionalDocs: results.additionalDocs ? `ipfs://${results.additionalDocs}` : null,
      videoLinks: videoLinks || [],
      submittedAt: new Date().toISOString(),
      version: '1.0',
    };

    const metadataResult = await this.uploadJson(fullMetadata);
    if (!metadataResult.success) {
      return {
        success: false,
        metadataHash: '',
        pitchDeckHash: results.pitchDeck || '',
        protocolPdfHash: results.protocolPdf || '',
        additionalDocsHash: results.additionalDocs || '',
        error: metadataResult.error,
      };
    }

    return {
      success: true,
      metadataHash: metadataResult.ipfsHash,
      pitchDeckHash: results.pitchDeck || '',
      protocolPdfHash: results.protocolPdf || '',
      additionalDocsHash: results.additionalDocs || '',
    };
  }

  /**
   * Mock upload for development/testing
   */
  private mockUpload(fileName: string): PinataUploadResult {
    const mockHash = 'Qm' + Date.now().toString(36) + fileName.replace(/[^a-zA-Z0-9]/g, '');
    this.logger.warn(`Mock upload for ${fileName}: ${mockHash}`);
    return {
      success: true,
      ipfsHash: mockHash,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
    };
  }

  /**
   * Fetch content from IPFS gateway
   */
  async fetchFromIpfs(cid: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const gateways = [
        'https://gateway.pinata.cloud/ipfs/',
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
      ];

      for (const gateway of gateways) {
        try {
          const response = await axios.get(`${gateway}${cid}`, { timeout: 10000 });
          return { success: true, data: response.data };
        } catch {
          // Try next gateway
        }
      }

      return { success: false, error: 'Failed to fetch from all gateways' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}