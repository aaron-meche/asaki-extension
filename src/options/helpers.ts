import { PROVIDER_IDS, PROVIDERS } from '../lib/constants.js';
import {
  getConfiguredProviderIds,
  normalizeProviderIdList,
} from '../lib/settings-helpers.js';
import type { ProviderId, Settings } from '../lib/types.js';

export function calculateEstimatedCost(settings: Settings | null): string {
  if (!settings) {
    return '$0.00';
  }

  let total = 0;
  for (const provider of PROVIDERS) {
    const providerSettings = settings.providers[provider.id];
    if (!providerSettings.enabled || !providerSettings.apiKey.trim()) {
      continue;
    }

    const model = provider.models[providerSettings.modelIndex] ?? provider.models[0];
    total += (500 * model.inputCost + settings.maxTokens * model.outputCost) / 1_000_000;
  }

  return total === 0 ? '$0.00' : `~$${total.toFixed(5)}`;
}

export function normalizeSettings(current: Settings): Settings {
  const availableProviders = getConfiguredProviderIds(current);
  const defaultSingleProvider = availableProviders.includes(current.defaultSingleProvider)
    ? current.defaultSingleProvider
    : (availableProviders[0] ?? current.defaultSingleProvider);

  const defaultOrchestratedProviders = normalizeProviderIdList(
    current.defaultOrchestratedProviders.filter((provider) => availableProviders.includes(provider)),
  );

  const consensusProvider = availableProviders.includes(current.consensusProvider)
    ? current.consensusProvider
    : (availableProviders[0] ?? current.consensusProvider);

  return {
    ...current,
    maxTokens: Number(current.maxTokens),
    temperature: Number(current.temperature),
    defaultSingleProvider,
    defaultOrchestratedProviders,
    consensusProvider,
    providers: Object.fromEntries(
      Object.entries(current.providers).map(([provider, providerSettings]) => [
        provider,
        {
          ...providerSettings,
          modelIndex: Number(providerSettings.modelIndex),
          apiKey: providerSettings.apiKey.trim(),
        },
      ]),
    ) as Settings['providers'],
  };
}

export function toggleSelectedProvider(list: ProviderId[], provider: ProviderId): ProviderId[] {
  return list.includes(provider)
    ? list.filter((selectedProvider) => selectedProvider !== provider)
    : [...list, provider].filter(
        (selectedProvider): selectedProvider is ProviderId => PROVIDER_IDS.includes(selectedProvider),
      );
}
