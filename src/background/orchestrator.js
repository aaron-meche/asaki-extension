import { runConsensus } from '../lib/consensus.js';
import { MAX_PAGE_CONTEXT_CHARS } from '../lib/constants.js';
import { appendHistory, generateId, loadSettings, updateHistory } from '../lib/storage.js';
import { QueryCancelledError, buildEffectivePrompt, getEnabledProviders, promptProvider } from '../lib/rueter.js';

let activeRun = null;

export function cancelQuery() {
    if (activeRun) {
        activeRun.cancelled = true;
        activeRun = null;
    }
}

export async function runQuery(
    query,
    sourceUrl,
    sourceTitle,
    send,
    options = {},
) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        send({ type: 'QUERY_ERROR', error: 'Enter a prompt or highlight some text first.' });
        return;
    }

    cancelQuery();
    const run = { id: generateId(), cancelled: false };
    activeRun = run;

    try {
        const settings = await loadSettings();
        const enabledProviders = getEnabledProviders(settings);

        if (enabledProviders.length === 0) {
            send({ type: 'QUERY_ERROR', error: 'No enabled providers have API keys configured. Open Settings to configure Asaki.' });
            return;
        }

        const resolved = resolveExecutionMode(
            enabledProviders,
            options.mode ?? settings.defaultMode,
            options.selectedProvider ?? settings.defaultSingleProvider,
            options.selectedProviders ?? settings.defaultOrchestratedProviders,
        );

        const pageContext = settings.pageContextEnabled
            ? options.pageText?.slice(0, MAX_PAGE_CONTEXT_CHARS).trim()
            : undefined;

        const prompt = buildEffectivePrompt(trimmedQuery, options.customPrompt, pageContext);

        let historyId;
        if (settings.historyEnabled) {
            historyId = generateId();
            await appendHistory({
                id: historyId,
                timestamp: Date.now(),
                query: trimmedQuery,
                sourceUrl,
                sourceTitle,
                mode: resolved.mode,
                selectedProvider: resolved.selectedProvider,
                selectedProviders: resolved.selectedProviders,
                customPrompt: options.customPrompt,
                responses: {},
                consensus: '',
            });
        }

        if (!isActive(run)) {
            return;
        }

        send({
            type: 'QUERY_STARTED',
            query: trimmedQuery,
            sourceUrl,
            sourceTitle,
            providers: resolved.providers,
            mode: resolved.mode,
            selectedProvider: resolved.selectedProvider,
            selectedProviders: resolved.selectedProviders,
            customPrompt: options.customPrompt,
        });

        const responses = {};

        await Promise.allSettled(
            resolved.providers.map(async (provider) => {
                try {
                    const providerSettings = settings.providers[provider];
                    const result = await promptProvider(prompt, {
                        provider,
                        apiKey: providerSettings.apiKey,
                        modelIndex: providerSettings.modelIndex,
                        systemPrompt: settings.systemPrompt,
                        temperature: settings.temperature,
                        maxTokens: settings.maxTokens,
                    }, {
                        isCancelled: () => !isActive(run),
                    });

                    if (!isActive(run)) {
                        return;
                    }

                    const text = result.text.trim();
                    if (!text) {
                        throw new Error(`${provider} returned an empty response.`);
                    }

                    responses[provider] = text;
                    send({
                        type: 'PROVIDER_RESULT',
                        provider,
                        text,
                        cost: result.cost,
                    });
                } catch (error) {
                    if (!isActive(run) || error instanceof QueryCancelledError) {
                        return;
                    }

                    send({
                        type: 'PROVIDER_ERROR',
                        provider,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }),
        );

        if (!isActive(run)) {
            return;
        }

        if (historyId) {
            await updateHistory(historyId, { responses });
        }

        if (resolved.mode === 'orchestrated') {
            const successfulProviders = resolved.providers.filter((provider) => Boolean(responses[provider]?.trim()));

            if (successfulProviders.length < 2) {
                send({
                    type: 'CONSENSUS_ERROR',
                    error: successfulProviders.length === 1
                        ? 'Consensus unavailable because only one model returned a result.'
                        : 'Consensus unavailable because no model returned a usable answer.',
                });
            } else {
                const consensusProvider = resolveConsensusProvider(successfulProviders, settings.consensusProvider);
                send({ type: 'CONSENSUS_STARTED', provider: consensusProvider });

                try {
                    const consensus = await runConsensus(responses, trimmedQuery, consensusProvider, settings, {
                        isCancelled: () => !isActive(run),
                    });

                    if (!isActive(run)) {
                        return;
                    }

                    send({
                        type: 'CONSENSUS_RESULT',
                        text: consensus.text,
                        confidence: consensus.confidence,
                        provider: consensus.provider,
                    });

                    if (historyId) {
                        await updateHistory(historyId, { consensus: consensus.text });
                    }
                } catch (error) {
                    if (!isActive(run) || error instanceof QueryCancelledError) {
                        return;
                    }

                    send({
                        type: 'CONSENSUS_ERROR',
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }

        if (!isActive(run)) {
            return;
        }

        send({ type: 'QUERY_FINISHED', historyId });
    } finally {
        if (isActive(run) || activeRun?.id === run.id) {
            activeRun = null;
        }
    }
}

function resolveExecutionMode(
    enabledProviders,
    requestedMode,
    preferredProvider,
    preferredProviders,
) {
    if (requestedMode === 'single' || enabledProviders.length === 1) {
        const selectedProvider = enabledProviders.includes(preferredProvider)
            ? preferredProvider
            : enabledProviders[0];

        return {
            mode: 'single',
            providers: [selectedProvider],
            selectedProvider,
            selectedProviders: [selectedProvider],
        };
    }

    const selectedProviders = preferredProviders.filter((provider) => enabledProviders.includes(provider));
    const providers = selectedProviders.length > 0 ? selectedProviders : enabledProviders;

    return {
        mode: 'orchestrated',
        providers,
        selectedProviders: providers,
    };
}

function resolveConsensusProvider(
    successfulProviders,
    configuredProvider,
) {
    return successfulProviders.includes(configuredProvider)
        ? configuredProvider
        : successfulProviders[0];
}

function isActive(run) {
    return activeRun?.id === run.id && !run.cancelled;
}
