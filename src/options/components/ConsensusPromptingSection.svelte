<script>
    import ProviderPicker from '../../lib/components/ProviderPicker.svelte';
    import { DEFAULT_SYSTEM_PROMPT, PROVIDER_IDS } from '../../lib/constants.js';
    import OptionsSection from './OptionsSection.svelte';

    const {
        consensusProvider,
        availableProviderIds,
        pageContextEnabled,
        systemPrompt,
        onConsensusProviderChange,
        onPageContextEnabledChange,
        onSystemPromptChange,
        onResetSystemPrompt,
    } = $props();
</script>

<OptionsSection
    title="Consensus & prompting"
    description="Control how Asaki builds prompts and which provider synthesizes the final best answer during orchestrated runs."
>
    <div class="grid grid--two">
        <div class="card card--stack">
            <ProviderPicker
                title="Consensus provider"
                description="Asaki uses this provider to synthesize the final best answer after an orchestrated run."
                selectionMode="single"
                selected={[consensusProvider]}
                visible={PROVIDER_IDS}
                available={availableProviderIds}
                emptyMessage="Add and enable provider keys below to choose a consensus provider."
                onToggle={onConsensusProviderChange}
            />
        </div>

        <div class="card card--stack">
            <label class="field__label" for="page-context">Page context</label>
            <div class="switch-row">
                <div>
                    <strong>Include nearby page text</strong>
                    <p class="field__hint">Adds local page context around the selected content before prompting the models.</p>
                </div>
                <label class="toggle">
                    <input
                        id="page-context"
                        type="checkbox"
                        checked={pageContextEnabled}
                        onchange={(event) => onPageContextEnabledChange(event.currentTarget.checked)}
                    />
                    <span class="toggle__track"></span>
                </label>
            </div>
        </div>
    </div>

    <div class="card card--stack card--wide">
        <label class="field__label" for="system-prompt">System prompt</label>
        <textarea
            id="system-prompt"
            class="textarea"
            rows={5}
            value={systemPrompt}
            oninput={(event) => onSystemPromptChange(event.currentTarget.value)}
        ></textarea>
        <div class="field__row field__row--spread">
            <p class="field__hint">Applied to each provider call before the user prompt.</p>
            <button class="btn btn-ghost btn-sm" onclick={onResetSystemPrompt}>
                {systemPrompt === DEFAULT_SYSTEM_PROMPT ? 'Default prompt' : 'Reset prompt'}
            </button>
        </div>
    </div>
</OptionsSection>
