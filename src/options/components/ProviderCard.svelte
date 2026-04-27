<script>
    const {
        provider,
        providerSettings,
        validating,
        keyStatus,
        onEnabledChange,
        onApiKeyChange,
        onModelChange,
        onValidate,
    } = $props();

    const activeModel = $derived(
        provider.models[providerSettings.modelIndex] ?? provider.models[0],
    );
    const activeModelSummary = $derived(
        `${activeModel.label} · $${activeModel.inputCost}/${activeModel.outputCost} per 1M`,
    );

    const STATUS_ICON = {
        valid: '✓',
        invalid: '✕',
        idle: '·',
    };

    function modelOptionLabel(model) {
        return `${model.label} · $${model.inputCost}/${model.outputCost} per 1M`;
    }
</script>

<article class="provider-card" style="--provider-color:{provider.color}">
    <header class="provider-card__header">
        <div class="provider-card__identity">
            <span class="provider-card__dot"></span>
            <div>
                <h3>{provider.label}</h3>
                <p>{activeModelSummary}</p>
            </div>
        </div>

        <label class="toggle" title="Enable this provider">
            <input
                type="checkbox"
                checked={providerSettings.enabled}
                onchange={(event) => onEnabledChange(event.currentTarget.checked)}
            />
            <span class="toggle__track"></span>
        </label>
    </header>

    <div class="provider-card__body">
        <div class="field">
            <label class="field__label" for="key-{provider.id}">API key</label>
            <div class="field__row">
                <input
                    id="key-{provider.id}"
                    class="input"
                    type="password"
                    value={providerSettings.apiKey}
                    autocomplete="off"
                    placeholder="Paste your key"
                    oninput={(event) => onApiKeyChange(event.currentTarget.value)}
                />
                <button
                    class="btn btn-secondary btn-sm"
                    onclick={() => onValidate(provider.id)}
                    disabled={!providerSettings.apiKey.trim() || validating}
                >
                    {validating ? '...' : 'Test'}
                </button>
                <span class="status status--{keyStatus}">
                    {STATUS_ICON[keyStatus]}
                </span>
            </div>
        </div>

        <div class="field">
            <label class="field__label" for="model-{provider.id}">Default model</label>
            <select
                id="model-{provider.id}"
                class="select"
                value={providerSettings.modelIndex}
                onchange={(event) => onModelChange(Number(event.currentTarget.value))}
            >
                {#each provider.models as model}
                    <option value={model.index}>{modelOptionLabel(model)}</option>
                {/each}
            </select>
        </div>
    </div>
</article>
