# LLM PDF View

LLM PDF View is a production-quality Chrome and Edge browser extension that transforms chat conversations from ChatGPT, Claude, Gemini, and Perplexity into a clean, theme-customizable, and print-ready document reader experience.

## Key Features

1. **Site-Specific Adapter Registry**: Custom DOM query selectors identify and isolate user messages and model replies on ChatGPT, Claude, Gemini, and Perplexity.
2. **Dynamic HTML-to-Markdown Scraper**: Parses dynamic HTML text turns (including lists, headings, inline code blocks, code snippets, and structural tables) and translates them back into clean Markdown.
3. **Isolated Shadow DOM**: Mounts the document reader overlay inside an open Shadow DOM container to prevent host-site styles (such as ChatGPT's Tailwind stylesheets) from polluting the reader's typography.
4. **Theme Switcher**: Instant rendering for **Light**, **Dark**, and **Sepia** document views, matching system preferences by default.
5. **Multi-Page A4 PDF Generator**: Captures the sheet element as a high-resolution canvas layout (scale: 2) and formats it into a multi-page PDF document.
6. **Esc Key Control**: Exit Reader Mode instantly by pressing the `Esc` key.

---

## Project Structure

```
llmpdfview/
├── dist/                          # Compiled extension files (built by npm run build)
├── public/
│   └── manifest.json              # Manifest V3 Extension Config
├── src/
│   ├── adapters/
│   │   ├── ChatGPTAdapter.ts      # ChatGPT scraper
│   │   ├── ClaudeAdapter.ts        # Claude scraper
│   │   ├── GeminiAdapter.ts        # Gemini scraper
│   │   ├── PerplexityAdapter.ts    # Perplexity scraper
│   │   ├── index.ts                # Site Adapter Registry
│   │   └── utils.ts                # DOM HTML-to-Markdown Converter
│   ├── components/
│   │   ├── MarkdownRenderer.tsx   # ReactMarkdown, GFM, and PrismJS highlighter
│   │   ├── ReaderOverlay.tsx      # Main full-screen overlay component
│   │   └── Toolbar.tsx            # Theme selection, export, and close actions
│   ├── content/
│   │   ├── content.tsx            # Floating trigger & Shadow DOM portal
│   │   └── styles.css             # Main reader UI stylesheet
│   ├── popup/
│   │   ├── Popup.tsx              # Action Popup compatibility checker
│   │   └── popup.css              # Action popup styling
│   ├── services/
│   │   └── pdfExport.ts           # Canvas capturing & PDF packing service
│   ├── styles/
│   │   └── themes.css             # CSS Theme variables (Light, Dark, Sepia)
│   ├── types/
│   │   └── index.ts               # Core TypeScript interfaces
│   ├── App.tsx                    # Directs main to Popup
│   ├── index.css                  # Simple reset styles
│   └── main.tsx                   # Main React entry for Popup
├── index.html                     # Popup entry page
├── package.json                   # Scripts & Dependencies (React 19, Vite 8)
├── tsconfig.json                  # TS configuration
├── vite.config.ts                 # Main Vite config (Popup compilation)
└── vite.content.config.ts         # Secondary Vite config (Content script library compile)
```

---

## Installation & Setup

### 1. Install Dependencies
Clone the repository and run:
```bash
npm install --ignore-scripts
```

### 2. Build the Extension
To bundle the Popup panel and the content script bundle, execute:
```bash
npm run build
```
This outputs all unpacked resources into the `dist/` directory.

### 3. Load the Extension in Chrome / Edge
1. Open Google Chrome or Microsoft Edge.
2. Navigate to the Extensions management page: `chrome://extensions/`
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist`** folder located inside your local project directory.

---

## CI/CD Workflow
The project includes a GitHub Actions workflow in `.github/workflows/build.yml` that automates testing, building, and packaging on every push. 

The workflow:
1. Performs lint checks (`npm run lint`).
2. Type-checks and builds the extension files (`npm run build`).
3. Compresses the output into a single archive (`llmpdfview-extension.zip`).
4. Uploads the zip archive as a workflow artifact, ready for direct distribution or Web Store upload.
