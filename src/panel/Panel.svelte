<script>
  import Toast from '../lib/components/Toast.svelte';
  import {
    ApiKeyBanner,
    AskEmptyState,
    HistoryView,
    PanelHeader,
    PanelNav,
    QueryComposer,
    QuerySummary,
    ResultsSection,
  } from './components/index.js';

  const { panel } = $props();
</script>

<div class="panel">
  <PanelHeader
    theme={panel.theme}
    onCycleTheme={panel.cycleTheme}
    onOpenSettings={panel.openSettings}
  />

  <PanelNav view={panel.view} onSelect={panel.selectView} />

  {#if panel.view === 'ask'}
    <section class="ask-view">
      {#if panel.noConfiguredProviders}
        <ApiKeyBanner onOpenSettings={panel.openSettings} />
      {/if}

      {#if panel.showComposer}
        <QueryComposer
          inputText={panel.inputText}
          composerMode={panel.composerMode}
          composerProvider={panel.composerProvider}
          composerSelectedProviders={panel.composerSelectedProviders}
          pendingDraft={panel.pendingDraft}
          currentSourceUrl={panel.currentSourceUrl}
          currentSourceTitle={panel.currentSourceTitle}
          configuredProviderIds={panel.configuredProviderIds}
          visibleComposerProviders={panel.visibleComposerProviders}
          canSubmit={panel.canSubmit}
          isQuerying={panel.isQuerying}
          currentQuery={panel.currentQuery}
          onInputChange={panel.updateInputText}
          onSwitchMode={panel.switchComposerMode}
          onToggleProvider={panel.toggleComposerProvider}
          onSubmit={panel.submitQuery}
          onHide={panel.hideComposer}
        />
      {:else}
        <QuerySummary
          modeLabel={panel.currentModeLabel}
          sourceLabel={panel.currentSourceLabel}
          query={panel.currentQuery}
          onEdit={panel.editCurrentQuery}
        />
      {/if}

      {#if panel.showEmptyState}
        <AskEmptyState />
      {/if}

      {#if panel.hasResults}
        <ResultsSection
          currentMode={panel.currentMode}
          activeProviders={panel.activeProviders}
          consensusResult={panel.consensusResult}
          providerResults={panel.providerResults}
          isQuerying={panel.isQuerying}
          onCancel={panel.cancelCurrentQuery}
          onRerun={panel.rerunCurrentQuery}
          onEdit={panel.editCurrentQuery}
        />
      {/if}
    </section>
  {/if}

  {#if panel.view === 'history'}
    <HistoryView
      history={panel.history}
      activeHistoryEntry={panel.activeHistoryEntry}
      onClearHistory={panel.clearHistory}
      onSelectEntry={panel.selectHistoryEntry}
      onRerunHistory={panel.rerunHistory}
      onExportEntry={panel.exportEntry}
      onDeleteEntry={panel.removeHistoryEntry}
    />
  {/if}

  <Toast />
</div>
