# Polite Mail

A Chrome extension that converts your text into polite, formal letter versions using AI.

## Features

- **Popup**: Paste text, click convert, copy the result
- **Right-click to replace**: Select text in any input field → right-click → "轉換成有禮貌書信" → confirm to replace in place
- **Multi-provider**: Supports Claude (Anthropic), OpenAI, and Gemini

## Supported AI Providers

| Provider | Model |
|----------|-------|
| Claude (Anthropic) | claude-haiku-4-5-20251001 |
| OpenAI | gpt-4o-mini |
| Gemini (Google) | gemini-2.5-flash |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

### 4. Set your API Key

Click the ⚙ gear icon in the popup → select your AI provider → enter your API key → save.

- **Claude**: [Anthropic Console](https://console.anthropic.com/settings/keys)
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey)

## Development

```bash
npm run dev     # dev server
npm run build   # production build
npx vitest run  # run tests
```

## Project Structure

```
src/
├── lib/
│   ├── api.ts          # AI provider calls (Claude / OpenAI / Gemini)
│   └── storage.ts      # chrome.storage.local helpers
├── popup/              # Popup UI (Preact)
├── options/            # Settings page (Preact)
├── background/         # Service worker — context menu + API orchestration
└── content/            # Content script — inline modal + text replacement
popup/index.html
options/index.html
manifest.json
```

## Tech Stack

- [Preact](https://preactjs.com/) + [Vite](https://vitejs.dev/)
- [vite-plugin-web-extension](https://github.com/aklinker1/vite-plugin-web-extension)
- TypeScript
- Vitest
