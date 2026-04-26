<script>
  const {
    modeLabel,
    sourceLabel,
    query,
    onEdit,
  } = $props();
</script>

<section class="query-summary">
  <div class="query-summary__copy">
    <div class="query-summary__chips">
      <span class="chip">{modeLabel}</span>
      {#if sourceLabel}
        <span class="chip chip--subtle">{sourceLabel}</span>
      {/if}
    </div>
    <p class="query-summary__text">{query}</p>
  </div>
  <button class="btn btn-ghost btn-sm" onclick={onEdit}>Edit</button>
</section>
