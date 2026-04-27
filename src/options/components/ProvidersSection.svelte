<script>
    import { PROVIDERS } from '../../lib/constants.js';
    import OptionsSection from './OptionsSection.svelte';
    import ProviderCard from './ProviderCard.svelte';

    const {
        providerSettings,
        validating,
        keyStatus,
        onUpdateProvider,
        onValidateKey,
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
