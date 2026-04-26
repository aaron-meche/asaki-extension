/**
 * Shared data-shape notes for the app, kept in JavaScript instead of TypeScript.
 *
 * @typedef {'anthropic' | 'openai' | 'gemini' | 'grok'} ProviderId
 * @typedef {'orchestrated' | 'single'} QueryMode
 * @typedef {'idle' | 'loading' | 'done' | 'error'} ProviderStatus
 *
 * @typedef {object} ModelMeta
 * @property {number} index
 * @property {string} name
 * @property {string} label
 * @property {number} inputCost
 * @property {number} outputCost
 *
 * @typedef {object} ProviderMeta
 * @property {ProviderId} id
 * @property {string} label
 * @property {string} color
 * @property {ModelMeta[]} models
 *
 * @typedef {object} ProviderSettings
 * @property {boolean} enabled
 * @property {string} apiKey
 * @property {number} modelIndex
 *
 * @typedef {object} Settings
 * @property {Record<ProviderId, ProviderSettings>} providers
 * @property {ProviderId} consensusProvider
 * @property {QueryMode} defaultMode
 * @property {ProviderId} defaultSingleProvider
 * @property {ProviderId[]} defaultOrchestratedProviders
 * @property {string} systemPrompt
 * @property {number} maxTokens
 * @property {number} temperature
 * @property {'system' | 'light' | 'dark'} theme
 * @property {boolean} historyEnabled
 * @property {boolean} pageContextEnabled
 *
 * @typedef {object} ProviderResult
 * @property {ProviderStatus} status
 * @property {string} text
 * @property {string} [error]
 * @property {string} [cost]
 *
 * @typedef {object} ConsensusResult
 * @property {ProviderStatus} status
 * @property {string} text
 * @property {string} [error]
 * @property {string} [confidence]
 * @property {ProviderId} [provider]
 *
 * @typedef {object} HistoryEntry
 * @property {string} id
 * @property {number} timestamp
 * @property {string} query
 * @property {string} sourceUrl
 * @property {string} sourceTitle
 * @property {QueryMode} mode
 * @property {ProviderId} [selectedProvider]
 * @property {ProviderId[]} [selectedProviders]
 * @property {string} [customPrompt]
 * @property {Partial<Record<ProviderId, string>>} responses
 * @property {string} consensus
 *
 * @typedef {object} PendingQuery
 * @property {string} query
 * @property {string} sourceUrl
 * @property {string} sourceTitle
 * @property {string} [pageText]
 * @property {QueryMode} mode
 * @property {ProviderId} [selectedProvider]
 * @property {ProviderId[]} [selectedProviders]
 * @property {string} [customPrompt]
 * @property {boolean} isCustom
 * @property {number} [tabId]
 *
 * @typedef {object} SelectionContext
 * @property {string} text
 * @property {string} url
 * @property {string} title
 * @property {string} pageText
 */

export {};
