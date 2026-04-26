import { PROVIDER_MAP } from '../lib/constants.js';
import type { HistoryEntry, ProviderId } from '../lib/types.js';

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSourceLabel(url: string, title: string): string {
  if (title) {
    return title;
  }

  if (!url) {
    return 'Prompt from panel';
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function historyModeLabel(entry: HistoryEntry): string {
  return entry.mode === 'orchestrated'
    ? `${(entry.selectedProviders ?? []).length || Object.keys(entry.responses).length || 0} models`
    : PROVIDER_MAP[entry.selectedProvider ?? 'anthropic'].label;
}

export function queryModeLabel(
  mode: 'orchestrated' | 'single',
  selectedProviders: ProviderId[],
  selectedProvider?: ProviderId,
): string {
  return mode === 'orchestrated'
    ? `${selectedProviders.length} models`
    : PROVIDER_MAP[selectedProvider ?? 'anthropic'].label;
}
