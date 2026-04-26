import { RueterModel } from './vendor/rueter-model.js';
import { PROVIDER_MAP, QUERY_TIMEOUT_MS } from './constants.js';
import type { ModelMeta, ProviderId, Settings } from './types.js';

export class QueryCancelledError extends Error {
  constructor(message = 'Query cancelled.') {
    super(message);
    this.name = 'QueryCancelledError';
  }
}

export interface PromptProviderOptions {
  provider: ProviderId;
  apiKey: string;
  modelIndex: number;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface PromptProviderResult {
  provider: ProviderId;
  model: ModelMeta;
  text: string;
  cost: string;
}

export function getProviderModel(provider: ProviderId, modelIndex: number): ModelMeta {
  return PROVIDER_MAP[provider].models[modelIndex] ?? PROVIDER_MAP[provider].models[0];
}

export function getEnabledProviders(settings: Settings): ProviderId[] {
  return (Object.keys(settings.providers) as ProviderId[]).filter((provider) => {
    const config = settings.providers[provider];
    return config.enabled && Boolean(config.apiKey.trim());
  });
}

export async function promptProvider(
  prompt: string,
  config: PromptProviderOptions,
  opts: {
    timeoutMs?: number;
    isCancelled?: () => boolean;
  } = {},
): Promise<PromptProviderResult> {
  throwIfCancelled(opts.isCancelled);

  const model = getProviderModel(config.provider, config.modelIndex);
  const rueterModel = new RueterModel(config.provider, config.apiKey, model.index, {
    systemPrompt: config.systemPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });

  const result = await withTimeout(
    rueterModel.prompt(prompt),
    opts.timeoutMs ?? QUERY_TIMEOUT_MS,
    `${PROVIDER_MAP[config.provider].label} timed out`,
  );

  throwIfCancelled(opts.isCancelled);

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    provider: config.provider,
    model,
    text: result.res ?? '',
    cost: formatCost(result.cost?.total ?? ''),
  };
}

export function buildEffectivePrompt(query: string, customPrompt?: string, pageText?: string): string {
  const basePrompt = customPrompt?.includes('{{TEXT}}')
    ? customPrompt.replaceAll('{{TEXT}}', query)
    : customPrompt?.trim() || query;

  if (!pageText) {
    return basePrompt;
  }

  return `Page context:\n\n${pageText}\n\n---\n\nUser request:\n${basePrompt}`;
}

function throwIfCancelled(isCancelled?: () => boolean): void {
  if (isCancelled?.()) {
    throw new QueryCancelledError();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${message} after ${Math.ceil(ms / 1000)}s.`)), ms);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function formatCost(total: string): string {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return amount < 0.001 ? `$${amount.toFixed(6)}` : `$${amount.toFixed(4)}`;
}
