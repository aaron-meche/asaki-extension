<script lang="ts">
  import ProviderPicker from '../../lib/components/ProviderPicker.svelte';
  import { PROVIDER_IDS } from '../../lib/constants.js';
  import type { ProviderId, QueryMode } from '../../lib/types.js';
  import OptionsSection from './OptionsSection.svelte';

  const {
    defaultMode,
    defaultSingleProvider,
    defaultOrchestratedProviders,
    availableProviderIds,
    onDefaultModeChange,
    onDefaultSingleProviderChange,
    onDefaultOrchestratedProviderToggle,
  }: {
    defaultMode: QueryMode;
    defaultSingleProvider: ProviderId;
    defaultOrchestratedProviders: ProviderId[];
    availableProviderIds: ProviderId[];
    onDefaultModeChange: (mode: QueryMode) => void;
    onDefaultSingleProviderChange: (provider: ProviderId) => void;
    onDefaultOrchestratedProviderToggle: (provider: ProviderId) => void;
  } = $props();
</script>

<OptionsSection
  title="Execution defaults"
  description="These settings control what happens when you choose Ask Asaki from the context menu or use the keyboard shortcut."
>
  <div class="grid grid--two">
    <div class="card card--stack">
      <p class="field__label">Default mode</p>
      <div class="segmented segmented--full">
        <button
          class="segmented__btn"
          class:active={defaultMode === 'orchestrated'}
          onclick={() => onDefaultModeChange('orchestrated')}
        >
          Orchestrated
        </button>
        <button
          class="segmented__btn"
          class:active={defaultMode === 'single'}
          onclick={() => onDefaultModeChange('single')}
        >
          Single Model
        </button>
      </div>
      <p class="field__hint">The panel reloads these presets whenever you switch between single-model and orchestrated mode.</p>
    </div>

    <div class="card card--stack">
      <ProviderPicker
        title="Default single-model provider"
        description="This preset is loaded whenever you switch the panel to single-model mode."
        selectionMode="single"
        selected={[defaultSingleProvider]}
        visible={PROVIDER_IDS}
        available={availableProviderIds}
        emptyMessage="Add and enable a provider key below to choose a single-model default."
        onToggle={onDefaultSingleProviderChange}
      />
    </div>
  </div>

  <div class="card card--stack card--wide">
    <ProviderPicker
      title="Default orchestrated providers"
      description="Choose the providers that should be preselected when the panel enters orchestrated mode."
      selectionMode="multi"
      selected={defaultOrchestratedProviders}
      visible={PROVIDER_IDS}
      available={availableProviderIds}
      emptyMessage="Add and enable provider keys below to choose orchestrated defaults."
      onToggle={onDefaultOrchestratedProviderToggle}
    />
  </div>
</OptionsSection>
