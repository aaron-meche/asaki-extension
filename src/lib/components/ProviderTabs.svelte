<script>
  import { PROVIDER_MAP } from '../constants.js';
  import ResponseCard from './ResponseCard.svelte';

  const {
    providers,
    results,
  } = $props();

  let activeTab = $state('');

  $effect(() => {
    if (providers.length === 1) {
      activeTab = providers[0];
      return;
    }

    if (providers.length && !providers.includes(activeTab)) {
      activeTab = providers[0];
    }
  });

  const STATUS_DOT = {
    idle: 'dot--idle',
    loading: 'dot--loading',
    done: 'dot--done',
    error: 'dot--error',
  };
</script>

<div class="provider-tabs">
  {#if providers.length > 1}
    <div class="tab-bar" role="tablist">
      {#each providers as id}
        {@const meta = PROVIDER_MAP[id]}
        {@const status = results[id]?.status ?? 'idle'}
        <button
          class="tab-btn"
          class:active={activeTab === id}
          role="tab"
          aria-selected={activeTab === id}
          onclick={() => (activeTab = id)}
        >
          <span class="tab-btn__label">{meta.label}</span>
          <span class="dot {STATUS_DOT[status]}" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="tab-panels">
    {#each providers as id}
      <ResponseCard
        result={results[id] ?? { status: 'idle', text: '' }}
        active={providers.length === 1 || activeTab === id}
      />
    {/each}
  </div>
</div>

<style>
  .provider-tabs {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  .tab-bar {
    display: flex;
    overflow-x: auto;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg-subtle) 84%, transparent);
  }

  .tab-bar::-webkit-scrollbar {
    height: 2px;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-family: var(--font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    color: var(--fg-muted);
    border-bottom: 2px solid transparent;
    transition: color var(--transition), background var(--transition);
  }

  .tab-btn.active {
    color: var(--fg);
    border-bottom-color: var(--accent);
    background: var(--bg-card);
  }

  .tab-btn:hover:not(.active) {
    color: var(--fg);
    background: var(--bg-hover);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot--idle {
    background: var(--border-strong);
  }

  .dot--loading {
    background: var(--accent);
    animation: pulse 1s ease-in-out infinite;
  }

  .dot--done {
    background: var(--success);
  }

  .dot--error {
    background: var(--error);
  }

  .tab-panels {
    flex: 1;
    overflow: hidden;
    position: relative;
    min-height: 0;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }

    50% {
      opacity: 0.45;
      transform: scale(0.82);
    }
  }
</style>
