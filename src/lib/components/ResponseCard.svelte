<script lang="ts">
  import Skeleton from './Skeleton.svelte';
  import { renderMarkdown, stripMarkdown } from '../markdown.js';
  import type { ProviderResult } from '../types.js';

  const { result, active }: { result: ProviderResult; active: boolean } = $props();

  const tokens = $derived(result.text ? Math.ceil(result.text.length / 4) : 0);
  const renderedText = $derived(result.text ? renderMarkdown(result.text) : '');

  async function copy(asMarkdown: boolean) {
    const text = asMarkdown ? result.text : stripMarkdown(result.text);
    await navigator.clipboard.writeText(text);
  }
</script>

<section class="response-card" class:active role="tabpanel">
  <div class="response-card__body prose">
    {#if result.status === 'idle'}
      <p class="muted">Select text or type a prompt to start.</p>
    {:else if result.status === 'loading'}
      <Skeleton lines={5} />
    {:else if result.status === 'error'}
      <div class="err-box">
        <span class="err-box__icon">✕</span>
        <span>{result.error}</span>
      </div>
    {:else}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html renderedText}
    {/if}
  </div>

  <footer class="response-card__footer">
    <span class="token-count">
      {#if tokens > 0}~{tokens.toLocaleString()} tokens{/if}
      {#if result.cost}
        {tokens > 0 ? ' · ' : ''}{result.cost}
      {/if}
    </span>

    {#if result.text}
      <button class="btn btn-ghost btn-sm" onclick={() => copy(true)}>Copy MD</button>
      <button class="btn btn-secondary btn-sm" onclick={() => copy(false)}>Copy</button>
    {/if}
  </footer>
</section>

<style>
  .response-card {
    display: none;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 94%, white 6%) 0%, var(--bg-card) 100%);
  }

  .response-card.active {
    display: flex;
  }

  .response-card__body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
  }

  .response-card__footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid var(--border);
    background: var(--bg-subtle);
    flex-shrink: 0;
  }

  .token-count {
    font-size: 10px;
    color: var(--fg-faint);
    flex: 1;
  }

  .err-box {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: color-mix(in srgb, var(--error) 9%, transparent);
    border: 1px solid color-mix(in srgb, var(--error) 22%, transparent);
    border-radius: var(--radius);
    color: var(--error);
    font-size: 12px;
    line-height: 1.5;
  }

  .err-box__icon {
    font-weight: 700;
  }

  .muted {
    color: var(--fg-faint);
    font-size: 12px;
  }
</style>
