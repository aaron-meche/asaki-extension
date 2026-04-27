import { DEFAULT_SETTINGS, MAX_HISTORY } from './constants.js';
import { normalizeProviderIdList } from './settings-helpers.js';

function syncGet(key) {
    return new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, result => {
            chrome.runtime.lastError
                ? reject(new Error(chrome.runtime.lastError.message))
                : resolve(result[key]);
        }),
    );
}

function syncSet(key, value) {
    return new Promise((resolve, reject) =>
        chrome.storage.sync.set({ [key]: value }, () => {
            chrome.runtime.lastError
                ? reject(new Error(chrome.runtime.lastError.message))
                : resolve();
        }),
    );
}

function localGet(key) {
    return new Promise((resolve, reject) =>
        chrome.storage.local.get(key, result => {
            chrome.runtime.lastError
                ? reject(new Error(chrome.runtime.lastError.message))
                : resolve(result[key]);
        }),
    );
}

function localSet(key, value) {
    return new Promise((resolve, reject) =>
        chrome.storage.local.set({ [key]: value }, () => {
            chrome.runtime.lastError
                ? reject(new Error(chrome.runtime.lastError.message))
                : resolve();
        }),
    );
}

export async function loadSettings() {
    const stored = await syncGet('settings');
    return normalizeSettings(deepMerge(DEFAULT_SETTINGS, stored ?? {}));
}

export async function saveSettings(partial) {
    const current = await loadSettings();
    const next = normalizeSettings(deepMerge(current, partial));
    await syncSet('settings', next);
    return next;
}

export function watchSettings(onChange) {
    const handler = (changes, areaName) => {
        if (areaName !== 'sync' || !changes.settings) {
            return;
        }

        const nextSettings = normalizeSettings(
            deepMerge(DEFAULT_SETTINGS, changes.settings.newValue ?? {}),
        );
        onChange(nextSettings);
    };

    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
}

export async function loadHistory() {
    const history = (await localGet('history')) ?? [];
    return history.map(normalizeHistoryEntry);
}

export async function appendHistory(entry) {
    const history = await loadHistory();
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    await localSet('history', next);
}

export async function updateHistory(id, patch) {
    const history = await loadHistory();
    const idx = history.findIndex(e => e.id === id);
    if (idx === -1) return;
    history[idx] = { ...history[idx], ...patch };
    await localSet('history', history);
}

export async function deleteHistoryEntry(id) {
    const history = await loadHistory();
    await localSet('history', history.filter(e => e.id !== id));
}

export async function clearHistory() {
    await localSet('history', []);
}

function deepMerge(base, override) {
    const result = { ...base };
    for (const [k, v] of Object.entries(override)) {
        result[k] =
            v !== null && typeof v === 'object' && !Array.isArray(v)
                ? deepMerge(
                        base[k] ?? {},
                        v,
                    )
                : v;
    }
    return result;
}

export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeSettings(settings) {
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        defaultMode: settings.defaultMode ?? DEFAULT_SETTINGS.defaultMode,
        defaultSingleProvider: settings.defaultSingleProvider ?? DEFAULT_SETTINGS.defaultSingleProvider,
        defaultOrchestratedProviders: normalizeProviderList(
            settings.defaultOrchestratedProviders,
            DEFAULT_SETTINGS.defaultOrchestratedProviders,
        ),
        providers: Object.fromEntries(
            Object.entries(DEFAULT_SETTINGS.providers).map(([provider, fallback]) => [
                provider,
                normalizeProviderSettings(settings.providers?.[provider], fallback),
            ]),
        ),
        maxTokens: Number(settings.maxTokens ?? DEFAULT_SETTINGS.maxTokens),
        temperature: Number(settings.temperature ?? DEFAULT_SETTINGS.temperature),
    };
}

function normalizeProviderSettings(
    settings,
    fallback,
) {
    return {
        enabled: settings?.enabled ?? fallback.enabled,
        apiKey: settings?.apiKey ?? fallback.apiKey,
        modelIndex: Number(settings?.modelIndex ?? fallback.modelIndex),
    };
}

function normalizeHistoryEntry(entry) {
    return {
        id: entry.id,
        timestamp: entry.timestamp,
        query: entry.query,
        sourceUrl: entry.sourceUrl ?? '',
        sourceTitle: entry.sourceTitle ?? '',
        mode: entry.mode ?? 'orchestrated',
        selectedProvider: entry.selectedProvider,
        selectedProviders: normalizeProviderList(entry.selectedProviders, undefined),
        customPrompt: entry.customPrompt,
        responses: entry.responses ?? {},
        consensus: entry.consensus ?? '',
    };
}

function normalizeProviderList(providers, fallback) {
    return normalizeProviderIdList(providers ?? fallback ?? []);
}
