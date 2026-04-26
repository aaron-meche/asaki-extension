<script lang="ts">
  import { onMount } from 'svelte';
  import Toast, { showToast } from '../lib/components/Toast.svelte';
  import { PROVIDER_MAP, PROVIDER_IDS } from '../lib/constants.js';
  import {
    clearHistory,
    deleteHistoryEntry,
    loadHistory,
    loadSettings,
    saveSettings,
    watchSettings,
  } from '../lib/storage.js';
  import {
    applyTheme,
    getConfiguredProviderIds,
  } from '../lib/settings-helpers.js';
  import type {
    ConsensusResult,
    HistoryEntry,
    PanelMessage,
    PendingQuery,
    ProviderId,
    ProviderResult,
    QueryMode,
    Settings,
    SwMessage,
  } from '../lib/types.js';
  import { formatSourceLabel, queryModeLabel } from './helpers.js';
  import {
    buildHistoryMarkdown,
    buildLoadingProviderResults,
    buildQueryTargets,
    seedComposerSelection,
    syncComposerSelection,
    toggleComposerProvider,
    type ComposerSelection,
  } from './state.js';
  import ApiKeyBanner from './components/ApiKeyBanner.svelte';
  import AskEmptyState from './components/AskEmptyState.svelte';
  import HistoryView from './components/HistoryView.svelte';
  import PanelHeader from './components/PanelHeader.svelte';
  import PanelNav from './components/PanelNav.svelte';
  import QueryComposer from './components/QueryComposer.svelte';
  import QuerySummary from './components/QuerySummary.svelte';
  import ResultsSection from './components/ResultsSection.svelte';

  type View = 'ask' | 'history';

  let view = $state<View>('ask');
  let settings = $state<Settings | null>(null);
  let history = $state<HistoryEntry[]>([]);
  let selectedHistoryId = $state<string | null>(null);

  let isQuerying = $state(false);
  let showComposer = $state(true);
  let inputText = $state('');
  let composerMode = $state<QueryMode>('orchestrated');
  let composerProvider = $state<ProviderId>('anthropic');
  let composerSelectedProviders = $state<ProviderId[]>([]);
  let pendingDraft = $state<PendingQuery | null>(null);

  let currentQuery = $state('');
  let currentSourceUrl = $state('');
  let currentSourceTitle = $state('');
  let currentMode = $state<QueryMode>('orchestrated');
  let currentSelectedProvider = $state<ProviderId | undefined>(undefined);
  let currentSelectedProviders = $state<ProviderId[]>([]);
  let currentCustomPrompt = $state<string | undefined>(undefined);

  let activeProviders = $state<ProviderId[]>([]);
  let providerResults = $state<Record<string, ProviderResult>>({});
  let consensusResult = $state<ConsensusResult>({ status: 'idle', text: '' });

  let port: chrome.runtime.Port | null = null;

  const activeHistoryEntry = $derived(
    selectedHistoryId
      ? (history.find((entry) => entry.id === selectedHistoryId) ?? null)
      : (history[0] ?? null),
  );

  const configuredProviderIds = $derived(settings ? getConfiguredProviderIds(settings) : []);
  const noConfiguredProviders = $derived(configuredProviderIds.length === 0);
  const visibleComposerProviders = $derived(
    composerMode === 'single' ? configuredProviderIds : PROVIDER_IDS,
  );
  const canSubmit = $derived(
    Boolean(
      inputText.trim() &&
      (composerMode === 'single'
        ? composerProvider && configuredProviderIds.includes(composerProvider)
        : composerSelectedProviders.length > 0),
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

  function applyComposerSelection(selection: ComposerSelection) {
    composerMode = selection.mode;
    composerProvider = selection.provider;
    composerSelectedProviders = selection.selectedProviders;
  }

  function connectPort() {
    port = chrome.runtime.connect({ name: 'asaki-panel' });
    port.onMessage.addListener(handleSwMessage);
    port.onDisconnect.addListener(() => {
      port = null;
      setTimeout(connectPort, 1200);
    });
    send({ type: 'PANEL_READY' });
  }

  function send(message: PanelMessage) {
    try {
      port?.postMessage(message);
    } catch {
      port = null;
    }
  }

  function handleSwMessage(message: SwMessage) {
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
        applyComposerSelection(
          seedComposerSelection({
            mode: message.draft.mode,
            settings,
            selectedProvider: message.draft.selectedProvider,
            selectedProviders: message.draft.selectedProviders,
          }),
        );
        showComposer = true;
        view = 'ask';
        return;
    }
  }

  function submitQuery() {
    const query = inputText.trim();
    if (!query || !canSubmit) {
      return;
    }

    currentCustomPrompt = pendingDraft?.customPrompt;
    const queryTargets = buildQueryTargets(
      composerMode,
      composerProvider,
      composerSelectedProviders,
    );

    send({
      type: 'START_QUERY',
      query,
      mode: composerMode,
      ...queryTargets,
      sourceUrl: pendingDraft?.sourceUrl,
      sourceTitle: pendingDraft?.sourceTitle,
      pageText: pendingDraft?.pageText,
      customPrompt: pendingDraft?.customPrompt,
    });

    inputText = '';
    pendingDraft = null;
  }

  function cancelCurrentQuery() {
    send({ type: 'CANCEL_QUERY' });
  }

  function rerunCurrentQuery() {
    if (!currentQuery) {
      return;
    }

    const queryTargets = buildQueryTargets(
      currentMode,
      currentSelectedProvider,
      currentSelectedProviders,
    );

    send({
      type: 'START_QUERY',
      query: currentQuery,
      mode: currentMode,
      ...queryTargets,
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
    applyComposerSelection(
      seedComposerSelection({
        mode: currentMode,
        settings,
        selectedProvider: currentSelectedProvider,
        selectedProviders: currentSelectedProviders,
      }),
    );
    showComposer = true;
  }

  function updateInputText(value: string) {
    inputText = value;
  }

  function handleToggleComposerProvider(provider: ProviderId) {
    applyComposerSelection(
      toggleComposerProvider({
        mode: composerMode,
        provider,
        selectedProvider: composerProvider,
        selectedProviders: composerSelectedProviders,
      }),
    );
  }

  function switchComposerMode(mode: QueryMode) {
    applyComposerSelection(
      seedComposerSelection({
        mode,
        settings,
      }),
    );
  }

  async function cycleTheme() {
    if (!settings) {
      return;
    }

    const order: Settings['theme'][] = ['system', 'light', 'dark'];
    const nextTheme = order[(order.indexOf(settings.theme) + 1) % order.length];
    settings = await saveSettings({ theme: nextTheme });
    applyTheme(nextTheme);
  }

  async function refreshHistory(preferredId?: string) {
    history = await loadHistory();

    if (preferredId && history.some((entry) => entry.id === preferredId)) {
      selectedHistoryId = preferredId;
      return;
    }

    if (!selectedHistoryId || !history.some((entry) => entry.id === selectedHistoryId)) {
      selectedHistoryId = history[0]?.id ?? null;
    }
  }

  async function removeHistoryEntry(entry: HistoryEntry) {
    await deleteHistoryEntry(entry.id);
    history = history.filter((item) => item.id !== entry.id);

    if (selectedHistoryId === entry.id) {
      selectedHistoryId = history[0]?.id ?? null;
    }
  }

  async function handleClearHistory() {
    if (!confirm('Clear all saved Asaki history?')) {
      return;
    }

    await clearHistory();
    history = [];
    selectedHistoryId = null;
    showToast('History cleared.', 'success');
  }

  function rerunHistory(entry: HistoryEntry) {
    view = 'ask';
    send({ type: 'RERUN_QUERY', historyId: entry.id });
  }

  function exportEntry(entry: HistoryEntry) {
    const markdown = buildHistoryMarkdown(entry);

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement('a'), {
      href: url,
      download: `asaki-${entry.id}.md`,
    });

    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function selectView(nextView: View) {
    view = nextView;
    if (nextView === 'history') {
      await refreshHistory();
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  onMount(() => {
    connectPort();

    let stopWatchingSettings = () => {};

    void (async () => {
      const nextSettings = await loadSettings();
      settings = nextSettings;
      applyTheme(nextSettings.theme);
      applyComposerSelection(
        seedComposerSelection({
          mode: nextSettings.defaultMode,
          settings: nextSettings,
        }),
      );
      await refreshHistory();
    })();

    stopWatchingSettings = watchSettings((nextSettings) => {
      settings = nextSettings;
      applyTheme(nextSettings.theme);
      applyComposerSelection(
        syncComposerSelection({
          settings: nextSettings,
          mode: composerMode,
          provider: composerProvider,
          selectedProviders: composerSelectedProviders,
          pendingDraft,
          currentQuery,
          inputText,
        }),
      );
    });

    return () => {
      stopWatchingSettings();
      port?.disconnect();
    };
  });
</script>

<div class="panel">
  <PanelHeader
    theme={settings?.theme ?? 'system'}
    onCycleTheme={cycleTheme}
    onOpenSettings={openSettings}
  />

  <PanelNav view={view} onSelect={selectView} />

  {#if view === 'ask'}
    <section class="ask-view">
      {#if noConfiguredProviders}
        <ApiKeyBanner onOpenSettings={openSettings} />
      {/if}

      {#if showComposer || !currentQuery}
        <QueryComposer
          inputText={inputText}
          composerMode={composerMode}
          composerProvider={composerProvider}
          composerSelectedProviders={composerSelectedProviders}
          pendingDraft={pendingDraft}
          currentSourceUrl={currentSourceUrl}
          currentSourceTitle={currentSourceTitle}
          configuredProviderIds={configuredProviderIds}
          visibleComposerProviders={visibleComposerProviders}
          canSubmit={canSubmit}
          isQuerying={isQuerying}
          currentQuery={currentQuery}
          onInputChange={updateInputText}
          onSwitchMode={switchComposerMode}
          onToggleProvider={handleToggleComposerProvider}
          onSubmit={submitQuery}
          onHide={() => {
            showComposer = false;
          }}
        />
      {:else}
        <QuerySummary
          modeLabel={currentModeLabel}
          sourceLabel={currentSourceLabel}
          query={currentQuery}
          onEdit={editCurrentQuery}
        />
      {/if}

      {#if activeProviders.length === 0 && !currentQuery}
        <AskEmptyState />
      {/if}

      {#if activeProviders.length > 0}
        <ResultsSection
          currentMode={currentMode}
          activeProviders={activeProviders}
          consensusResult={consensusResult}
          providerResults={providerResults}
          isQuerying={isQuerying}
          onCancel={cancelCurrentQuery}
          onRerun={rerunCurrentQuery}
          onEdit={editCurrentQuery}
        />
      {/if}
    </section>
  {/if}

  {#if view === 'history'}
    <HistoryView
      history={history}
      activeHistoryEntry={activeHistoryEntry}
      onClearHistory={handleClearHistory}
      onSelectEntry={(id) => {
        selectedHistoryId = id;
      }}
      onRerunHistory={rerunHistory}
      onExportEntry={exportEntry}
      onDeleteEntry={removeHistoryEntry}
    />
  {/if}

  <Toast />
</div>
