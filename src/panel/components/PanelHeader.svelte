<script>
    const {
        theme,
        onCycleTheme,
        onOpenSettings,
    } = $props();

    const THEME_ICON = {
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
            <h1 class="brand__title">Compare models quickly.</h1>
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
