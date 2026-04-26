import { CONSENSUS_PROMPT_TEMPLATE, PROVIDER_MAP, QUERY_TIMEOUT_MS } from './constants.js';
import { promptProvider } from './rueter.js';
import type { ProviderId, Settings } from './types.js';

export interface ConsensusRunResult {
  text: string;
  confidence: string;
  provider: ProviderId;
}

export async function runConsensus(
  providerResponses: Partial<Record<ProviderId, string>>,
  originalQuery: string,
  provider: ProviderId,
  settings: Settings,
  opts: {
    isCancelled?: () => boolean;
  } = {},
): Promise<ConsensusRunResult> {
  const providerConfig = settings.providers[provider];
  if (!providerConfig?.apiKey.trim()) {
    throw new Error(`No API key configured for ${PROVIDER_MAP[provider].label} consensus.`);
  }

  const entries = Object.entries(providerResponses).filter(([, text]) => Boolean(text?.trim()));
  if (entries.length === 0) {
    throw new Error('No provider responses available for consensus.');
  }

  const responsesBlock = entries
    .map(([id, text], index) => {
      const providerLabel = PROVIDER_MAP[id as ProviderId]?.label ?? id;
      return `### Response ${index + 1} - ${providerLabel}\n\n${text}`;
    })
    .join('\n\n---\n\n');

  const prompt = CONSENSUS_PROMPT_TEMPLATE
    .replace('{{RESPONSES}}', responsesBlock)
    .replace('{{QUERY}}', originalQuery);

  const result = await promptProvider(prompt, {
    provider,
    apiKey: providerConfig.apiKey,
    modelIndex: providerConfig.modelIndex,
    systemPrompt: 'You are an expert answer arbitrator.',
    temperature: 0.2,
    maxTokens: Math.max(1024, settings.maxTokens),
  }, {
    timeoutMs: QUERY_TIMEOUT_MS,
    isCancelled: opts.isCancelled,
  });

  return {
    text: result.text,
    confidence: parseConfidence(result.text),
    provider,
  };
}

function parseConfidence(text: string): string {
  const match = text.match(/confidence(?:\s*&\s*sources)?[:\s-]+(high|medium|low)/i);
  return match
    ? `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}`
    : 'Medium';
}
