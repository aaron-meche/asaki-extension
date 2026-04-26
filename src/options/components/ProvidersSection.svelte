<script lang="ts">
  import { PROVIDERS } from '../../lib/constants.js';
  import type { ProviderId, ProviderSettings, Settings } from '../../lib/types.js';
  import OptionsSection from './OptionsSection.svelte';
  import ProviderCard from './ProviderCard.svelte';

  type KeyStatus = 'valid' | 'invalid' | 'idle';

  const {
    providerSettings,
    validating,
    keyStatus,
    onUpdateProvider,
    onValidateKey,
  }: {
    providerSettings: Settings['providers'];
    validating: Partial<Record<ProviderId, boolean>>;
    keyStatus: Partial<Record<ProviderId, KeyStatus>>;
    onUpdateProvider: (provider: ProviderId, patch: Partial<ProviderSettings>) => void;
    onValidateKey: (provider: ProviderId) => void;
  } = $props();
</script>

<OptionsSection
  title="Providers"
  description="Enable the providers you want Asaki to use, add their keys, and choose the default model for each provider."
>
  <div class="provider-list">
    {#each PROVIDERS as provider}
      <ProviderCard
        provider={provider}
        providerSettings={providerSettings[provider.id]}
        validating={validating[provider.id] ?? false}
        keyStatus={keyStatus[provider.id] ?? 'idle'}
        onEnabledChange={(enabled) => onUpdateProvider(provider.id, { enabled })}
        onApiKeyChange={(apiKey) => onUpdateProvider(provider.id, { apiKey })}
        onModelChange={(modelIndex) => onUpdateProvider(provider.id, { modelIndex })}
        onValidate={onValidateKey}
      />
    {/each}
  </div>
</OptionsSection>
