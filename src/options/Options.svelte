<script>
  import {
    ConsensusPromptingSection,
    ExecutionDefaultsSection,
    HistoryAppearanceSection,
    OptionsHero,
    ProvidersSection,
    ResponseShapingSection,
  } from './components/index.js';

  const { options } = $props();
</script>

<div class="options">
  <OptionsHero
    estimatedCost={options.estimatedCost}
    saving={options.saving}
    saved={options.saved}
    onSave={options.save}
  />

  {#if options.settings}
    <main class="sections">
      <ExecutionDefaultsSection
        defaultMode={options.settings.defaultMode}
        defaultSingleProvider={options.settings.defaultSingleProvider}
        defaultOrchestratedProviders={options.settings.defaultOrchestratedProviders}
        availableProviderIds={options.availableProviderIds}
        onDefaultModeChange={(value) => options.updateSetting('defaultMode', value)}
        onDefaultSingleProviderChange={(value) => options.updateSetting('defaultSingleProvider', value)}
        onDefaultOrchestratedProviderToggle={options.toggleDefaultOrchestratedProvider}
      />

      <ProvidersSection
        providerSettings={options.settings.providers}
        validating={options.validating}
        keyStatus={options.keyStatus}
        onUpdateProvider={options.updateProvider}
        onValidateKey={options.validateKey}
      />

      <ConsensusPromptingSection
        consensusProvider={options.settings.consensusProvider}
        availableProviderIds={options.availableProviderIds}
        pageContextEnabled={options.settings.pageContextEnabled}
        systemPrompt={options.settings.systemPrompt}
        onConsensusProviderChange={(value) => options.updateSetting('consensusProvider', value)}
        onPageContextEnabledChange={(value) => options.updateSetting('pageContextEnabled', value)}
        onSystemPromptChange={(value) => options.updateSetting('systemPrompt', value)}
        onResetSystemPrompt={options.resetSystemPrompt}
      />

      <ResponseShapingSection
        maxTokens={options.settings.maxTokens}
        temperature={options.settings.temperature}
        onMaxTokensChange={(value) => options.updateSetting('maxTokens', value)}
        onTemperatureChange={(value) => options.updateSetting('temperature', value)}
      />

      <HistoryAppearanceSection
        historyEnabled={options.settings.historyEnabled}
        theme={options.settings.theme}
        onHistoryEnabledChange={(value) => options.updateSetting('historyEnabled', value)}
        onThemeChange={options.handleThemeChange}
      />
    </main>
  {/if}
</div>
