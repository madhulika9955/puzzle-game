# 🧩 PuzzleStrike

A daily puzzle game with streaks, heatmap activity tracking, and two arcade mini-games — built with React.

---

## 🚀 How to Run

### Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 16+ (18 recommended) | https://nodejs.org |
| **npm** | 8+ (comes with Node) | included with Node |

Check your versions:
```bash
node -v
npm -v
```

---

### 1. Install dependencies

Open a terminal inside the `puzzlestrike` folder and run:

```bash
npm install
```

This will install everything listed in `package.json` (~300MB, takes 1–2 minutes).

---

### 2. Start the development server

```bash
npm start
```

The app will automatically open at **http://localhost:3000** in your browser.

Hot-reload is enabled — any changes you save will instantly reflect in the browser.

---

### 3. Build for production

```bash
npm run build
```

This creates an optimized `/build` folder you can deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## 📦 Dependencies

All are installed automatically via `npm install`:

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI framework |
| `react-dom` | ^18.2.0 | DOM rendering |
| `react-scripts` | 5.0.1 | CRA build toolchain (webpack, babel, etc.) |

> No other third-party libraries needed. Everything else (fonts, animations, layout) is pure CSS-in-JS.

---

## 📁 Project Structure

```
puzzlestrike/
├── public/
│   └── index.html          # HTML shell
├── src/
│   ├── index.js            # React entry point
│   ├── index.css           # Base reset styles
│   └── App.jsx             # Entire application (all components)
├── package.json
├── .gitignore
└── README.md
```

---

## 🎮 Features

- **Login screen** — Google or Guest mode
- **Home dashboard** — streak hero, 7-day tracker, today's puzzle card
- **Daily puzzle** — 3 types: Math, Pattern, Word (crossword)
  - Deterministic seed (same puzzle for all users on same date)
  - Timer, hint system, score calculation
  - Completion animation + sync badge
- **Mini games**
  - 🔢 **Number Grid** — 4×4 Sudoku-lite (Easy / Medium / Hard)
  - 🔤 **Word Scramble** — Timed unscramble with streak counter
- **Stats page** — total solved, avg score, perfect runs, recent activity
- **Heatmap** — GitHub-style 365-day activity grid with tooltips
- **Offline-first** — in-memory store (swap with IndexedDB for production)
- **Bottom navigation** — Home, Play, Games, Stats, Activity

---

## 🔧 Customization

### Change starting streak / demo data
Edit the seed block in `src/App.jsx` around line 265:
```js
;(() => {
  const scores = [142, 98, 175, 110];
  // Change these 4 entries or add more days
})();
```

### Add more words to Word Scramble
Find the `WORDS` array in `App.jsx` and add entries:
```js
{ word: "GALAXY", hint: "A system of millions of stars" },
```

### Add more crossword clues
Find the `words` array inside `genCrossword()` and add:
```js
{ word: "BINARY", clue: "Base-2 number system" },
```

---

## 🌐 Deployment (Vercel — recommended)

1. Push project to GitHub
2. Go to https://vercel.com → New Project → Import repo
3. Framework: **Create React App** (auto-detected)
4. Click Deploy ✅

---

## 📝 Notes

- All data is stored **in-memory** (resets on page refresh). For persistence, replace the `store` object with an IndexedDB implementation using the `idb` library.
- Fonts load from Google Fonts CDN — internet required on first load.
- The app is fully **mobile responsive**.
