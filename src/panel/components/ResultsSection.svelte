<script lang="ts">
  import ConsensusCard from '../../lib/components/ConsensusCard.svelte';
  import ProviderTabs from '../../lib/components/ProviderTabs.svelte';
  import type { ConsensusResult, ProviderId, ProviderResult, QueryMode } from '../../lib/types.js';

  const {
    currentMode,
    activeProviders,
    consensusResult,
    providerResults,
    isQuerying,
    onCancel,
    onRerun,
    onEdit,
  }: {
    currentMode: QueryMode;
    activeProviders: ProviderId[];
    consensusResult: ConsensusResult;
    providerResults: Record<string, ProviderResult>;
    isQuerying: boolean;
    onCancel: () => void;
    onRerun: () => void;
    onEdit: () => void;
  } = $props();
</script>

<div class="results">
  {#if currentMode === 'orchestrated'}
    <ConsensusCard result={consensusResult} />
  {/if}

  <ProviderTabs providers={activeProviders} results={providerResults} />

  <footer class="action-bar">
    <div class="action-bar__meta">
      {#if isQuerying}
        <span>Working across {activeProviders.length} {activeProviders.length === 1 ? 'model' : 'models'}...</span>
      {:else}
        <span>{currentMode === 'orchestrated' ? 'Orchestrated run complete.' : 'Single-model run complete.'}</span>
      {/if}
    </div>

    <div class="action-bar__actions">
      {#if isQuerying}
        <button class="btn btn-danger btn-sm" onclick={onCancel}>Cancel</button>
      {:else}
        <button class="btn btn-secondary btn-sm" onclick={onRerun}>Re-run</button>
        <button class="btn btn-ghost btn-sm" onclick={onEdit}>Edit</button>
      {/if}
    </div>
  </footer>
</div>
