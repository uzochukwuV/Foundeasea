import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  http,
  Chain,
  encodeFunctionData,
  type TransactionSerializable,
  type HDAccount,
  decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Mantle Sepolia Testnet — chain ID 5003
const mantleSepolia: Chain = {
  id: 5003,
  name: 'Mantle Sepolia',
  network: 'mantle-sepolia',
  nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mantle-sepolia.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO'] },
    public:  { http: ['https://mantle-sepolia.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO'] },
  },
  blockExplorers: {
    default: { name: 'Mantlescan', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
} as Chain;
import {
  ideaFactoryAbi,
  fundingPoolAbi,
  agentIdentityAbi,
  daoVotingAbi,
  ideaTokenFactoryAbi,
  fundingPoolFactoryAbi,
  builderAgreementAbi,
  ideaTokenAbi,
  ideaMarketplaceAbi,
} from './abi';

@Injectable()
export class ContractService implements OnModuleInit {
  private logger = new Logger('ContractService');
  private publicClient: any;
  private aiAgentAccount: HDAccount | null = null;
  private chain: Chain;
  private rpcUrl: string = '';

  constructor(private configService: ConfigService) {
    this.chain = mantleSepolia;
  }

  async onModuleInit() {
    this.initializeClients();
    this.logger.log('✅ Contract clients initialized');
  }

  private initializeClients() {
    this.rpcUrl =
      this.configService.get('MANTLE_SEPOLIA_RPC') ||
      this.configService.get('RPC_URL') ||
      'https://mantle-sepolia.g.alchemy.com/v2/gBLyY4xTb-MP1ZkxdnJdTqkYKQjxi_XO';

    // Public client for read operations
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });

    // Account for AI agent write operations
    const aiAgentPrivateKey = this.configService.get('AI_AGENT_PRIVATE_KEY');
    if (!aiAgentPrivateKey || aiAgentPrivateKey === '0x_your_private_key_here') {
      this.logger.warn('AI_AGENT_PRIVATE_KEY not configured or invalid - write operations disabled');
      return;
    }

    this.aiAgentAccount = privateKeyToAccount(aiAgentPrivateKey as `0x${string}`) as unknown as HDAccount;
    this.logger.log(`AI Agent wallet initialized: ${this.aiAgentAccount.address}`);
  }

  getPublicClient() {
    return this.publicClient;
  }

  getAIAgentWallet() {
    // Return a mock wallet object for compatibility
    return {
      account: this.aiAgentAccount,
      address: this.aiAgentAccount?.address,
    };
  }

  getChain() {
    return this.chain;
  }

  getIdeaFactory() {
    const address = this.getIdeaFactoryAddress();
    return this.getContractWrapper(address, ideaFactoryAbi as any);
  }

  // --- Helper accessors for addresses and ABIs (useful for read/write wrappers) ---
  getIdeaFactoryAddress(): `0x${string}` {
    return this.configService.get('IDEA_FACTORY_MANTLE') as `0x${string}`;
  }

  getIdeaFactoryAbi(): any {
    return ideaFactoryAbi as any;
  }

  getAgentIdentityAddress(): `0x${string}` {
    return this.configService.get('AGENT_IDENTITY_MANTLE') as `0x${string}`;
  }

  getAgentIdentityAbi(): any {
    return agentIdentityAbi as any;
  }

  getFundingPoolAbi(): any {
    return fundingPoolAbi as any;
  }

  /** Generic read wrapper using publicClient.readContract to avoid relying on contract.read typing */
  async readContract(address: `0x${string}`, abi: any, functionName: string, args: any[] = []) {
    return await this.publicClient.readContract({ address, abi, functionName, args });
  }

  /** Generic write wrapper using local account signing - sends raw transaction */
  async writeContract(address: `0x${string}`, abi: any, functionName: string, args: any[] = []) {
    if (!this.aiAgentAccount) {
      throw new Error('AI Agent wallet not initialized - write operations are disabled');
    }
    try {
      // Encode function data
      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      });

      // Get current nonce and increment for next transaction
      const nonce = await this.publicClient.getTransactionCount({ address: this.aiAgentAccount.address });
      this.logger.log(`  [Nonce: ${nonce}] Calling ${functionName}...`);

      // Get gas price
      const gasPrice = await this.publicClient.getGasPrice();

      // Estimate gas
      let gas: bigint;
      try {
        const gasEstimate = await this.publicClient.estimateGas({
          account: this.aiAgentAccount.address,
          to: address,
          data,
        });
        gas = gasEstimate * BigInt(12) / BigInt(10); // 20% buffer
      } catch (gasError: any) {
        this.logger.warn('Gas estimation failed, using default:', gasError.message);
        gas = BigInt(2000000); // Default 2M gas
      }

      // Build transaction
      const tx: TransactionSerializable = {
        to: address,
        data,
        gas,
        gasPrice,
        nonce,
        chainId: this.chain.id,
        value: BigInt(0),
      };

      // Sign and send
      const signedTx = await this.aiAgentAccount.signTransaction(tx);
      const hash = await this.publicClient.sendRawTransaction({ serializedTransaction: signedTx });
      
      this.logger.log(`  Transaction sent: ${hash} (nonce: ${nonce})`);
      return hash;
    } catch (error: any) {
      this.logger.error(`Failed to write contract: ${error.message}`);
      
      // Try to decode revert reason from error
      const errorMessage = error.message || '';
      
      // Check for common error patterns
      if (errorMessage.includes('execution reverted')) {
        // Try to extract revert data
        const revertMatch = errorMessage.match(/0x[a-fA-F0-9]+/);
        if (revertMatch) {
          const revertData = revertMatch[0];
          this.logger.error(`   Revert data: ${revertData}`);
          
          // Try to decode common errors
          if (revertData === '0x') {
            this.logger.error('   Empty revert - contract validation failed');
          }
        }
        
        // Check for specific require messages in the error
        if (errorMessage.includes('Invalid caps')) {
          this.logger.error('   Reason: Invalid caps - softCap must be <= hardCap');
        } else if (errorMessage.includes('Invalid target')) {
          this.logger.error('   Reason: Invalid target - targetRaise must be >= softCap');
        } else if (errorMessage.includes('Invalid builder')) {
          this.logger.error('   Reason: Invalid builder allocation - must be 1000-30000 bps');
        } else if (errorMessage.includes('Invalid competition')) {
          this.logger.error('   Reason: Invalid competition prize - must be <= 5000 bps');
        } else if (errorMessage.includes('Invalid gate')) {
          this.logger.error('   Reason: Invalid gate type');
        }
      }
      
      throw error;
    }
  }

  getFundingPoolFactory() {
    const address = this.configService.get('FUNDING_POOL_FACTORY_MANTLE') as `0x${string}`;
    if (!address) throw new Error('FUNDING_POOL_FACTORY_MANTLE not configured');
    return this.getContractWrapper(address, fundingPoolFactoryAbi as any);
  }

  getIdeaTokenFactory() {
    const address = this.configService.get('IDEA_TOKEN_FACTORY_MANTLE') as `0x${string}`;
    if (!address) throw new Error('IDEA_TOKEN_FACTORY_MANTLE not configured');
    return this.getContractWrapper(address, ideaTokenFactoryAbi as any);
  }

  getFundingPool(fundingPoolAddress: string) {
    if (!fundingPoolAddress) throw new Error('FundingPool address required');
    return this.getContractWrapper(fundingPoolAddress as `0x${string}`, fundingPoolAbi as any);
  }

  getIdeaToken(ideaTokenAddress: string) {
    if (!ideaTokenAddress) throw new Error('IdeaToken address required');
    return this.getContractWrapper(ideaTokenAddress as `0x${string}`, ideaTokenAbi as any);
  }

  getAgentIdentity() {
    const address = this.getAgentIdentityAddress();
    return this.getContractWrapper(address, agentIdentityAbi as any);
  }

  getDAOVoting() {
    const address = this.configService.get('DAO_VOTING_MANTLE') as `0x${string}`;
    if (!address) throw new Error('DAO_VOTING_MANTLE not configured');
    return this.getContractWrapper(address, daoVotingAbi as any);
  }

  getDAOVotingAbi(): any {
    return daoVotingAbi as any;
  }

  getBuilderAgreement() {
    const address = this.configService.get('BUILDER_AGREEMENT_MANTLE') as `0x${string}`;
    if (!address) throw new Error('BUILDER_AGREEMENT_MANTLE not configured');
    return this.getContractWrapper(address, builderAgreementAbi as any);
  }

  getIdeaMarketplace() {
    const address = this.configService.get('IDEA_MARKETPLACE_MANTLE') as `0x${string}`;
    if (!address) throw new Error('IDEA_MARKETPLACE_MANTLE not configured');
    return this.getContractWrapper(address, ideaMarketplaceAbi as any);
  }

  /**
   * Return a lightweight wrapper that exposes .address, .abi and .read/.write proxies
   * so existing code that calls contract.read.foo([args]) or contract.write.bar([args]) still works.
   */
  private getContractWrapper(address: `0x${string}`, abi: any) {
    const self = this;
    const proxyRead = new Proxy({}, {
      get(_t, prop: string) {
        return async (args: any[] = []) => {
          // If caller passes single array (e.g., factory.read.getIdea([ideaId]))
          const finalArgs = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          return await self.readContract(address, abi, prop, finalArgs);
        };
      }
    });

    const proxyWrite = new Proxy({}, {
      get(_t, prop: string) {
        return async (args: any[] = []) => {
          const finalArgs = Array.isArray(args[0]) && args.length === 1 ? args[0] : args;
          return await self.writeContract(address, abi, prop, finalArgs);
        };
      }
    });

    return {
      address,
      abi,
      read: proxyRead,
      write: proxyWrite,
    } as any;
  }

  getAIAgentAddress() {
    const address = this.configService.get('AI_AGENT_ADDRESS');
    if (!address) throw new Error('AI_AGENT_ADDRESS not configured');
    return address;
  }

  getUSDYAddress() {
    const address = this.configService.get('USDY_MANTLE');
    if (!address) throw new Error('USDY_MANTLE not configured');
    return address;
  }

  getUSDYAbi(): any {
    // Minimal ABI for USDY mint and approve functions
    return [
      {
        "type": "function",
        "name": "mint",
        "inputs": [
          { "name": "to", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          { "name": "spender", "type": "address" },
          { "name": "amount", "type": "uint256" }
        ],
        "outputs": [{ "type": "bool" }],
        "stateMutability": "nonpayable"
      }
    ] as any;
  }

  /**
   * Mint USDY tokens to an address
   * Only works if the caller (AI agent) is the minter of the USDY contract
   */
  async mintUSDY(to: `0x${string}`, amount: bigint): Promise<string> {
    const usdyAddress = this.getUSDYAddress();
    const usdyAbi = this.getUSDYAbi();
    
    this.logger.log(`Minting ${amount} USDY to ${to}`);
    return await this.writeContract(usdyAddress, usdyAbi, 'mint', [to, amount]);
  }

  /**
   * Approve IdeaFactory to spend USDY
   */
  async approveUSDYForFactory(amount: bigint): Promise<string> {
    const usdyAddress = this.getUSDYAddress();
    const factoryAddress = this.getIdeaFactoryAddress();
    const usdyAbi = this.getUSDYAbi();
    
    this.logger.log(`Approving IdeaFactory (${factoryAddress}) to spend ${amount} USDY`);
    return await this.writeContract(usdyAddress, usdyAbi, 'approve', [factoryAddress, amount]);
  }

  /**
   * Set factories on IdeaFactory contract
   */
  async setFactories(fundingPoolFactory: `0x${string}`, ideaTokenFactory: `0x${string}`): Promise<string> {
    const factoryAddress = this.getIdeaFactoryAddress();
    const abi = this.getIdeaFactoryAbi();
    
    this.logger.log(`Setting factories - FundingPoolFactory: ${fundingPoolFactory}, IdeaTokenFactory: ${ideaTokenFactory}`);
    return await this.writeContract(factoryAddress, abi, 'setFactories', [fundingPoolFactory, ideaTokenFactory]);
  }

  /**
   * Set treasury on IdeaFactory contract
   */
  async setTreasury(treasury: `0x${string}`): Promise<string> {
    const factoryAddress = this.getIdeaFactoryAddress();
    const abi = this.getIdeaFactoryAbi();
    
    this.logger.log(`Setting treasury: ${treasury}`);
    return await this.writeContract(factoryAddress, abi, 'setTreasury', [treasury]);
  }
}
