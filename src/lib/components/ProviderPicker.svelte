<script>
  import { PROVIDER_MAP } from '../constants.js';

  const {
    title,
    description = '',
    selectionMode,
    selected = [],
    visible = [],
    available = [],
    emptyMessage = 'No providers available.',
    onToggle,
  } = $props();

  const iconUrls = Object.fromEntries(
    ['anthropic', 'openai', 'gemini', 'grok'].map((provider) => [
      provider,
      chrome.runtime.getURL(`icons/${provider}.svg`),
    ]),
  );

  function isSelected(provider) {
    return selected.includes(provider);
  }

  function isAvailable(provider) {
    return available.includes(provider);
  }
</script>

<section class="provider-picker">
  <div class="provider-picker__header">
    <p class="provider-picker__title">{title}</p>
    {#if description}
      <p class="provider-picker__description">{description}</p>
    {/if}
  </div>

  {#if visible.length === 0}
    <div class="provider-picker__empty">{emptyMessage}</div>
  {:else}
    <div class="provider-picker__rail" role={selectionMode === 'single' ? 'radiogroup' : 'group'}>
      {#each visible as provider}
        {@const meta = PROVIDER_MAP[provider]}
        {@const availableProvider = isAvailable(provider)}
        <button
          class="provider-chip"
          class:selected={isSelected(provider)}
          class:unavailable={!availableProvider}
          disabled={!availableProvider}
          aria-pressed={selectionMode === 'multi' ? isSelected(provider) : undefined}
          aria-checked={selectionMode === 'single' ? isSelected(provider) : undefined}
          role={selectionMode === 'single' ? 'radio' : 'button'}
          onclick={() => onToggle(provider)}
        >
          <img class="provider-chip__icon" src={iconUrls[provider]} alt="" aria-hidden="true" />
          <span>{meta.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .provider-picker {
    display: grid;
    gap: 10px;
  }

  .provider-picker__header {
    display: grid;
    gap: 4px;
  }

  .provider-picker__title {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--fg-muted);
    font-weight: 700;
  }

  .provider-picker__description {
    font-size: 11px;
    color: var(--fg-faint);
    line-height: 1.45;
  }

  .provider-picker__empty {
    padding: 12px 14px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--bg-subtle) 70%, transparent);
    color: var(--fg-faint);
    font-size: 11px;
  }

  .provider-picker__rail {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .provider-chip {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: color-mix(in srgb, var(--bg-card) 96%, white 4%);
    color: var(--fg);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: transform var(--transition), background var(--transition), border-color var(--transition), color var(--transition);
    box-shadow: var(--shadow);
  }

  .provider-chip:hover:not(:disabled) {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--bg-hover) 78%, white 22%);
  }

  .provider-chip.selected {
    border-color: color-mix(in srgb, var(--accent) 50%, white 10%);
    background: color-mix(in srgb, var(--accent) 18%, var(--bg-card));
    color: var(--accent-strong);
  }

  .provider-chip.unavailable {
    opacity: 0.48;
    box-shadow: none;
    cursor: not-allowed;
  }

  .provider-chip__icon {
    width: 15px;
    height: 15px;
    object-fit: contain;
    flex-shrink: 0;
  }
</style>
