import { PROVIDER_MAP } from '../lib/constants.js';

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSourceLabel(url, title) {
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

export function historyModeLabel(entry) {
  return entry.mode === 'orchestrated'
    ? `${(entry.selectedProviders ?? []).length || Object.keys(entry.responses).length || 0} models`
    : PROVIDER_MAP[entry.selectedProvider ?? 'anthropic'].label;
}

export function queryModeLabel(
  mode,
  selectedProviders,
  selectedProvider,
) {
  return mode === 'orchestrated'
    ? `${selectedProviders.length} models`
    : PROVIDER_MAP[selectedProvider ?? 'anthropic'].label;
}
