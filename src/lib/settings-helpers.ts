import { PROVIDER_IDS, PROVIDERS } from './constants.js';
import type { ProviderId, Settings } from './types.js';

export function applyTheme(theme: Settings['theme']): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}

export function getConfiguredProviderIds(settings: Settings): ProviderId[] {
  return PROVIDERS
    .filter(
      (provider) =>
        settings.providers[provider.id].enabled &&
        settings.providers[provider.id].apiKey.trim(),
    )
    .map((provider) => provider.id);
}

export function getDefaultOrchestratedProviders(settings: Settings): ProviderId[] {
  const availableProviders = getConfiguredProviderIds(settings);
  const preferredProviders = settings.defaultOrchestratedProviders.filter((provider) =>
    availableProviders.includes(provider),
  );

  return preferredProviders.length > 0 ? preferredProviders : availableProviders;
}

export function normalizeProviderIdList(providers: ProviderId[]): ProviderId[] {
  return Array.from(
    new Set(providers.filter((provider): provider is ProviderId => PROVIDER_IDS.includes(provider))),
  );
}
