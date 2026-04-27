<script>
    import Skeleton from './Skeleton.svelte';
    import { PROVIDER_MAP } from '../constants.js';
    import { renderMarkdown, stripMarkdown } from '../markdown.js';

    const { result } = $props();

    let collapsed = $state(false);

    const renderedText = $derived(result.text ? renderMarkdown(result.text) : '');
    const providerLabel = $derived(result.provider ? PROVIDER_MAP[result.provider].label : '');

    async function copy(asMarkdown) {
        const text = asMarkdown ? result.text : stripMarkdown(result.text);
        await navigator.clipboard.writeText(text);
    }
</script>

<section class="consensus" class:error={result.status === 'error'}>
    <header class="consensus__header">
        <div class="consensus__identity">
            <span class="consensus__star" aria-hidden="true">✦</span>
            <div>
                <h2 class="consensus__title">Best Answer</h2>
                {#if providerLabel}
                    <p class="consensus__meta">Arbitrated by {providerLabel}</p>
                {/if}
            </div>
        </div>

        {#if result.confidence}
            <span class="badge badge--{result.confidence.toLowerCase()}">{result.confidence}</span>
        {/if}

        <button
            class="btn btn-ghost btn-sm btn-icon"
            onclick={() => (collapsed = !collapsed)}
            aria-expanded={!collapsed}
            aria-label="Toggle best answer"
        >
            {collapsed ? '▸' : '▾'}
        </button>
    </header>

    {#if !collapsed}
        <div class="consensus__body prose">
            {#if result.status === 'idle'}
                <p class="muted">Consensus appears once multiple model responses are available.</p>
            {:else if result.status === 'loading'}
                <Skeleton lines={6} />
            {:else if result.status === 'error'}
                <div class="err-box">⚠ {result.error}</div>
            {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html renderedText}
            {/if}
        </div>

        {#if result.text}
            <footer class="consensus__footer">
                <button class="btn btn-primary btn-sm" onclick={() => copy(false)}>Copy Best</button>
                <button class="btn btn-ghost btn-sm" onclick={() => copy(true)}>Copy MD</button>
            </footer>
        {/if}
    {/if}
</section>

<style>
    .consensus {
        background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 10%, transparent), transparent 34%),
            linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, white 4%), var(--bg-card));
        border-bottom: 1px solid var(--border-strong);
    }

    .consensus__header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
    }

    .consensus__identity {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }

    .consensus__star {
        color: var(--accent);
        font-size: 16px;
    }

    .consensus__title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.02em;
    }

    .consensus__meta {
        font-size: 10px;
        color: var(--fg-faint);
        margin-top: 1px;
    }

    .consensus__body {
        padding: 14px;
        max-height: 280px;
        overflow-y: auto;
    }

    .consensus__footer {
        display: flex;
        gap: 8px;
        padding: 8px 12px 12px;
    }

    .badge {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 3px 7px;
        border-radius: 999px;
        background: var(--bg-hover);
        color: var(--fg-muted);
        text-transform: uppercase;
    }

    .badge--high {
        background: color-mix(in srgb, var(--success) 18%, transparent);
        color: var(--success);
    }

    .badge--medium {
        background: color-mix(in srgb, var(--warning) 18%, transparent);
        color: var(--warning);
    }

    .badge--low {
        background: color-mix(in srgb, var(--error) 18%, transparent);
        color: var(--error);
    }

    .err-box {
        padding: 12px;
        background: color-mix(in srgb, var(--error) 9%, transparent);
        border: 1px solid color-mix(in srgb, var(--error) 22%, transparent);
        border-radius: var(--radius);
        color: var(--error);
        font-size: 12px;
    }

    .muted {
        color: var(--fg-faint);
        font-size: 12px;
    }
</style>
