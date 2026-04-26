<script module>
  // Toast state lives at module scope so any component can call showToast().
  let toasts = $state([]);
  let counter = 0;

  export function showToast(message, type = 'info', duration = 4000) {
    const id = ++counter;
    toasts.push({ id, message, type });
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }

  function dismiss(id) {
    const idx = toasts.findIndex(t => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
  }
</script>

{#if toasts.length > 0}
  <div class="toast-stack" aria-live="polite">
    {#each toasts as t (t.id)}
      <div class="toast toast--{t.type}">
        <span class="toast__icon">{ICONS[t.type]}</span>
        <span class="toast__msg">{t.message}</span>
        <button class="toast__close btn btn-ghost btn-icon btn-sm" onclick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
      </div>
    {/each}
  </div>
{/if}

<script>
  const ICONS = { info: 'ℹ', success: '✓', error: '✕', warning: '⚠' };
</script>

<style>
  .toast-stack {
    position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; gap: 6px;
    min-width: 240px; max-width: 320px; z-index: 9999;
  }
  .toast {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow-md);
    animation: slide-up 0.2s ease;
  }
  @keyframes slide-up { from { opacity:0; transform:translateY(6px) } }
  .toast--error   { border-color: var(--error);   }
  .toast--success { border-color: var(--success);  }
  .toast--warning { border-color: var(--warning);  }
  .toast__icon { font-size: 12px; flex-shrink: 0; }
  .toast--error   .toast__icon { color: var(--error);   }
  .toast--success .toast__icon { color: var(--success);  }
  .toast--warning .toast__icon { color: var(--warning);  }
  .toast__msg  { font-size: 11.5px; flex: 1; }
  .toast__close { margin-left: auto; font-size: 15px; }
</style>
