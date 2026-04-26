<script>
  const { lines = 4 } = $props();
  const widths = [100, 88, 95, 72, 84, 68, 91];
</script>

<div class="skeleton">
  {#each Array(lines) as _, i}
    <div class="skeleton__line" style="width:{widths[i % widths.length]}%"></div>
  {/each}
</div>

<style>
  .skeleton { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
  .skeleton__line {
    height: 11px; background: var(--border); border-radius: 4px;
    animation: shimmer 1.6s ease-in-out infinite;
  }
  @keyframes shimmer { 0%,100% { opacity:.55 } 50% { opacity:1 } }
</style>
