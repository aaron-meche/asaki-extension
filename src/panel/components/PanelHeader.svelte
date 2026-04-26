<script lang="ts">
  import type { Settings } from '../../lib/types.js';

  const {
    theme,
    onCycleTheme,
    onOpenSettings,
  }: {
    theme: Settings['theme'];
    onCycleTheme: () => void;
    onOpenSettings: () => void;
  } = $props();

  const THEME_ICON: Record<Settings['theme'], string> = {
    system: '◐',
    light: '☼',
    dark: '☾',
  };
</script>

<header class="header">
  <div class="brand">
    <div class="brand__glyph">A</div>
    <div>
      <p class="brand__eyebrow">Asaki</p>
      <h1 class="brand__title">Ask smarter than one model at a time.</h1>
    </div>
  </div>

  <div class="header__actions">
    <button class="btn btn-ghost btn-icon" onclick={onCycleTheme} title="Change theme">
      {THEME_ICON[theme]}
    </button>
    <button class="btn btn-ghost btn-icon" onclick={onOpenSettings} title="Open settings">
      ⚙
    </button>
  </div>
</header>
