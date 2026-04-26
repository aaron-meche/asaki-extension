<script lang="ts">
  import { PROVIDER_MAP } from '../../lib/constants.js';
  import { renderMarkdown } from '../../lib/markdown.js';
  import type { HistoryEntry, ProviderId } from '../../lib/types.js';
  import { formatDate, formatSourceLabel, historyModeLabel } from '../helpers.js';

  const {
    history,
    activeHistoryEntry,
    onClearHistory,
    onSelectEntry,
    onRerunHistory,
    onExportEntry,
    onDeleteEntry,
  }: {
    history: HistoryEntry[];
    activeHistoryEntry: HistoryEntry | null;
    onClearHistory: () => void | Promise<void>;
    onSelectEntry: (id: string) => void;
    onRerunHistory: (entry: HistoryEntry) => void;
    onExportEntry: (entry: HistoryEntry) => void;
    onDeleteEntry: (entry: HistoryEntry) => void | Promise<void>;
  } = $props();
</script>

<section class="history-view">
  <div class="history-view__header">
    <div>
      <h2>Saved runs</h2>
      <p>Last 50 prompts and their collected responses.</p>
    </div>

    {#if history.length > 0}
      <button class="btn btn-danger btn-sm" onclick={onClearHistory}>Clear all</button>
    {/if}
  </div>

  {#if history.length === 0}
    <div class="empty empty--history">
      <div class="empty__badge">↺</div>
      <h2>No saved history yet.</h2>
      <p>Completed runs appear here automatically when history is enabled in Settings.</p>
    </div>
  {:else}
    <div class="history-layout">
      <ul class="history-list">
        {#each history as entry (entry.id)}
          <li class="history-item" class:active={activeHistoryEntry?.id === entry.id}>
            <button class="history-item__body" onclick={() => onSelectEntry(entry.id)}>
              <div class="history-item__chips">
                <span class="chip">{historyModeLabel(entry)}</span>
                <span class="chip chip--subtle">{formatDate(entry.timestamp)}</span>
              </div>
              <p class="history-item__query">{entry.query}</p>
              <p class="history-item__meta">{formatSourceLabel(entry.sourceUrl, entry.sourceTitle)}</p>
            </button>

            <div class="history-item__actions">
              <button class="btn btn-secondary btn-sm" onclick={() => onRerunHistory(entry)}>Re-run</button>
              <button class="btn btn-ghost btn-sm" onclick={() => onExportEntry(entry)}>Export</button>
              <button class="btn btn-danger btn-sm" onclick={() => onDeleteEntry(entry)}>Delete</button>
            </div>
          </li>
        {/each}
      </ul>

      {#if activeHistoryEntry}
        <article class="history-detail">
          <header class="history-detail__header">
            <div class="history-detail__chips">
              <span class="chip">{historyModeLabel(activeHistoryEntry)}</span>
              <span class="chip chip--subtle">{formatSourceLabel(activeHistoryEntry.sourceUrl, activeHistoryEntry.sourceTitle)}</span>
            </div>
            <h3>{activeHistoryEntry.query}</h3>
          </header>

          {#if activeHistoryEntry.consensus}
            <section class="history-block">
              <h4>Best Answer</h4>
              <div class="prose">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html renderMarkdown(activeHistoryEntry.consensus)}
              </div>
            </section>
          {/if}

          {#each Object.entries(activeHistoryEntry.responses) as [provider, response]}
            <section class="history-block">
              <h4>{PROVIDER_MAP[provider as ProviderId].label}</h4>
              <div class="prose">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html renderMarkdown(response ?? '')}
              </div>
            </section>
          {/each}
        </article>
      {/if}
    </div>
  {/if}
</section>
