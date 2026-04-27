import { onMount } from 'svelte';
import { DEFAULT_SYSTEM_PROMPT } from '../lib/constants.js';
import { applyTheme, getConfiguredProviderIds } from '../lib/settings-helpers.js';
import { loadSettings, saveSettings, watchSettings } from '../lib/storage.js';
import { RueterModel } from '../lib/vendor/rueter-model.js';
import {
    calculateEstimatedCost,
    normalizeSettings,
    toggleSelectedProvider,
} from './helpers.js';

export function createOptionsController() {
    let settings = $state(null);
    let saving = $state(false);
    let saved = $state(false);
    let validating = $state({});
    let keyStatus = $state({});

    const availableProviderIds = $derived(
        settings ? getConfiguredProviderIds(settings) : [],
    );
    const estimatedCost = $derived(calculateEstimatedCost(settings));

    function update(mutator) {
        if (!settings) {
            return;
        }

        settings = mutator(settings);
    }

    function updateSetting(key, value) {
        update((current) => ({ ...current, [key]: value }));
    }

    function updateProvider(provider, patch) {
        update((current) => ({
            ...current,
            providers: {
                ...current.providers,
                [provider]: {
                    ...current.providers[provider],
                    ...patch,
                },
            },
        }));
    }

    async function save() {
        if (!settings) {
            return;
        }

        saving = true;
        settings = await saveSettings(normalizeSettings(settings));
        saving = false;
        saved = true;
        applyTheme(settings.theme);
        setTimeout(() => {
            saved = false;
        }, 2200);
    }

    async function validateKey(provider) {
        if (!settings) {
            return;
        }

        const providerSettings = settings.providers[provider];
        if (!providerSettings.apiKey.trim()) {
            keyStatus = { ...keyStatus, [provider]: 'invalid' };
            return;
        }

        validating = { ...validating, [provider]: true };
        keyStatus = { ...keyStatus, [provider]: 'idle' };

        try {
            const model = new RueterModel(provider, providerSettings.apiKey, providerSettings.modelIndex, {
                maxTokens: 12,
                temperature: 0,
            });
            await model.prompt('Reply with the single word: ok');
            keyStatus = { ...keyStatus, [provider]: 'valid' };
        } catch {
            keyStatus = { ...keyStatus, [provider]: 'invalid' };
        } finally {
            validating = { ...validating, [provider]: false };
        }
    }

    onMount(() => {
        let stopWatchingSettings = () => {};

        void loadSettings().then((nextSettings) => {
            settings = nextSettings;
            applyTheme(nextSettings.theme);
        });

        stopWatchingSettings = watchSettings((nextSettings) => {
            settings = nextSettings;
            applyTheme(nextSettings.theme);
        });

        return () => stopWatchingSettings();
    });

    return {
        get settings() { return settings; },
        get estimatedCost() { return estimatedCost; },
        get saving() { return saving; },
        get saved() { return saved; },
        get validating() { return validating; },
        get keyStatus() { return keyStatus; },
        get availableProviderIds() { return availableProviderIds; },
        updateSetting,
        updateProvider,
        toggleDefaultOrchestratedProvider(provider) {
            update((current) => ({
                ...current,
                defaultOrchestratedProviders: toggleSelectedProvider(
                    current.defaultOrchestratedProviders,
                    provider,
                ),
            }));
        },
        handleThemeChange(theme) {
            updateSetting('theme', theme);
            applyTheme(theme);
        },
        resetSystemPrompt() {
            updateSetting('systemPrompt', DEFAULT_SYSTEM_PROMPT);
        },
        save,
        validateKey,
    };
}
