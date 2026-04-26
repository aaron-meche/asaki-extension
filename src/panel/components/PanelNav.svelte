<script lang="ts">
  type View = 'ask' | 'history';

  const {
    view,
    onSelect,
  }: {
    view: View;
    onSelect: (view: View) => void | Promise<void>;
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
