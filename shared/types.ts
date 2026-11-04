export type AccessLevel = 'LEVEL_1_CONSULTATION' | 'LEVEL_2_PREPARATION' | 'LEVEL_3_EXECUTION';

export type SkillId = 
  | 'reasoning'
  | 'voice'
  | 'vision'
  | 'memory'
  | 'web_search'
  | 'developer'
  | 'automation'
  | 'documents'
  | 'translation'
  | 'creative';

export type ConnectorId = 
  | 'gemini'
  | 'openai'
  | 'nvidia'
  | 'openrouter'
  | 'google'
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'firebase'
  | 'whatsapp'
  | 'spotify'
  | 'custom_api';

export type AIProviderId = 'gemini' | 'openai' | 'nvidia' | 'openrouter';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  endpoint: string;
  description: string;
  keyUrl: string;
  hasKey: boolean;
  maskedKey: string;
  status: 'connected' | 'configured_untested' | 'not_configured' | 'error';
  models: string[];
  selectedModel: string;
}

export type ConnectorStatus = 
  | 'connected_and_tested'
  | 'configured_untested'
  | 'expired'
  | 'not_configured'
  | 'error'
  | 'simulation';

export type AgentId = 
  | 'chloe_orchestrator'
  | 'search_agent'
  | 'dev_agent'
  | 'ui_agent'
  | 'analysis_agent'
  | 'docs_agent'
  | 'comm_agent'
  | 'personal_agent'
  | 'automation_agent'
  | 'creative_agent'
  | 'security_agent'
  | 'quality_agent';

export type SkillCategory =
  | 'reasoning'
  | 'developer'
  | 'coding'
  | 'web_search'
  | 'search'
  | 'documents'
  | 'files'
  | 'creative'
  | 'creativity'
  | 'vision'
  | 'multimodal'
  | 'voice'
  | 'audio'
  | 'automation'
  | 'memory'
  | 'communication'
  | 'custom';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  model: string;
  status: 'idle' | 'active' | 'processing' | 'standby';
  tools: string[];
  skills?: string[];
  mcpServers?: string[];
  executionCount: number;
}

export interface SkillHistoryEntry {
  id?: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  latencyMs?: number;
  details?: string;
  agentId?: string;
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  category?: SkillCategory;
  icon?: string;
  enabled: boolean;
  accessLevel: AccessLevel;
  permissions: string[];
  dependencies: string[];
  systemPrompt?: string;
  userPromptTemplate?: string;
  recommendedModel?: string;
  compatibleApis?: string[];
  allowedAgents?: AgentId[];
  rateLimitDaily?: number;
  isCustom?: boolean;
  lastUsed?: string;
  usageCount: number;
  stats?: {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    avgLatencyMs: number;
  };
  history?: SkillHistoryEntry[];
  // Continuous Learning & Learned Procedures
  objective?: string;
  method?: string;
  executionSteps?: string[];
  toolsNeeded?: string[];
  examples?: string[];
  limitations?: string[];
  createdAt?: string;
  updatedAt?: string;
  sourceConversationId?: string;
}


export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  enabled: boolean;
  allowedAgents?: AgentId[];
}

export interface MCPResourceInfo {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface MCPPromptInfo {
  name: string;
  description?: string;
  arguments?: { name: string; description?: string; required?: boolean }[];
}

export interface MCPCallLog {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  args: Record<string, any>;
  result: any;
  status: 'success' | 'error';
  durationMs: number;
  timestamp: string;
  agentId?: string;
  error?: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  transport: 'http' | 'sse' | 'streamable_http' | 'streamable-http' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  headers?: Record<string, string>;
  apiKey?: string;
  maskedKey?: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  enabled: boolean;
  tools: MCPToolInfo[];
  resources: MCPResourceInfo[];
  prompts: MCPPromptInfo[];
  assignedAgents: AgentId[];
  lastPingMs?: number;
  latencyMs?: number;
  lastConnected?: string;
  errorMessage?: string;
  callCount: number;
}

export interface ConnectorConfig {
  id: ConnectorId;
  name: string;
  description: string;
  status: ConnectorStatus;
  authType: 'oauth2' | 'api_key' | 'webhook' | 'service_account';
  permissions: string[];
  lastConnected?: string;
  lastHealthCheck?: string;
  healthMessage?: string;
  configData?: Record<string, string>;
  tokenExpiresAt?: string;
}

export type MemoryCategory = 
  | 'identity_preferences'
  | 'habits'
  | 'projects'
  | 'useful_info'
  | 'important_chats'
  | 'goals'
  | 'reminders'
  | 'reference_docs';

export interface MemoryItem {
  id: string;
  userId: string;
  category: MemoryCategory;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPinned?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charStart: number;
  charEnd: number;
  score?: number;
}

export interface DocumentItem {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  summary?: string;
  chunksCount: number;
  uploadedAt: string;
  content?: string;
  chunks?: DocumentChunk[];
}

export interface AutomationTask {
  id: string;
  userId: string;
  name: string;
  description: string;
  trigger: 'schedule' | 'event' | 'manual';
  triggerDetail: string;
  conditions: string;
  action: string;
  accessLevel: AccessLevel;
  status: 'active' | 'paused' | 'completed' | 'failed';
  lastRun?: string;
  nextRun?: string;
  executionCount: number;
  logs: string[];
}

export interface PendingApproval {
  id: string;
  userId: string;
  action: string;
  service: string;
  payload: Record<string, any>;
  expectedResult: string;
  createdAt: string;
  expiresAt: string; // 15-minute TTL
  signature: string; // cryptographic hash token to prevent replay
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  resolvedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string;
  agent: string;
  skillId?: SkillId | string;
  action: string;
  level: AccessLevel;
  status: 'success' | 'warning' | 'error' | 'pending';
  details: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  images?: string[]; // base64 or url
  sources?: { title: string; url: string; snippet?: string }[];
  toolsUsed?: { name: string; args?: any; result?: any; status: 'executing' | 'success' | 'failed' }[];
  agentInvolved?: AgentId;
  approvalId?: string;
  audioUrl?: string;
  imageGeneration?: {
    prompt: string;
    revisedPrompt?: string;
    provider: string;
    model: string;
    aspectRatio?: string;
    status: 'generating' | 'completed' | 'failed';
  };
  learnedSkill?: {
    id: string;
    name: string;
    action: 'created' | 'enriched';
    summary: string;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface UserSettings {
  assistantName: string;
  avatarUrl: string;
  personality: string;
  language: string;
  voiceGender: 'female' | 'male';
  voiceSpeed: number;
  voicePitch: number;
  model: string;
  theme: 'dark' | 'light';
  ecoMode: boolean;
  dailyRequestLimit: number;
  webSearchEnabled: boolean;
  audioAutoSpeak: boolean;
  ownerEmail: string;
  continuousLearningEnabled?: boolean;
  autoSaveSkills?: boolean;
  imageProvider?: AIProviderId | 'auto';
  imageModel?: string;
}


export interface SystemUsage {
  totalRequests: number;
  todayRequests: number;
  estimatedTokens: number;
  toolInvocations: number;
  documentsIndexed: number;
  storageBytesUsed: number;
  estimatedCostEur: number;
  lastUpdated: string;
}

export interface TestResult {
  id: number;
  name: string;
  description: string;
  category: string;
  method: string;
  expectedResult: string;
  actualResult: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  output?: string;
  durationMs?: number;
}
