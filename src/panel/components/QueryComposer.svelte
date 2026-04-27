<script>
    import ProviderPicker from '../../lib/components/ProviderPicker.svelte';
    import { PROVIDER_MAP } from '../../lib/constants.js';
    import { formatSourceLabel } from '../helpers.js';

    const {
        inputText,
        composerMode,
        composerProvider,
        composerSelectedProviders,
        pendingDraft,
        currentSourceUrl,
        currentSourceTitle,
        configuredProviderIds,
        visibleComposerProviders,
        canSubmit,
        isQuerying,
        currentQuery,
        onInputChange,
        onSwitchMode,
        onToggleProvider,
        onSubmit,
        onHide,
    } = $props();
</script>

<section class="composer">
    <div class="composer__controls">
        <div class="segmented segmented--full">
            <button
                class="segmented__btn"
                class:active={composerMode === 'orchestrated'}
                onclick={() => onSwitchMode('orchestrated')}
            >
                Orchestrated
            </button>
            <button
                class="segmented__btn"
                class:active={composerMode === 'single'}
                onclick={() => onSwitchMode('single')}
            >
                Single Model
            </button>
        </div>

        <ProviderPicker
            title="Providers"
            description={composerMode === 'single'
                ? 'Choose one configured provider.'
                : 'Choose the providers included in this orchestrated run.'}
            selectionMode={composerMode === 'single' ? 'single' : 'multi'}
            selected={composerMode === 'single' ? [composerProvider] : composerSelectedProviders}
            visible={visibleComposerProviders}
            available={configuredProviderIds}
            emptyMessage="Add an API key in Preferences to unlock providers here."
            onToggle={onToggleProvider}
        />
    </div>

    <textarea
        class="composer__input"
        rows={4}
        value={inputText}
        placeholder={pendingDraft?.isCustom
            ? 'Edit the prompt before sending it to Asaki...'
            : 'Highlight text on a page and use Ask Asaki, or write your own prompt here...'}
        oninput={(event) => onInputChange(event.currentTarget.value)}
        onkeydown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                onSubmit();
            }
        }}
    ></textarea>

    <div class="composer__footer">
        <div class="composer__meta">
            <span>
                {composerMode === 'orchestrated'
                    ? `${composerSelectedProviders.length || 0} provider${composerSelectedProviders.length === 1 ? '' : 's'} selected`
                    : `Targeting ${PROVIDER_MAP[composerProvider]?.label ?? 'your selected provider'}.`}
            </span>
            {#if pendingDraft?.sourceUrl || currentSourceUrl}
                <span>Source: {formatSourceLabel(pendingDraft?.sourceUrl ?? currentSourceUrl, pendingDraft?.sourceTitle ?? currentSourceTitle)}</span>
            {/if}
        </div>

        <div class="composer__actions">
            {#if currentQuery}
                <button class="btn btn-ghost btn-sm" onclick={onHide}>Hide</button>
            {/if}
            <button class="btn btn-primary" onclick={onSubmit} disabled={!canSubmit || isQuerying}>
                Run Asaki
            </button>
        </div>
    </div>
</section>
