<script>
  const {
    view,
    onSelect,
  } = $props();
</script>

<nav class="nav">
  <button class="nav__btn" class:active={view === 'ask'} onclick={() => onSelect('ask')}>
    Ask
  </button>
  <button class="nav__btn" class:active={view === 'history'} onclick={() => onSelect('history')}>
    History
  </button>
</nav>
