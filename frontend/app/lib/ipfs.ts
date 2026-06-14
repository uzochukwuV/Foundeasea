// Mock IPFS/Pinata upload for development
// In production, replace with actual Pinata API calls

const MOCK_IPFS_HASH = "QmXyz123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface IPFSMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: unknown;
}

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash: string;
  gatewayUrl: string;
  error?: string;
}

// Mock upload to IPFS (Pinata-style)
export async function uploadToIPFS(
  metadata: IPFSMetadata,
  apiKey?: string,
  apiSecret?: string
): Promise<IPFSUploadResult> {
  try {
    // Simulate API delay
    await delay(500 + Math.random() * 1000);

    // If API keys are provided, use real Pinata API
    if (apiKey && apiSecret) {
      try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: apiKey,
            pinata_secret_api_key: apiSecret,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: metadata.name || "FounderSea Idea Metadata",
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Pinata API error: ${response.statusText}`);
        }

        const result = await response.json();
        return {
          success: true,
          ipfsHash: result.IpfsHash,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        };
      } catch (apiError) {
        console.warn("Pinata API failed, falling back to mock:", apiError);
      }
    }

    // Mock response
    const mockHash = MOCK_IPFS_HASH + Date.now().toString(36);
    return {
      success: true,
      ipfsHash: mockHash,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
    };
  } catch (error) {
    return {
      success: false,
      ipfsHash: "",
      gatewayUrl: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Upload file to IPFS
export async function uploadFileToIPFS(
  file: File,
  apiKey?: string,
  apiSecret?: string
): Promise<IPFSUploadResult> {
  try {
    // Simulate upload delay based on file size
    const uploadTime = Math.min(file.size / 1000, 2000);
    await delay(uploadTime + 500);

    // If API keys are provided, use real Pinata API
    if (apiKey && apiSecret) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "pinataMetadata",
          JSON.stringify({ name: file.name })
        );

        const response = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              pinata_api_key: apiKey,
              pinata_secret_api_key: apiSecret,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Pinata API error: ${response.statusText}`);
        }

        const result = await response.json();
        return {
          success: true,
          ipfsHash: result.IpfsHash,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        };
      } catch (apiError) {
        console.warn("Pinata API upload failed, falling back to mock:", apiError);
      }
    }

    // Mock response
    const mockHash = MOCK_IPFS_HASH + file.name.replace(/[^a-z0-9]/gi, "");
    return {
      success: true,
      ipfsHash: mockHash,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
    };
  } catch (error) {
    return {
      success: false,
      ipfsHash: "",
      gatewayUrl: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Create idea metadata for IPFS
export function createIdeaMetadata(params: {
  title: string;
  description: string;
  creator: string;
  targetRaise: string;
  softCap: string;
  hardCap: string;
  deadline: Date;
  builderAllocBps: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
}): IPFSMetadata {
  return {
    name: params.title,
    description: params.description,
    image: params.imageUrl,
    attributes: [
      {
        trait_type: "Creator",
        value: params.creator,
      },
      {
        trait_type: "Target Raise",
        value: params.targetRaise,
      },
      {
        trait_type: "Soft Cap",
        value: params.softCap,
      },
      {
        trait_type: "Hard Cap",
        value: params.hardCap,
      },
      {
        trait_type: "Builder Allocation",
        value: `${(params.builderAllocBps / 100).toFixed(0)}%`,
      },
      {
        trait_type: "Deadline",
        value: params.deadline.toISOString(),
      },
      ...(params.category
        ? [{ trait_type: "Category", value: params.category }]
        : []),
      ...(params.tags
        ? params.tags.map((tag) => ({ trait_type: "Tag", value: tag }))
        : []),
    ],
    createdAt: new Date().toISOString(),
    protocol: "FounderSea",
    version: "1.0",
  };
}

// Generate a mock CID (Content Identifier) for display
export function generateMockCID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "Qm";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
