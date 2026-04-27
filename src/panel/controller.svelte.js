import { onMount } from 'svelte';
import { showToast } from '../lib/components/Toast.svelte';
import { PROVIDER_MAP, PROVIDER_IDS } from '../lib/constants.js';
import {
    clearHistory,
    deleteHistoryEntry,
    loadHistory,
    loadSettings,
    saveSettings,
    watchSettings,
} from '../lib/storage.js';
import { applyTheme, getConfiguredProviderIds } from '../lib/settings-helpers.js';
import { formatSourceLabel, queryModeLabel } from './helpers.js';
import {
    buildHistoryMarkdown,
    buildLoadingProviderResults,
    buildQueryTargets,
    seedComposerSelection,
    syncComposerSelection,
    toggleComposerProvider,
} from './state.js';

const THEMES = ['system', 'light', 'dark'];

export function createPanelController() {
    let port = null;

    let view = $state('ask');
    let settings = $state(null);
    let history = $state([]);
    let selectedHistoryId = $state(null);

    let isQuerying = $state(false);
    let showComposer = $state(true);
    let inputText = $state('');
    let composerMode = $state('orchestrated');
    let composerProvider = $state('anthropic');
    let composerSelectedProviders = $state([]);
    let pendingDraft = $state(null);

    let currentQuery = $state('');
    let currentSourceUrl = $state('');
    let currentSourceTitle = $state('');
    let currentMode = $state('orchestrated');
    let currentSelectedProvider = $state(undefined);
    let currentSelectedProviders = $state([]);
    let currentCustomPrompt = $state(undefined);

    let activeProviders = $state([]);
    let providerResults = $state({});
    let consensusResult = $state({ status: 'idle', text: '' });

    const activeHistoryEntry = $derived(
        selectedHistoryId
            ? history.find((entry) => entry.id === selectedHistoryId) ?? null
            : history[0] ?? null,
    );
    const configuredProviderIds = $derived(
        settings ? getConfiguredProviderIds(settings) : [],
    );
    const visibleComposerProviders = $derived(
        composerMode === 'single' ? configuredProviderIds : PROVIDER_IDS,
    );
    const canSubmit = $derived(
        Boolean(
            inputText.trim() && (
                composerMode === 'single'
                    ? composerProvider && configuredProviderIds.includes(composerProvider)
                    : composerSelectedProviders.length > 0
            ),
        ),
    );
    const currentModeLabel = $derived(
        queryModeLabel(
            currentMode,
            currentSelectedProviders.length > 0 ? currentSelectedProviders : activeProviders,
            currentSelectedProvider,
        ),
    );
    const currentSourceLabel = $derived(
        currentSourceUrl || currentSourceTitle
            ? formatSourceLabel(currentSourceUrl, currentSourceTitle)
            : '',
    );

    function applyComposerSelection(selection) {
        composerMode = selection.mode;
        composerProvider = selection.provider;
        composerSelectedProviders = selection.selectedProviders;
    }

    function connectPort() {
        port = chrome.runtime.connect({ name: 'asaki-panel' });
        port.onMessage.addListener(handleMessage);
        port.onDisconnect.addListener(() => {
            port = null;
            setTimeout(connectPort, 1200);
        });
        send({ type: 'PANEL_READY' });
    }

    function send(message) {
        try {
            port?.postMessage(message);
        } catch {
            port = null;
        }
    }

    function handleMessage(message) {
        switch (message.type) {
            case 'QUERY_STARTED':
                currentQuery = message.query;
                currentSourceUrl = message.sourceUrl;
                currentSourceTitle = message.sourceTitle;
                currentMode = message.mode;
                currentSelectedProvider = message.selectedProvider;
                currentSelectedProviders = message.selectedProviders ?? message.providers;
                currentCustomPrompt = message.customPrompt;
                activeProviders = message.providers;
                providerResults = buildLoadingProviderResults(message.providers);
                consensusResult = message.mode === 'orchestrated'
                    ? { status: 'loading', text: '' }
                    : { status: 'idle', text: '' };
                isQuerying = true;
                showComposer = false;
                pendingDraft = null;
                view = 'ask';
                return;

            case 'PROVIDER_RESULT':
                providerResults[message.provider] = {
                    status: 'done',
                    text: message.text,
                    cost: message.cost,
                };
                return;

            case 'PROVIDER_ERROR':
                providerResults[message.provider] = {
                    status: 'error',
                    text: '',
                    error: message.error,
                };
                showToast(`${PROVIDER_MAP[message.provider].label}: ${message.error}`, 'error');
                return;

            case 'CONSENSUS_STARTED':
                consensusResult = {
                    status: 'loading',
                    text: '',
                    provider: message.provider,
                };
                return;

            case 'CONSENSUS_RESULT':
                consensusResult = {
                    status: 'done',
                    text: message.text,
                    confidence: message.confidence,
                    provider: message.provider,
                };
                return;

            case 'CONSENSUS_ERROR':
                consensusResult = {
                    status: 'error',
                    text: '',
                    error: message.error,
                };
                showToast(`Consensus: ${message.error}`, 'warning');
                return;

            case 'QUERY_ERROR':
                isQuerying = false;
                showToast(message.error, 'error');
                return;

            case 'QUERY_CANCELLED':
                isQuerying = false;
                for (const provider of activeProviders) {
                    if (providerResults[provider]?.status === 'loading') {
                        providerResults[provider] = {
                            status: 'error',
                            text: '',
                            error: 'Cancelled.',
                        };
                    }
                }
                if (consensusResult.status === 'loading') {
                    consensusResult = { status: 'idle', text: '' };
                }
                showToast('Query cancelled.', 'info');
                return;

            case 'QUERY_FINISHED':
                isQuerying = false;
                void refreshHistory(message.historyId);
                return;

            case 'PENDING_QUERY':
                pendingDraft = message.draft;
                inputText = message.draft.query;
                currentSourceUrl = message.draft.sourceUrl;
                currentSourceTitle = message.draft.sourceTitle;
                applyComposerSelection(seedComposerSelection({
                    mode: message.draft.mode,
                    settings,
                    selectedProvider: message.draft.selectedProvider,
                    selectedProviders: message.draft.selectedProviders,
                }));
                showComposer = true;
                view = 'ask';
        }
    }

    function submitQuery() {
        const query = inputText.trim();
        if (!query || !canSubmit) {
            return;
        }

        send({
            type: 'START_QUERY',
            query,
            mode: composerMode,
            ...buildQueryTargets(composerMode, composerProvider, composerSelectedProviders),
            sourceUrl: pendingDraft?.sourceUrl,
            sourceTitle: pendingDraft?.sourceTitle,
            pageText: pendingDraft?.pageText,
            customPrompt: pendingDraft?.customPrompt,
        });

        inputText = '';
        pendingDraft = null;
    }

    function rerunCurrentQuery() {
        if (!currentQuery) {
            return;
        }

        send({
            type: 'START_QUERY',
            query: currentQuery,
            mode: currentMode,
            ...buildQueryTargets(currentMode, currentSelectedProvider, currentSelectedProviders),
            sourceUrl: currentSourceUrl,
            sourceTitle: currentSourceTitle,
            customPrompt: currentCustomPrompt,
        });
    }

    function editCurrentQuery() {
        inputText = currentQuery;
        pendingDraft = {
            query: currentQuery,
            sourceUrl: currentSourceUrl,
            sourceTitle: currentSourceTitle,
            mode: currentMode,
            selectedProvider: currentSelectedProvider,
            selectedProviders: currentSelectedProviders,
            customPrompt: currentCustomPrompt,
            isCustom: Boolean(currentCustomPrompt),
        };
        applyComposerSelection(seedComposerSelection({
            mode: currentMode,
            settings,
            selectedProvider: currentSelectedProvider,
            selectedProviders: currentSelectedProviders,
        }));
        showComposer = true;
    }

    function cycleTheme() {
        if (!settings) {
            return;
        }

        const nextTheme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
        void saveSettings({ theme: nextTheme }).then((nextSettings) => {
            settings = nextSettings;
            applyTheme(nextTheme);
        });
    }

    async function refreshHistory(preferredId) {
        history = await loadHistory();

        if (preferredId && history.some((entry) => entry.id === preferredId)) {
            selectedHistoryId = preferredId;
            return;
        }

        if (!selectedHistoryId || !history.some((entry) => entry.id === selectedHistoryId)) {
            selectedHistoryId = history[0]?.id ?? null;
        }
    }

    async function removeHistoryEntry(entry) {
        await deleteHistoryEntry(entry.id);
        history = history.filter((item) => item.id !== entry.id);
        if (selectedHistoryId === entry.id) {
            selectedHistoryId = history[0]?.id ?? null;
        }
    }

    async function clearSavedHistory() {
        if (!confirm('Clear all saved Asaki history?')) {
            return;
        }

        await clearHistory();
        history = [];
        selectedHistoryId = null;
        showToast('History cleared.', 'success');
    }

    function exportEntry(entry) {
        const url = URL.createObjectURL(
            new Blob([buildHistoryMarkdown(entry)], { type: 'text/markdown' }),
        );
        const anchor = Object.assign(document.createElement('a'), {
            href: url,
            download: `asaki-${entry.id}.md`,
        });

        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function syncSettings(nextSettings) {
        settings = nextSettings;
        applyTheme(nextSettings.theme);
        applyComposerSelection(syncComposerSelection({
            settings: nextSettings,
            mode: composerMode,
            provider: composerProvider,
            selectedProviders: composerSelectedProviders,
            pendingDraft,
            currentQuery,
            inputText,
        }));
    }

    onMount(() => {
        connectPort();

        let stopWatchingSettings = () => {};

        void loadSettings().then(async (nextSettings) => {
            settings = nextSettings;
            applyTheme(nextSettings.theme);
            applyComposerSelection(seedComposerSelection({
                mode: nextSettings.defaultMode,
                settings: nextSettings,
            }));
            await refreshHistory();
        });

        stopWatchingSettings = watchSettings(syncSettings);

        return () => {
            stopWatchingSettings();
            port?.disconnect();
        };
    });

    return {
        get theme() { return settings?.theme ?? 'system'; },
        get view() { return view; },
        get history() { return history; },
        get activeHistoryEntry() { return activeHistoryEntry; },
        get noConfiguredProviders() { return configuredProviderIds.length === 0; },
        get showComposer() { return showComposer || !currentQuery; },
        get showEmptyState() { return activeProviders.length === 0 && !currentQuery; },
        get hasResults() { return activeProviders.length > 0; },
        get inputText() { return inputText; },
        get composerMode() { return composerMode; },
        get composerProvider() { return composerProvider; },
        get composerSelectedProviders() { return composerSelectedProviders; },
        get pendingDraft() { return pendingDraft; },
        get currentSourceUrl() { return currentSourceUrl; },
        get currentSourceTitle() { return currentSourceTitle; },
        get configuredProviderIds() { return configuredProviderIds; },
        get visibleComposerProviders() { return visibleComposerProviders; },
        get canSubmit() { return canSubmit; },
        get isQuerying() { return isQuerying; },
        get currentQuery() { return currentQuery; },
        get currentMode() { return currentMode; },
        get activeProviders() { return activeProviders; },
        get providerResults() { return providerResults; },
        get consensusResult() { return consensusResult; },
        get currentModeLabel() { return currentModeLabel; },
        get currentSourceLabel() { return currentSourceLabel; },
        updateInputText(value) { inputText = value; },
        selectView(nextView) {
            view = nextView;
            if (nextView === 'history') {
                void refreshHistory();
            }
        },
        selectHistoryEntry(id) { selectedHistoryId = id; },
        hideComposer() { showComposer = false; },
        switchComposerMode(mode) {
            applyComposerSelection(seedComposerSelection({ mode, settings }));
        },
        toggleComposerProvider(provider) {
            applyComposerSelection(toggleComposerProvider({
                mode: composerMode,
                provider,
                selectedProvider: composerProvider,
                selectedProviders: composerSelectedProviders,
            }));
        },
        submitQuery,
        cancelCurrentQuery() { send({ type: 'CANCEL_QUERY' }); },
        rerunCurrentQuery,
        editCurrentQuery,
        cycleTheme,
        openSettings() { chrome.runtime.openOptionsPage(); },
        clearHistory: clearSavedHistory,
        rerunHistory(entry) {
            view = 'ask';
            send({ type: 'RERUN_QUERY', historyId: entry.id });
        },
        exportEntry,
        removeHistoryEntry,
    };
}
