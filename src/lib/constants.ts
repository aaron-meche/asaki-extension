// Provider metadata derived from rueter-ai's models catalog.
// This file is the single place to update if models or costs change.

import type { ProviderId, ProviderMeta, Settings } from './types.js';

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    color: '#d97706',
    models: [
      { index: 0, name: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5',  inputCost: 1.00, outputCost: 5.00  },
      { index: 1, name: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', inputCost: 3.00, outputCost: 15.00 },
      { index: 2, name: 'claude-sonnet-4-6',          label: 'Claude Sonnet 4.6', inputCost: 3.00, outputCost: 15.00 },
      { index: 3, name: 'claude-opus-4-6',            label: 'Claude Opus 4.6',   inputCost: 5.00, outputCost: 25.00 },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    color: '#10a37f',
    models: [
      { index: 0, name: 'gpt-5.4-nano', label: 'GPT-5.4 Nano', inputCost: 0.20, outputCost: 1.25 },
      { index: 1, name: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', inputCost: 0.75, outputCost: 4.50 },
      { index: 2, name: 'gpt-5.4',      label: 'GPT-5.4',      inputCost: 2.50, outputCost: 15.00 },
      { index: 3, name: 'o3',           label: 'o3',            inputCost: 2.00, outputCost: 8.00  },
    ],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    color: '#4285f4',
    models: [
      { index: 0, name: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', inputCost: 0.10, outputCost: 0.40  },
      { index: 1, name: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash',      inputCost: 0.30, outputCost: 2.50  },
      { index: 2, name: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro',        inputCost: 1.25, outputCost: 10.00 },
    ],
  },
  {
    id: 'grok',
    label: 'Grok (xAI)',
    color: '#1a1a1a',
    models: [
      { index: 0, name: 'grok-4-1-fast-non-reasoning', label: 'Grok 4.1 Fast',            inputCost: 0.20, outputCost: 0.50 },
      { index: 1, name: 'grok-4-1-fast-reasoning',     label: 'Grok 4.1 Fast Reasoning',  inputCost: 0.20, outputCost: 0.50 },
      { index: 2, name: 'grok-4-fast-reasoning',       label: 'Grok 4 Fast Reasoning',    inputCost: 2.00, outputCost: 6.00 },
      { index: 3, name: 'grok-4.20-reasoning',         label: 'Grok 4.20 Reasoning',      inputCost: 2.00, outputCost: 6.00 },
    ],
  },
];

export const PROVIDER_IDS = PROVIDERS.map(p => p.id) as ProviderId[];

export const PROVIDER_MAP: Record<ProviderId, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map(p => [p.id, p]),
) as Record<ProviderId, ProviderMeta>;

export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful, accurate assistant. The user has highlighted the following text from a webpage and wants your analysis. Be concise, precise, and cite your reasoning.';

export const CONSENSUS_PROMPT_TEMPLATE = `You are an expert answer arbitrator. You have been given multiple AI-generated responses to the same user query. Your job:

1. Identify the core factual claims and recommendations across all responses.
2. Note where responses agree (consensus) and where they diverge (conflicts).
3. For conflicts, reason about which response is most likely correct and why.
4. Produce a single, synthesized "Best Answer" that is:
   - Accurate (prefer claims supported by the majority)
   - Complete (include important points any single response might have missed)
   - Concise (no longer than the longest individual response)
5. At the end, add a "Confidence & Sources" section:
   - State your confidence level (High / Medium / Low).
   - List which providers agreed vs. disagreed on key points.

## Provider Responses

{{RESPONSES}}

## User's Original Query

{{QUERY}}`;

export const DEFAULT_SETTINGS: Settings = {
  providers: {
    anthropic: { enabled: true,  apiKey: '', modelIndex: 2 },
    openai:    { enabled: true,  apiKey: '', modelIndex: 2 },
    gemini:    { enabled: true,  apiKey: '', modelIndex: 1 },
    grok:      { enabled: true,  apiKey: '', modelIndex: 2 },
  },
  consensusProvider:  'anthropic',
  defaultMode:        'orchestrated',
  defaultSingleProvider: 'anthropic',
  defaultOrchestratedProviders: ['anthropic', 'openai', 'gemini', 'grok'],
  systemPrompt:       DEFAULT_SYSTEM_PROMPT,
  maxTokens:          1024,
  temperature:        0.3,
  theme:              'system',
  historyEnabled:     true,
  pageContextEnabled: false,
};

export const MAX_HISTORY = 50;
export const QUERY_TIMEOUT_MS = 60_000;
export const MAX_PAGE_CONTEXT_CHARS = 2000;
export const PAGE_CONTEXT_SOURCE_CHARS = 6000;
