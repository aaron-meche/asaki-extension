<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_SYSTEM_PROMPT } from '../lib/constants.js';
  import { loadSettings, saveSettings, watchSettings } from '../lib/storage.js';
  import { applyTheme, getConfiguredProviderIds } from '../lib/settings-helpers.js';
  import type { ProviderId, ProviderSettings, Settings } from '../lib/types.js';
  import { RueterModel } from '../lib/vendor/rueter-model.js';
  import {
    calculateEstimatedCost,
    normalizeSettings,
    toggleSelectedProvider,
  } from './helpers.js';
  import ConsensusPromptingSection from './components/ConsensusPromptingSection.svelte';
  import ExecutionDefaultsSection from './components/ExecutionDefaultsSection.svelte';
  import HistoryAppearanceSection from './components/HistoryAppearanceSection.svelte';
  import OptionsHero from './components/OptionsHero.svelte';
  import ProvidersSection from './components/ProvidersSection.svelte';
  import ResponseShapingSection from './components/ResponseShapingSection.svelte';

  type KeyStatus = 'valid' | 'invalid' | 'idle';

  let settings = $state<Settings | null>(null);
  let saving = $state(false);
  let saved = $state(false);
  let validating = $state<Partial<Record<ProviderId, boolean>>>({});
  let keyStatus = $state<Partial<Record<ProviderId, KeyStatus>>>({});

  const availableProviderIds = $derived(settings ? getConfiguredProviderIds(settings) : []);
  const estimatedCost = $derived(calculateEstimatedCost(settings));

  function setSettings(update: (current: Settings) => Settings) {
    if (!settings) {
      return;
    }

    settings = update(settings);
  }

  function updateSetting<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateProvider(provider: ProviderId, patch: Partial<ProviderSettings>) {
    setSettings((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [provider]: {
          ...current.providers[provider],
          ...patch,
        },
      },
    }));
  }

  function toggleDefaultOrchestratedProvider(provider: ProviderId) {
    setSettings((current) => ({
      ...current,
      defaultOrchestratedProviders: toggleSelectedProvider(
        current.defaultOrchestratedProviders,
        provider,
      ),
    }));
  }

  function handleThemeChange(theme: Settings['theme']) {
    updateSetting('theme', theme);
    applyTheme(theme);
  }

  async function handleSave() {
    if (!settings) {
      return;
    }

    saving = true;
    settings = await saveSettings(normalizeSettings(settings));
    saving = false;
    saved = true;
    applyTheme(settings.theme);
    setTimeout(() => {
      saved = false;
    }, 2200);
  }

  async function validateKey(provider: ProviderId) {
    if (!settings) {
      return;
    }

    const providerSettings = settings.providers[provider];
    if (!providerSettings.apiKey.trim()) {
      keyStatus = { ...keyStatus, [provider]: 'invalid' };
      return;
    }

    validating = { ...validating, [provider]: true };
    keyStatus = { ...keyStatus, [provider]: 'idle' };

    try {
      const model = new RueterModel(provider, providerSettings.apiKey, providerSettings.modelIndex, {
        maxTokens: 12,
        temperature: 0,
      });

      await model.prompt('Reply with the single word: ok');
      keyStatus = { ...keyStatus, [provider]: 'valid' };
    } catch {
      keyStatus = { ...keyStatus, [provider]: 'invalid' };
    } finally {
      validating = { ...validating, [provider]: false };
    }
  }

  onMount(() => {
    let stopWatchingSettings = () => {};

    void (async () => {
      settings = await loadSettings();
      if (settings) {
        applyTheme(settings.theme);
      }
    })();

    stopWatchingSettings = watchSettings((nextSettings) => {
      settings = nextSettings;
      applyTheme(nextSettings.theme);
    });

    return () => {
      stopWatchingSettings();
    };
  });
</script>

<div class="options">
  <OptionsHero
    estimatedCost={estimatedCost}
    saving={saving}
    saved={saved}
    onSave={handleSave}
  />

  {#if settings}
    <main class="sections">
      <ExecutionDefaultsSection
        defaultMode={settings.defaultMode}
        defaultSingleProvider={settings.defaultSingleProvider}
        defaultOrchestratedProviders={settings.defaultOrchestratedProviders}
        availableProviderIds={availableProviderIds}
        onDefaultModeChange={(defaultMode) => updateSetting('defaultMode', defaultMode)}
        onDefaultSingleProviderChange={(defaultSingleProvider) =>
          updateSetting('defaultSingleProvider', defaultSingleProvider)}
        onDefaultOrchestratedProviderToggle={toggleDefaultOrchestratedProvider}
      />

      <ProvidersSection
        providerSettings={settings.providers}
        validating={validating}
        keyStatus={keyStatus}
        onUpdateProvider={updateProvider}
        onValidateKey={validateKey}
      />

      <ConsensusPromptingSection
        consensusProvider={settings.consensusProvider}
        availableProviderIds={availableProviderIds}
        pageContextEnabled={settings.pageContextEnabled}
        systemPrompt={settings.systemPrompt}
        onConsensusProviderChange={(consensusProvider) =>
          updateSetting('consensusProvider', consensusProvider)}
        onPageContextEnabledChange={(pageContextEnabled) =>
          updateSetting('pageContextEnabled', pageContextEnabled)}
        onSystemPromptChange={(systemPrompt) => updateSetting('systemPrompt', systemPrompt)}
        onResetSystemPrompt={() => updateSetting('systemPrompt', DEFAULT_SYSTEM_PROMPT)}
      />

      <ResponseShapingSection
        maxTokens={settings.maxTokens}
        temperature={settings.temperature}
        onMaxTokensChange={(maxTokens) => updateSetting('maxTokens', maxTokens)}
        onTemperatureChange={(temperature) => updateSetting('temperature', temperature)}
      />

      <HistoryAppearanceSection
        historyEnabled={settings.historyEnabled}
        theme={settings.theme}
        onHistoryEnabledChange={(historyEnabled) => updateSetting('historyEnabled', historyEnabled)}
        onThemeChange={handleThemeChange}
      />
    </main>
  {/if}
</div>
