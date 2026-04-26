# Asaki

Asaki is a Chrome extension that makes AI prompting faster and more natural.

Instead of copying text into a chatbot, users can highlight text anywhere in Chrome, open the context menu, and choose **Ask Asaki** to send that selection into the Asaki side panel. From there, they can run the request against a single model or launch an orchestrated multi-model query where multiple providers respond in parallel and a user-selected arbitrator model synthesizes the final answer.

Powered by **rueter-ai**, Asaki is built to streamline side-by-side model comparison, prompt iteration, and consensus generation without leaving the page you are reading.

## Features

- Highlight text on any page and send it directly into the Asaki side panel
- Launch prompts from the Chrome context menu
- Run a query against a single model or multiple models in parallel
- Choose which model acts as the final arbitrator for orchestrated runs
- Compare responses from OpenAI, Anthropic, Gemini, and Grok/xAI
- Use quick prompt presets like:
  - Explain like I'm 5
  - Summarize in 3 bullets
  - Translate to Spanish
  - Critique this argument
- Use a custom prompt flow from the context menu
- Trigger Asaki with a keyboard shortcut:
  - `Ctrl+Shift+K` on Windows/Linux
  - `Command+Shift+K` on macOS
- Save run history and re-run or export previous results
- Tune system prompt, temperature, max tokens, default providers, and page-context behavior

## How It Works

1. Select text in Chrome.
2. Right-click and choose an Asaki action from the context menu.
3. Asaki opens the Chrome side panel.
4. The selected text becomes the query or draft prompt.
5. You choose either:
   - **Single Model** mode for one provider
   - **Orchestrated** mode for multiple providers
6. In orchestrated mode, Asaki queries all selected providers and then sends the collected responses to your chosen arbitrator model for a single synthesized answer.

## Supported Providers

Asaki currently supports:

- OpenAI
- Anthropic
- Google Gemini
- xAI / Grok

Provider access is managed through the extension settings, where users can enable providers, choose models, and validate API keys.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

This outputs the extension bundle to `dist/`.

### 3. Load it into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory

### 4. Configure provider keys

1. Open the Asaki extension
2. Go to **Settings / Options**
3. Add API keys for the providers you want to use
4. Choose your default mode, default providers, and consensus/arbitrator model

## Development

### Watch mode

```bash
npm run dev
```

This rebuilds the extension on file changes. Reload the extension in `chrome://extensions` after updates.

### Production build

```bash
npm run build
```

### Regenerate icons

```bash
npm run icons
```

## Project Structure

```text
src/
  background/   # service worker and orchestration logic
  content/      # page selection and highlighting
  panel/        # side panel UI
  options/      # settings UI
  lib/          # shared types, storage, provider logic, consensus helpers
static/icons/   # extension and provider icons
manifest.json   # Chrome extension manifest
vite.config.js  # build configuration
```

## Data and Privacy

- Provider settings and API keys are stored in `chrome.storage.sync`
- Query history is stored in `chrome.storage.local`
- Selected text is only sent to the providers involved in the active run
- Optional page context can be included when enabled in settings

## Why Asaki

Asaki is designed for users who want more than a single-model chat box. It helps you compare model behavior, test prompts quickly, and get a final synthesized answer without manually juggling tabs, copy/paste, or multiple AI apps.

## Tech Stack

- Chrome Extension Manifest V3
- TypeScript
- Svelte
- Vite
- rueter-ai

## Status

Asaki is currently a local-build Chrome extension project intended for rapid iteration and experimentation around AI-assisted reading, prompting, and multi-model orchestration.
