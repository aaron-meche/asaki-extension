// Typed wrappers around chrome.storage.
// All keys are namespaced constants so typos are caught at compile time.

import type { HistoryEntry, ProviderId, QueryMode, Settings } from './types.js';
import { DEFAULT_SETTINGS, MAX_HISTORY } from './constants.js';

// ── Low-level helpers ─────────────────────────────────────────────────────────

function syncGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) =>
    chrome.storage.sync.get(key, result => {
      chrome.runtime.lastError
        ? reject(new Error(chrome.runtime.lastError.message))
        : resolve(result[key] as T | undefined);
    }),
  );
}

function syncSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) =>
    chrome.storage.sync.set({ [key]: value }, () => {
      chrome.runtime.lastError
        ? reject(new Error(chrome.runtime.lastError.message))
        : resolve();
    }),
  );
}

function localGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) =>
    chrome.storage.local.get(key, result => {
      chrome.runtime.lastError
        ? reject(new Error(chrome.runtime.lastError.message))
        : resolve(result[key] as T | undefined);
    }),
  );
}

function localSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) =>
    chrome.storage.local.set({ [key]: value }, () => {
      chrome.runtime.lastError
        ? reject(new Error(chrome.runtime.lastError.message))
        : resolve();
    }),
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function loadSettings(): Promise<Settings> {
  const stored = await syncGet<Partial<Settings>>('settings');
  return normalizeSettings(deepMerge(DEFAULT_SETTINGS, stored ?? {}) as Settings);
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = normalizeSettings(deepMerge(current, partial) as Settings);
  await syncSet('settings', next);
  return next;
}

export function watchSettings(onChange: (settings: Settings) => void): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'sync' || !changes.settings) {
      return;
    }

    const nextSettings = normalizeSettings(
      deepMerge(DEFAULT_SETTINGS, (changes.settings.newValue as Partial<Settings> | undefined) ?? {}) as Settings,
    );
    onChange(nextSettings);
  };

  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

// ── History ───────────────────────────────────────────────────────────────────

export async function loadHistory(): Promise<HistoryEntry[]> {
  const history = (await localGet<HistoryEntry[]>('history')) ?? [];
  return history.map(normalizeHistoryEntry);
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  await localSet('history', next);
}

export async function updateHistory(id: string, patch: Partial<HistoryEntry>): Promise<void> {
  const history = await loadHistory();
  const idx = history.findIndex(e => e.id === id);
  if (idx === -1) return;
  history[idx] = { ...history[idx], ...patch };
  await localSet('history', history);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const history = await loadHistory();
  await localSet('history', history.filter(e => e.id !== id));
}

export async function clearHistory(): Promise<void> {
  await localSet('history', []);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function deepMerge<T extends object>(base: T, override: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override)) {
    result[k] =
      v !== null && typeof v === 'object' && !Array.isArray(v)
        ? deepMerge(
            ((base as Record<string, unknown>)[k] as Record<string, unknown>) ?? {},
            v as Record<string, unknown>,
          )
        : v;
  }
  return result as T;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeSettings(settings: Settings): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    defaultMode: settings.defaultMode ?? DEFAULT_SETTINGS.defaultMode,
    defaultSingleProvider: settings.defaultSingleProvider ?? DEFAULT_SETTINGS.defaultSingleProvider,
    defaultOrchestratedProviders: normalizeProviderList(
      settings.defaultOrchestratedProviders,
      DEFAULT_SETTINGS.defaultOrchestratedProviders,
    ),
    providers: {
      anthropic: normalizeProviderSettings(settings.providers?.anthropic, DEFAULT_SETTINGS.providers.anthropic),
      openai: normalizeProviderSettings(settings.providers?.openai, DEFAULT_SETTINGS.providers.openai),
      gemini: normalizeProviderSettings(settings.providers?.gemini, DEFAULT_SETTINGS.providers.gemini),
      grok: normalizeProviderSettings(settings.providers?.grok, DEFAULT_SETTINGS.providers.grok),
    },
    maxTokens: Number(settings.maxTokens ?? DEFAULT_SETTINGS.maxTokens),
    temperature: Number(settings.temperature ?? DEFAULT_SETTINGS.temperature),
  };
}

function normalizeProviderSettings(
  settings: Settings['providers'][ProviderId] | undefined,
  fallback: Settings['providers'][ProviderId],
): Settings['providers'][ProviderId] {
  return {
    enabled: settings?.enabled ?? fallback.enabled,
    apiKey: settings?.apiKey ?? fallback.apiKey,
    modelIndex: Number(settings?.modelIndex ?? fallback.modelIndex),
  };
}

function normalizeHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    query: entry.query,
    sourceUrl: entry.sourceUrl ?? '',
    sourceTitle: entry.sourceTitle ?? '',
    mode: (entry.mode ?? 'orchestrated') as QueryMode,
    selectedProvider: entry.selectedProvider,
    selectedProviders: normalizeProviderList(entry.selectedProviders, undefined),
    customPrompt: entry.customPrompt,
    responses: entry.responses ?? {},
    consensus: entry.consensus ?? '',
  };
}

function normalizeProviderList(
  providers: ProviderId[] | undefined,
  fallback: ProviderId[] | undefined,
): ProviderId[] {
  const validProviders: ProviderId[] = ['anthropic', 'openai', 'gemini', 'grok'];
  const normalized = (providers ?? fallback ?? []).filter(
    (provider): provider is ProviderId => validProviders.includes(provider),
  );

  return Array.from(new Set(normalized));
}
