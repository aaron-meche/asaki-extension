import { PROVIDER_IDS, PROVIDERS } from './constants.js';

export function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}

export function getConfiguredProviderIds(settings) {
  return PROVIDERS
    .filter(
      (provider) =>
        settings.providers[provider.id].enabled &&
        settings.providers[provider.id].apiKey.trim(),
    )
    .map((provider) => provider.id);
}

export function getDefaultOrchestratedProviders(settings) {
  const availableProviders = getConfiguredProviderIds(settings);
  const preferredProviders = settings.defaultOrchestratedProviders.filter((provider) =>
    availableProviders.includes(provider),
  );

  return preferredProviders.length > 0 ? preferredProviders : availableProviders;
}

export function normalizeProviderIdList(providers) {
  return Array.from(
    new Set(providers.filter((provider) => PROVIDER_IDS.includes(provider))),
  );
}
