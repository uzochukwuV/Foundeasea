// ABIs for all FounderSea smart contracts
// Generated from src/contracts/

export const IDEA_FACTORY_ABI = [
  // View functions
  "function USDY() view returns (address)",
  "function aiAgent() view returns (address)",
  "function treasury() view returns (address)",
  "function agentIdentity() view returns (address)",
  "function fundingPoolFactory() view returns (address)",
  "function ideaTokenFactory() view returns (address)",
  "function nextIdeaId() view returns (uint256)",
  "function MIN_CREATOR_DEPOSIT() view returns (uint256)",
  "function ABANDONMENT_FEE_BPS() view returns (uint256)",
  "function ideas(uint256 ideaId) view returns (address creator, address ideaToken, address fundingPool, address fundingGate, uint8 status, uint256 aiScore, string approvalReasonHash)",
  "function ideaTokens(uint256 ideaId) view returns (address)",
  "function fundingPools(uint256 ideaId) view returns (address)",
  "function builderAgreements(uint256 ideaId) view returns (address)",
  "function aiApproved(uint256 ideaId) view returns (bool)",
  "function creatorIdeas(address creator) view returns (uint256[])",
  "function getIdeaStatus(uint256 ideaId) view returns (uint8)",
  "function isIdeaApproved(uint256 ideaId) view returns (bool)",
  "function getIdea(uint256 ideaId) view returns (address creator, address ideaToken, address fundingPool, address fundingGate, uint8 status, uint256 aiScore, string approvalReasonHash)",
  "function getCreatorIdeas(address creator) view returns (uint256[])",
  // Write functions
  "function setTreasury(address _treasury)",
  "function setAiAgent(address _aiAgent)",
  "function setAgentIdentity(address _agentIdentity)",
  "function setFactories(address _fundingPoolFactory, address _ideaTokenFactory)",
  "function createIdea((string metadataIpfsHash, uint256 targetRaise, uint256 softCap, uint256 hardCap, uint256 fundingDeadline, uint256 competitionPrizeBps, uint256 builderAllocBps, uint8 gateType, bytes gateParams) calldata config) returns (uint256 ideaId)",
  "function aiApproveIdea(uint256 ideaId, uint256 score, string reasonHash)",
  "function aiRejectIdea(uint256 ideaId, string reasonHash)",
  "function abandonIdea(uint256 ideaId)",
  "function updateIdeaStatus(uint256 ideaId, uint8 newStatus)",
  "function wireRevenueSource(uint256 ideaId, address revenueSource)",
  "function registerBuilderAgreement(uint256 ideaId, address agreement)",
  // Events
  "event IdeaCreated(uint256 indexed ideaId, address creator, address ideaToken, address fundingPool)",
  "event IdeaApprovedByAI(uint256 indexed ideaId, uint256 score)",
  "event IdeaRejectedByAI(uint256 indexed ideaId, string reasonIpfsHash)",
  "event IdeaAbandoned(uint256 indexed ideaId, uint256 refundAmount)",
  "event FundingPoolConfigured(uint256 indexed ideaId, address fundingPool)",
  "event RevenueSourceWired(uint256 indexed ideaId, address revenueSource)",
] as const;

export const FUNDING_POOL_ABI = [
  // View functions
  "function fundingToken() view returns (address)",
  "function ideaToken() view returns (address)",
  "function gate() view returns (address)",
  "function aiAgent() view returns (address)",
  "function dao() view returns (address)",
  "function builder() view returns (address)",
  "function factory() view returns (address)",
  "function softCap() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function raisedAmount() view returns (uint256)",
  "function competitionPrizeBps() view returns (uint256)",
  "function fundingClosed() view returns (bool)",
  "function builderAssigned() view returns (bool)",
  "function competitorsSet() view returns (bool)",
  "function competitorPayouts(uint256) view returns (address builder, uint256 amount, bool released, uint256 aiConfidence, string validationIpfsHash)",
  "function milestones(uint256) view returns (uint256 amount, uint256 deadline, uint8 status, uint256 aiConfidence, string validationIpfsHash)",
  "function getMilestoneStatus(uint256 index) view returns (uint8)",
  "function getMilestoneCount() view returns (uint256)",
  "function checkSoftCapMet() view returns (bool)",
  "function getFundingToken() view returns (address)",
  "function tokensForAmount(uint256 amount) view returns (uint256)",
  "function COMPETITION_THRESHOLD() view returns (uint256)",
  // Write functions
  "function updateFactory(address _factory, address newOwner)",
  "function setAiAgent(address _aiAgent)",
  "function setDao(address _dao)",
  "function setIdeaToken(address _ideaToken)",
  "function deposit(uint256 amount)",
  "function closeFunding()",
  "function setCompetitorPayouts(address[3] _builders, uint256[3] _amounts)",
  "function validateCompetitor(uint256 slot, uint256 confidence, string ipfsHash)",
  "function releaseCompetitorPayout(uint256 slot)",
  "function assignBuilder(address _builder, uint256[] milestoneAmounts, uint256[] milestoneDeadlines)",
  "function releaseMilestone(uint256 index)",
  "function daoReleaseMilestone(uint256 index)",
  "function slashCompetitorPayout(uint256 slot)",
  "function setMilestoneValidated(uint256 index, uint256 confidence, string ipfsHash)",
  "function submitMilestone(uint256 index)",
  "function refund()",
  "function addMilestones(uint256[] amounts, uint256[] deadlines)",
  // Events
  "event Deposit(address indexed investor, uint256 amount, uint256 tokensMinted)",
  "event FundingClosed(bool softCapMet)",
  "event MilestoneReleased(uint256 index, uint256 amount)",
  "event MilestoneValidated(uint256 index, uint256 confidence)",
  "event CompetitorPayoutReleased(uint256 slot, address builder, uint256 amount)",
  "event BuilderAssigned(address indexed builder)",
] as const;

export const FUNDING_POOL_FACTORY_ABI = [
  // View functions
  // Write functions
  "function createFundingPool(uint256 ideaId, address usdy, address creator, uint256 softCap, uint256 hardCap, uint256 competitionPrizeBps, address treasury) returns (address fundingPool, address fundingGate)",
  "function setIdeaTokenOnPool(address fundingPool, address ideaToken)",
  // Events
  "event FundingPoolCreated(uint256 indexed ideaId, address fundingPool, address fundingGate, uint256 softCap, uint256 hardCap)",
] as const;

export const IDEA_TOKEN_ABI = [
  // View functions
  "function USDY() view returns (address)",
  "function fundingPool() view returns (address)",
  "function revenueSource() view returns (address)",
  "function ideaCreator() view returns (address)",
  "function builderAllocBps() view returns (uint256)",
  "function assignedBuilder() view returns (address)",
  "function builderAllocMinted() view returns (bool)",
  "function revenuePerTokenStored() view returns (uint256)",
  "function revenueDebt(address) view returns (uint256)",
  "function revenueDistributor() view returns (address)",
  "function factory() view returns (address)",
  "function earned(address account) view returns (uint256)",
  "function isBuilderAllocMinted() view returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  // Write functions
  "function setRevenueSource(address source)",
  "function setRevenueDistributor(address distributor)",
  "function notifyRevenue(uint256 amount)",
  "function claimRevenue() returns (uint256 amount)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
  "function mintBuilderAlloc(address builder)",
  // Events
] as const;

export const IDEA_TOKEN_FACTORY_ABI = [
  // View functions
  "function TOKEN_NAME_PREFIX() view returns (string)",
  "function TOKEN_SYMBOL_PREFIX() view returns (string)",
  // Write functions
  "function createIdeaToken(uint256 ideaId, address fundingPool, address creator, uint256 builderAllocBps, address factory, address usdy) returns (address token)",
  // Events
  "event IdeaTokenCreated(uint256 indexed ideaId, address ideaToken, address fundingPool, address creator)",
] as const;

export const FUNDING_GATE_ABI = [
  // View functions
  "function gateType() view returns (uint8)",
  "function creator() view returns (address)",
  "function dao() view returns (address)",
  "function whitelist(address) view returns (bool)",
  "function holdToken() view returns (address)",
  "function minHoldAmount() view returns (uint256)",
  "function daoApprover() view returns (address)",
  "function daoApproved(address) view returns (bool)",
  "function canFund(address investor) view returns (bool)",
  // Write functions
  "function setGateType(uint8 _gateType, bytes calldata params)",
  "function updateWhitelist(address[] addrs, bool[] states)",
  "function daoApproveInvestor(address investor)",
  "function setDaoApprover(address _approver)",
  // Events
  "event GateTypeSet(uint8 gateType)",
  "event WhitelistUpdated(address[] addrs, bool[] states)",
  "event DaoApproverSet(address daoApprover)",
  "event InvestorDaoApproved(address investor)",
] as const;

export const BUILDER_AGREEMENT_ABI = [
  // View functions
  "function nextAgreementId() view returns (uint256)",
  "function agreements(uint256 agreementId) view returns (uint256 ideaId, address ideaToken, address factory, address[] builders, string agreementIpfsHash, address revenueSource, bool creatorSigned, bool builderSigned, bool daoSigned, uint256 signedAt, bool active)",
  "function isBuilder(address) view returns (bool)",
  "function builderAgreements(address builder) view returns (uint256[])",
  "function isFullySigned(uint256 agreementId) view returns (bool)",
  "function isActive(uint256 agreementId) view returns (bool)",
  "function getBuilderAgreements(address builder) view returns (uint256[])",
  // Write functions
  "function initialize(address _factory)",
  "function createAgreement(uint256 _ideaId, address _ideaToken, address _factory, address[] _builders, string _agreementIpfsHash) returns (uint256 agreementId)",
  "function builderSign(uint256 agreementId, address _revenueSource)",
  "function creatorSign(uint256 agreementId)",
  "function daoSign(uint256 agreementId)",
  // Events
  "event AgreementCreated(uint256 indexed agreementId, uint256 ideaId, address[] builders)",
  "event AgreementSigned(uint256 indexed agreementId, address signer)",
  "event AgreementActivated(uint256 indexed agreementId)",
  "event RevenueSourceSet(uint256 indexed agreementId, address revenueSource)",
] as const;

export const DAO_VOTING_ABI = [
  // View functions
  "function aiAgent() view returns (address)",
  "function ideaToken() view returns (address)",
  "function delegatedToAI(address) view returns (bool)",
  "function totalDelegatedPower() view returns (uint256)",
  "function nextProposalId() view returns (uint256)",
  "function votingDuration() view returns (uint256)",
  "function proposals(uint256 proposalId) view returns (uint256 ideaId, string descriptionIpfsHash, uint256 votingDeadline, uint256 yesVotes, uint256 noVotes, uint256 aiYesVotes, uint256 aiNoVotes, bool executed, bool aiRecommendation, uint256 aiConfidence, bool created, uint256 snapshotBlock)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function aiHasVoted(uint256 proposalId) view returns (bool)",
  "function getProposalStatus(uint256 proposalId) view returns (uint256 yesVotes, uint256 noVotes, uint256 aiYesVotes, uint256 aiNoVotes, bool executed, bool votingActive)",
  // Write functions
  "function setAiAgent(address _aiAgent)",
  "function setIdeaToken(address _ideaToken)",
  "function delegateToAI()",
  "function revokeDelegation()",
  "function createProposal(uint256 _ideaId, string _descriptionIpfsHash, uint256 _customDuration) returns (uint256 proposalId)",
  "function vote(uint256 proposalId, bool support)",
  "function castAIVotes(uint256 proposalId, bool support, uint256 confidence, string reasoningIpfsHash)",
  "function execute(uint256 proposalId)",
  // Events
  "event VoteDelegatedToAI(address indexed holder)",
  "event DelegationRevoked(address indexed holder)",
  "event ProposalCreated(uint256 indexed proposalId, uint256 ideaId)",
  "event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 power)",
  "event AIVotesCast(uint256 indexed proposalId, bool support, uint256 power, uint256 confidence)",
  "event ProposalExecuted(uint256 indexed proposalId, bool passed)",
] as const;

export const IDEA_MARKETPLACE_ABI = [
  // View functions
  "function PROTOCOL_FEE_BPS() view returns (uint256)",
  "function treasury() view returns (address)",
  "function usdy() view returns (address)",
  "function nextListingId() view returns (uint256)",
  "function nextBidId() view returns (uint256)",
  "function listings(uint256 listingId) view returns (address seller, address ideaToken, uint256 amount, uint256 askPricePerToken, uint256 expiry, bool active, address requiredHoldToken, uint256 requiredHoldAmount)",
  "function bids(uint256 bidId) view returns (address bidder, address ideaToken, uint256 amount, uint256 bidPricePerToken, uint256 expiry, bool active)",
  "function nonces(address) view returns (uint256)",
  "function BID_TYPEHASH() view returns (bytes32)",
  // Write functions
  "function setTreasury(address _treasury)",
  "function createListing(address _ideaToken, uint256 _amount, uint256 _askPrice, uint256 _expiry, address _holdToken, uint256 _holdAmount) returns (uint256 id)",
  "function acceptListing(uint256 listingId)",
  "function placeBid(address _ideaToken, uint256 _amount, uint256 _bidPrice, uint256 _expiry) returns (uint256 id)",
  "function acceptBid(uint256 bidId)",
  "function settleSignedBid(address seller, (address ideaToken, uint256 amount, uint256 bidPricePerToken, uint256 expiry, bool active) calldata bid, bytes signature)",
  "function cancelListing(uint256 listingId)",
  "function cancelBid(uint256 bidId)",
  // Events
  "event ListingCreated(uint256 indexed listingId, address seller, address ideaToken, uint256 amount, uint256 price)",
  "event ListingAccepted(uint256 indexed listingId, address buyer, address seller, uint256 totalPrice)",
  "event BidPlaced(uint256 indexed bidId, address bidder, address ideaToken, uint256 amount, uint256 price)",
  "event BidAccepted(uint256 indexed bidId, address seller, address buyer, uint256 totalPrice)",
  "event SignedBidSettled(uint256 indexed bidId, address seller, address buyer)",
] as const;

export const AGENT_IDENTITY_ABI = [
  // View functions
  "function agentId() view returns (uint256)",
  "function agentName() view returns (string)",
  "function modelId() view returns (string)",
  "function creationTime() view returns (uint256)",
  "function aiAgent() view returns (address)",
  "function decisions(uint256) view returns (uint256 timestamp, uint8 decisionType, uint256 subjectId, bytes32 inputHash, bytes32 outputHash, uint256 confidence, string reasoningIpfsHash)",
  "function decisionsByType(uint8) view returns (uint256[])",
  "function totalDecisions() view returns (uint256)",
  "function getDecision(uint256 index) view returns ((uint256 timestamp, uint8 decisionType, uint256 subjectId, bytes32 inputHash, bytes32 outputHash, uint256 confidence, string reasoningIpfsHash))",
  "function getDecisionsByType(uint8 decisionType) view returns (uint256[])",
  "function getDecisionsBySubjectId(uint256 _subjectId) view returns ((uint256 timestamp, uint8 decisionType, uint256 subjectId, bytes32 inputHash, bytes32 outputHash, uint256 confidence, string reasoningIpfsHash)[])",
  "function getAverageConfidence(uint8 decisionType) view returns (uint256)",
  "function getDecisionCountByType() view returns (uint256[8] counts)",
  "function hashInput(bytes data) view returns (bytes32)",
  // Write functions
  "function mintAgent(string name, string _modelId) returns (uint256)",
  "function setAiAgent(address _aiAgent)",
  "function recordDecision(uint8 decisionType, uint256 subjectId, bytes32 inputHash, bytes32 outputHash, uint256 confidence, string reasoningIpfsHash)",
  // Events
  "event DecisionRecorded(uint256 indexed agentId, uint8 indexed decisionType, uint256 indexed subjectId, uint256 confidence)",
  "event AgentMinted(address indexed owner, string name, string model)",
] as const;

export const MOCK_USDY_ABI = [
  // View functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  // Write functions
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 amount)",
] as const;

// ERC20 ABI for generic token interactions
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
] as const;

// Common interfaces
export const IERC20_ABI = ERC20_ABI;
export const IERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
] as const;
