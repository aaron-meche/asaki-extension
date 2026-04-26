//
// service-worker.ts
//
// Asaki
// by Aaron Meche
//

import { cancelQuery, runQuery } from './orchestrator.js';
import { loadHistory, loadSettings } from '../lib/storage.js';
import type { PanelMessage, PendingQuery, SelectionContext, SwMessage } from '../lib/types.js';

let panelPort: chrome.runtime.Port | null = null;
let pendingExecution: PendingQuery | null = null;
let pendingDraft: PendingQuery | null = null;
let highlightedTabId: number | null = null;

const TEMPLATES: Record<string, string> = {
  eli5: 'Explain the following to me as if I were 5 years old:\n\n{{TEXT}}',
  summarize: 'Summarize the following in exactly 3 concise bullet points:\n\n{{TEXT}}',
  translate: 'Translate the following to Spanish:\n\n{{TEXT}}',
  critique: 'Critically analyze the following argument, pointing out logical flaws and strengths:\n\n{{TEXT}}',
};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'asaki-panel') {
    return;
  }

  panelPort = port;
  port.onMessage.addListener((message: PanelMessage) => void handlePanelMessage(message));
  port.onDisconnect.addListener(() => {
    panelPort = null;
    cancelQuery();
    void clearHighlight();
  });

  if (pendingDraft) {
    send({ type: 'PENDING_QUERY', draft: pendingDraft });
    pendingDraft = null;
  }

  if (pendingExecution) {
    const request = pendingExecution;
    pendingExecution = null;
    void startQuery(request);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  registerMenus();
});

chrome.runtime.onStartup.addListener(() => {
  registerMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuSelection(String(info.menuItemId), info.selectionText?.trim() ?? '', tab);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'trigger-asaki') {
    return;
  }

  void handleShortcutTrigger();
});

chrome.action.onClicked.addListener((tab) => {
  void openPanel(tab.id);
});

function send(message: SwMessage): void {
  try {
    panelPort?.postMessage(message);
  } catch {
    panelPort = null;
  }
}

function registerMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ask',
      title: 'Ask Asaki',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'custom',
      title: 'Ask Asaki (custom prompt)...',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'eli5',
      parentId: 'ask',
      title: "Explain like I'm 5",
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'summarize',
      parentId: 'ask',
      title: 'Summarize in 3 bullets',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'translate',
      parentId: 'ask',
      title: 'Translate to Spanish',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'critique',
      parentId: 'ask',
      title: 'Critique this argument',
      contexts: ['selection'],
    });
  });
}

async function handleContextMenuSelection(
  menuItemId: string,
  selectionText: string,
  tab?: chrome.tabs.Tab,
): Promise<void> {
  const settings = await loadSettings();
  const context = await collectTabContext(tab, selectionText);
  const query = context.text.trim() || selectionText.trim();

  if (!query) {
    send({ type: 'QUERY_ERROR', error: 'No selected text was found on this page.' });
    return;
  }

  const request: PendingQuery = {
    query,
    sourceUrl: context.url,
    sourceTitle: context.title,
    pageText: context.pageText,
    mode: settings.defaultMode,
    selectedProvider: settings.defaultSingleProvider,
    selectedProviders: settings.defaultOrchestratedProviders,
    customPrompt: TEMPLATES[menuItemId],
    isCustom: menuItemId === 'custom',
    tabId: tab?.id,
  };

  if (request.isCustom) {
    await queueDraft(request);
    return;
  }

  await queueExecution(request);
}

async function handleShortcutTrigger(): Promise<void> {
  const settings = await loadSettings();
  const activeTab = await getActiveTab();
  const context = await collectTabContext(activeTab);
  const query = context.text.trim();

  if (!query) {
    await openPanel(activeTab?.id);
    send({ type: 'QUERY_ERROR', error: 'Select text on the page before using the Asaki shortcut.' });
    return;
  }

  await queueExecution({
    query,
    sourceUrl: context.url,
    sourceTitle: context.title,
    pageText: context.pageText,
    mode: settings.defaultMode,
    selectedProvider: settings.defaultSingleProvider,
    selectedProviders: settings.defaultOrchestratedProviders,
    isCustom: false,
    tabId: activeTab?.id,
  });
}

async function handlePanelMessage(message: PanelMessage): Promise<void> {
  switch (message.type) {
    case 'PANEL_READY':
      return;

    case 'CANCEL_QUERY':
      cancelQuery();
      send({ type: 'QUERY_CANCELLED' });
      await clearHighlight();
      return;

    case 'RERUN_QUERY': {
      const history = await loadHistory();
      const entry = history.find((item) => item.id === message.historyId);

      if (!entry) {
        send({ type: 'QUERY_ERROR', error: 'That history entry is no longer available.' });
        return;
      }

      await startQuery({
        query: entry.query,
        sourceUrl: entry.sourceUrl,
        sourceTitle: entry.sourceTitle,
        mode: entry.mode,
        selectedProvider: entry.selectedProvider,
        selectedProviders: entry.selectedProviders,
        customPrompt: entry.customPrompt,
        isCustom: false,
      });
      return;
    }

    case 'START_QUERY': {
      const activeTab = await getActiveTab();
      const context = await collectTabContext(activeTab);

      await startQuery({
        query: message.query,
        sourceUrl: message.sourceUrl ?? context.url,
        sourceTitle: message.sourceTitle ?? context.title,
        pageText: message.pageText ?? context.pageText,
        mode: message.mode,
        selectedProvider: message.provider,
        selectedProviders: message.providers,
        customPrompt: message.customPrompt,
        isCustom: false,
        tabId: activeTab?.id,
      });
      return;
    }
  }
}

async function queueDraft(request: PendingQuery): Promise<void> {
  await openPanel(request.tabId);

  if (panelPort) {
    send({ type: 'PENDING_QUERY', draft: request });
  } else {
    pendingDraft = request;
  }
}

async function queueExecution(request: PendingQuery): Promise<void> {
  await openPanel(request.tabId);
  await highlightSelection(request.tabId);

  if (panelPort) {
    await startQuery(request);
  } else {
    pendingExecution = request;
  }
}

async function startQuery(request: PendingQuery): Promise<void> {
  try {
    await runQuery(
      request.query,
      request.sourceUrl,
      request.sourceTitle,
      send,
      {
        customPrompt: request.customPrompt,
        pageText: request.pageText,
        mode: request.mode,
        selectedProvider: request.selectedProvider,
        selectedProviders: request.selectedProviders,
      },
    );
  } catch (error: unknown) {
    send({
      type: 'QUERY_ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    pendingExecution = null;
    await clearHighlight();
  }
}

async function openPanel(tabId?: number): Promise<void> {
  if (!tabId) {
    return;
  }

  try {
    await chrome.sidePanel.open({ tabId });
  } catch {
    // Ignore unsupported pages like chrome:// URLs.
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function collectTabContext(
  tab?: chrome.tabs.Tab,
  fallbackText = '',
): Promise<SelectionContext> {
  const baseContext: SelectionContext = {
    text: fallbackText,
    url: tab?.url ?? '',
    title: tab?.title ?? '',
    pageText: '',
  };

  if (!tab?.id) {
    return baseContext;
  }

  try {
    const context = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }) as SelectionContext;
    return {
      text: context.text || fallbackText,
      url: context.url || baseContext.url,
      title: context.title || baseContext.title,
      pageText: context.pageText || '',
    };
  } catch {
    return baseContext;
  }
}

async function highlightSelection(tabId?: number): Promise<void> {
  await clearHighlight();

  if (!tabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, { type: 'HIGHLIGHT_SELECTION' });
    highlightedTabId = tabId;
  } catch {
    highlightedTabId = null;
  }
}

async function clearHighlight(): Promise<void> {
  if (!highlightedTabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(highlightedTabId, { type: 'CLEAR_HIGHLIGHT' });
  } catch {
    // Ignore tabs that no longer accept messages.
  } finally {
    highlightedTabId = null;
  }
}
