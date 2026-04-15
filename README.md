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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) (recommended) — or npm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/JAY2311111/Interview-Prep.git
cd Interview-Prep

# Install dependencies
pnpm install

# Start the development server
pnpm --filter @workspace/interview-prep run dev
```

The app will be available at **http://localhost:5173** (or the port Vite assigns).

### Build for production

```bash
pnpm --filter @workspace/interview-prep run build
```

The production-ready files will be in `artifacts/interview-prep/dist/`. You can serve them with any static file host (Netlify, Vercel, GitHub Pages, etc.).

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

All data lives in your browser's **IndexedDB** database. It includes:

- `users` — your profile (name, avatar)
- `groups` — top-level topic groups
- `categories` — sub-groups within a group
- `questions` — questions with answers, explanations, code examples, tags
- `settings` — theme and font preferences

**Nothing is ever sent to a server.**

### Backup & restore

Use the **Import / Export** page to download a full JSON snapshot of all your data. Import it on another device (or browser) to restore or merge your knowledge base.

---

## Deployment

Since this is a static single-page app, you can deploy it anywhere:

- **Vercel / Netlify** — connect the repo, set the build command to `pnpm --filter @workspace/interview-prep run build` and publish directory to `artifacts/interview-prep/dist`
- **GitHub Pages** — push the `dist` folder or use GitHub Actions
- **Any static host** — just upload the contents of `artifacts/interview-prep/dist/`

> Note: because all storage is browser-local (IndexedDB), each device/browser will have its own separate database. Use Import/Export to sync between devices.

---

## License

MIT — free to use, modify, and distribute.
