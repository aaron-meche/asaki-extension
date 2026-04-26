<script lang="ts">
  import type {
    ModelMeta,
    ProviderId,
    ProviderMeta,
    ProviderSettings,
  } from '../../lib/types.js';

  type KeyStatus = 'valid' | 'invalid' | 'idle';

  const {
    provider,
    providerSettings,
    validating,
    keyStatus,
    onEnabledChange,
    onApiKeyChange,
    onModelChange,
    onValidate,
  }: {
    provider: ProviderMeta;
    providerSettings: ProviderSettings;
    validating: boolean;
    keyStatus: KeyStatus;
    onEnabledChange: (enabled: boolean) => void;
    onApiKeyChange: (apiKey: string) => void;
    onModelChange: (modelIndex: number) => void;
    onValidate: (provider: ProviderId) => void;
  } = $props();

  const activeModel = $derived(
    provider.models[providerSettings.modelIndex] ?? provider.models[0],
  );
  const activeModelSummary = $derived(
    `${activeModel.label} · $${activeModel.inputCost}/${activeModel.outputCost} per 1M`,
  );

  const STATUS_ICON: Record<KeyStatus, string> = {
    valid: '✓',
    invalid: '✕',
    idle: '·',
  };

  function modelOptionLabel(model: ModelMeta): string {
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
        onchange={(event) => onEnabledChange((event.currentTarget as HTMLInputElement).checked)}
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
          oninput={(event) => onApiKeyChange((event.currentTarget as HTMLInputElement).value)}
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
        onchange={(event) => onModelChange(Number((event.currentTarget as HTMLSelectElement).value))}
      >
        {#each provider.models as model}
          <option value={model.index}>{modelOptionLabel(model)}</option>
        {/each}
      </select>
    </div>
  </div>
</article>
