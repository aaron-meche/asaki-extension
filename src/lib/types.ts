export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'grok';
export type QueryMode = 'orchestrated' | 'single';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  color: string;
  models: ModelMeta[];
}

export interface ModelMeta {
  index: number;
  name: string;
  label: string;
  inputCost: number;
  outputCost: number;
}

export interface ProviderSettings {
  enabled: boolean;
  apiKey: string;
  modelIndex: number;
}

export interface Settings {
  providers: Record<ProviderId, ProviderSettings>;
  consensusProvider: ProviderId;
  defaultMode: QueryMode;
  defaultSingleProvider: ProviderId;
  defaultOrchestratedProviders: ProviderId[];
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  theme: 'system' | 'light' | 'dark';
  historyEnabled: boolean;
  pageContextEnabled: boolean;
}

export type ProviderStatus = 'idle' | 'loading' | 'done' | 'error';

export interface ProviderResult {
  status: ProviderStatus;
  text: string;
  error?: string;
  cost?: string;
}

export interface ConsensusResult {
  status: ProviderStatus;
  text: string;
  error?: string;
  confidence?: string;
  provider?: ProviderId;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  query: string;
  sourceUrl: string;
  sourceTitle: string;
  mode: QueryMode;
  selectedProvider?: ProviderId;
  selectedProviders?: ProviderId[];
  customPrompt?: string;
  responses: Partial<Record<ProviderId, string>>;
  consensus: string;
}

export interface PendingQuery {
  query: string;
  sourceUrl: string;
  sourceTitle: string;
  pageText?: string;
  mode: QueryMode;
  selectedProvider?: ProviderId;
  selectedProviders?: ProviderId[];
  customPrompt?: string;
  isCustom: boolean;
  tabId?: number;
}

export interface SelectionContext {
  text: string;
  url: string;
  title: string;
  pageText: string;
}

export type SwMessage =
  | {
      type: 'QUERY_STARTED';
      query: string;
      sourceUrl: string;
      sourceTitle: string;
      providers: ProviderId[];
      mode: QueryMode;
      selectedProvider?: ProviderId;
      selectedProviders?: ProviderId[];
      customPrompt?: string;
    }
  | { type: 'PROVIDER_RESULT'; provider: ProviderId; text: string; cost: string }
  | { type: 'PROVIDER_ERROR'; provider: ProviderId; error: string }
  | { type: 'CONSENSUS_STARTED'; provider: ProviderId }
  | { type: 'CONSENSUS_RESULT'; text: string; confidence: string; provider: ProviderId }
  | { type: 'CONSENSUS_ERROR'; error: string }
  | { type: 'QUERY_ERROR'; error: string }
  | { type: 'QUERY_CANCELLED' }
  | { type: 'QUERY_FINISHED'; historyId?: string }
  | { type: 'PENDING_QUERY'; draft: PendingQuery };

export type PanelMessage =
  | { type: 'PANEL_READY' }
  | {
      type: 'START_QUERY';
      query: string;
      mode: QueryMode;
      provider?: ProviderId;
      providers?: ProviderId[];
      sourceUrl?: string;
      sourceTitle?: string;
      pageText?: string;
      customPrompt?: string;
    }
  | { type: 'CANCEL_QUERY' }
  | { type: 'RERUN_QUERY'; historyId: string };
