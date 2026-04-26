import { PROVIDER_MAP } from '../lib/constants.js';
import {
  getConfiguredProviderIds,
  getDefaultOrchestratedProviders,
} from '../lib/settings-helpers.js';
import type {
  HistoryEntry,
  PendingQuery,
  ProviderId,
  ProviderResult,
  QueryMode,
  Settings,
} from '../lib/types.js';

const FALLBACK_PROVIDER: ProviderId = 'anthropic';

export interface ComposerSelection {
  mode: QueryMode;
  provider: ProviderId;
  selectedProviders: ProviderId[];
}

export function buildLoadingProviderResults(
  providers: ProviderId[],
): Record<string, ProviderResult> {
  return Object.fromEntries(
    providers.map((provider) => [provider, { status: 'loading' as const, text: '' }]),
  );
}

export function buildQueryTargets(
  mode: QueryMode,
  selectedProvider: ProviderId | undefined,
  selectedProviders: ProviderId[],
): {
  provider?: ProviderId;
  providers?: ProviderId[];
} {
  if (mode === 'single') {
    return {
      provider: selectedProvider,
      providers: selectedProvider ? [selectedProvider] : undefined,
    };
  }

  return {
    provider: undefined,
    providers: selectedProviders,
  };
}

export function seedComposerSelection({
  mode,
  settings,
  selectedProvider,
  selectedProviders,
}: {
  mode: QueryMode;
  settings: Settings | null;
  selectedProvider?: ProviderId;
  selectedProviders?: ProviderId[];
}): ComposerSelection {
  if (!settings) {
    return {
      mode,
      provider: selectedProvider ?? FALLBACK_PROVIDER,
      selectedProviders: selectedProvider ? [selectedProvider] : [],
    };
  }

  const availableProviders = getConfiguredProviderIds(settings);
  const provider = resolveSingleProvider(settings, availableProviders, selectedProvider);

  if (mode === 'single') {
    return {
      mode,
      provider,
      selectedProviders: provider ? [provider] : [],
    };
  }

  const preferredProviders = (
    selectedProviders ?? settings.defaultOrchestratedProviders
  ).filter((nextProvider) => availableProviders.includes(nextProvider));

  return {
    mode,
    provider,
    selectedProviders: preferredProviders.length > 0 ? preferredProviders : availableProviders,
  };
}

export function syncComposerSelection({
  settings,
  mode,
  provider,
  selectedProviders,
  pendingDraft,
  currentQuery,
  inputText,
}: {
  settings: Settings;
  mode: QueryMode;
  provider: ProviderId;
  selectedProviders: ProviderId[];
  pendingDraft: PendingQuery | null;
  currentQuery: string;
  inputText: string;
}): ComposerSelection {
  const availableProviders = getConfiguredProviderIds(settings);

  if (!pendingDraft && !currentQuery && !inputText.trim()) {
    return seedComposerSelection({
      mode: settings.defaultMode,
      settings,
    });
  }

  const resolvedProvider = resolveSingleProvider(settings, availableProviders, provider);

  if (mode === 'single') {
    return {
      mode,
      provider: resolvedProvider,
      selectedProviders: resolvedProvider ? [resolvedProvider] : [],
    };
  }

  const preferredProviders = selectedProviders.filter((nextProvider) =>
    availableProviders.includes(nextProvider),
  );

  return {
    mode,
    provider: resolvedProvider,
    selectedProviders:
      preferredProviders.length > 0
        ? preferredProviders
        : getDefaultOrchestratedProviders(settings),
  };
}

export function toggleComposerProvider({
  mode,
  provider,
  selectedProvider,
  selectedProviders,
}: {
  mode: QueryMode;
  provider: ProviderId;
  selectedProvider: ProviderId;
  selectedProviders: ProviderId[];
}): ComposerSelection {
  if (mode === 'single') {
    return {
      mode,
      provider,
      selectedProviders: [provider],
    };
  }

  return {
    mode,
    provider: selectedProvider,
    selectedProviders: selectedProviders.includes(provider)
      ? selectedProviders.filter((nextProvider) => nextProvider !== provider)
      : [...selectedProviders, provider],
  };
}

export function buildHistoryMarkdown(entry: HistoryEntry): string {
  const providerSections = Object.entries(entry.responses).map(
    ([provider, response]) =>
      `## ${PROVIDER_MAP[provider as ProviderId].label}\n\n${response ?? ''}\n`,
  );

  return [
    '# Asaki Export',
    '',
    `- Query: ${entry.query}`,
    `- Mode: ${entry.mode === 'orchestrated'
      ? `Orchestrated (${(entry.selectedProviders ?? []).length || Object.keys(entry.responses).length} providers)`
      : `Single (${PROVIDER_MAP[entry.selectedProvider ?? FALLBACK_PROVIDER].label})`}`,
    `- Date: ${new Date(entry.timestamp).toLocaleString()}`,
    `- Source: ${entry.sourceUrl || 'N/A'}`,
    '',
    '## Best Answer',
    '',
    entry.consensus || '_Consensus unavailable_',
    '',
    ...providerSections,
  ].join('\n');
}

function resolveSingleProvider(
  settings: Settings,
  availableProviders: ProviderId[],
  preferredProvider?: ProviderId,
): ProviderId {
  const candidate = preferredProvider ?? settings.defaultSingleProvider;
  return availableProviders.includes(candidate)
    ? candidate
    : (availableProviders[0] ?? settings.defaultSingleProvider ?? FALLBACK_PROVIDER);
}
