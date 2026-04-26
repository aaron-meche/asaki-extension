import { RueterModel } from './vendor/rueter-model.js';
import { PROVIDER_MAP, QUERY_TIMEOUT_MS } from './constants.js';

export class QueryCancelledError extends Error {
  constructor(message = 'Query cancelled.') {
    super(message);
    this.name = 'QueryCancelledError';
  }
}

export function getProviderModel(provider, modelIndex) {
  return PROVIDER_MAP[provider].models[modelIndex] ?? PROVIDER_MAP[provider].models[0];
}

export function getEnabledProviders(settings) {
  return Object.keys(settings.providers).filter((provider) => {
    const config = settings.providers[provider];
    return config.enabled && Boolean(config.apiKey.trim());
  });
}

export async function promptProvider(
  prompt,
  config,
  opts = {},
) {
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

export function buildEffectivePrompt(query, customPrompt, pageText) {
  const basePrompt = customPrompt?.includes('{{TEXT}}')
    ? customPrompt.replaceAll('{{TEXT}}', query)
    : customPrompt?.trim() || query;

  if (!pageText) {
    return basePrompt;
  }

  return `Page context:\n\n${pageText}\n\n---\n\nUser request:\n${basePrompt}`;
}

function throwIfCancelled(isCancelled) {
  if (isCancelled?.()) {
    throw new QueryCancelledError();
  }
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${message} after ${Math.ceil(ms / 1000)}s.`)), ms);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function formatCost(total) {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return amount < 0.001 ? `$${amount.toFixed(6)}` : `$${amount.toFixed(4)}`;
}
