# InterviewPrep

A fully **offline, browser-based** personal knowledge base for software developers preparing for technical interviews.

All data is stored locally in your browser using IndexedDB — nothing is sent to any server. No account required, no internet dependency after the first load.

---

## Features

- **Groups → Categories → Questions** — hierarchical organisation of your knowledge
- **Full-text search** — search across question titles, short answers, and tags
- **Multi-filter** — filter by difficulty (Easy / Medium / Hard), tags, group, and category
- **Syntax-highlighted code blocks** — colourful, dark-themed code examples with a copy button
- **Markdown explanations** — rich formatting with headings, lists, tables, blockquotes, and inline code
- **Multiple code examples per question** — with individual language labels
- **Sticky reading experience** — title, metadata, and tabs remain visible while scrolling
- **User-controllable pagination** — choose 5 / 10 / 20 / 50 questions per page
- **Import / Export as JSON** — back up your data or move it to another device (merge or replace)
- **Theme customisation** — Light / Dark / System theme, font family, and font size
- **Collapsible sidebar** — more reading space when you need it, with tooltip hints when collapsed
- **100% offline** — all data persisted in IndexedDB via Dexie.js

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Local database | Dexie.js (IndexedDB wrapper) |
| Markdown rendering | react-markdown + remark-gfm |
| Syntax highlighting | highlight.js |
| Routing | wouter |
| Forms | react-hook-form + zod |

---

## Running Locally (Windows, Mac, Linux)

### Step 1 — Install Node.js

Download and install **Node.js v22** (LTS) from https://nodejs.org/

> Node.js 20.19+ or 22.12+ is required. If you have an older version, download the latest LTS from the link above.

To check your current version: `node --version`

### Step 2 — Install pnpm

Open a terminal (Command Prompt or PowerShell on Windows) and run:

```
npm install -g pnpm
```

### Step 3 — Clone and install

```
git clone https://github.com/JAY2311111/Interview-Prep.git
cd Interview-Prep
pnpm install
```

### Step 4 — Start the app

```
pnpm --filter @workspace/interview-prep run dev
```

The app opens at **http://localhost:5173** — just visit that URL in your browser.

---

## Build for Production

```
pnpm --filter @workspace/interview-prep run build
```

Output goes to `artifacts/interview-prep/dist/public/`. You can upload that folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## Project Structure

```
artifacts/interview-prep/src/
├── components/
│   ├── AppShell.tsx          # Collapsible sidebar + layout wrapper
│   ├── CodeBlock.tsx         # Syntax-highlighted code block
│   └── ui/                   # shadcn/ui component library
├── context/
│   ├── ThemeContext.tsx       # Theme + font preferences
│   └── UserContext.tsx        # Local user profile state
├── lib/
│   ├── db.ts                 # Dexie.js IndexedDB schema & TypeScript types
│   ├── importExport.ts       # JSON export / import logic
│   └── utils.ts              # Shared utilities
├── pages/
│   ├── dashboard.tsx         # Home — stats, difficulty breakdown, recent questions
│   ├── groups.tsx            # Manage Groups and their Categories
│   ├── import-export.tsx     # Export / Import JSON backup
│   ├── question-detail.tsx   # View a question (answer, explanation, code)
│   ├── question-form.tsx     # Create / edit a question
│   ├── questions.tsx         # Searchable, filterable question list
│   ├── settings.tsx          # Theme and profile settings
│   └── tags.tsx              # Browse all tags
├── store/
│   └── useStore.ts           # Data hooks (useGroups, useCategories, useQuestions, useSettings)
├── App.tsx                   # Router, providers
└── index.css                 # Global styles, theme variables, highlight.js token colours
```

---

## Data Storage

All data lives in your browser's **IndexedDB** database. Nothing is ever sent to a server.

Use the **Import / Export** page to back up your data as a JSON file or restore it on another device.

---

## License

MIT — free to use, modify, and distribute.
