<script>
    import OptionsSection from './OptionsSection.svelte';

    const {
        historyEnabled,
        theme,
        onHistoryEnabledChange,
        onThemeChange,
    } = $props();

    const THEME_OPTIONS = ['system', 'light', 'dark'];

    function formatThemeLabel(nextTheme) {
        return nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1);
    }
</script>

<OptionsSection
    title="History & appearance"
    description="Manage local history and the theme used by the side panel and options UI."
>
    <div class="grid grid--two">
        <div class="card card--stack">
            <div class="switch-row">
                <div>
                    <strong>Save query history</strong>
                    <p class="field__hint">Stores the last 50 prompts and model responses in <code>chrome.storage.local</code>.</p>
                </div>
                <label class="toggle">
                    <input
                        type="checkbox"
                        checked={historyEnabled}
                        onchange={(event) => onHistoryEnabledChange(event.currentTarget.checked)}
                    />
                    <span class="toggle__track"></span>
                </label>
            </div>
        </div>

        <div class="card card--stack">
            <p class="field__label">Theme</p>
            <div class="radio-list">
                {#each THEME_OPTIONS as themeOption}
                    <label class="radio-option">
                        <input
                            type="radio"
                            name="theme"
                            value={themeOption}
                            checked={theme === themeOption}
                            onchange={() => onThemeChange(themeOption)}
                        />
                        <span>{formatThemeLabel(themeOption)}</span>
                    </label>
                {/each}
            </div>
        </div>
    </div>
</OptionsSection>
