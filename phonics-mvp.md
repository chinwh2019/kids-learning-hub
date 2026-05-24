Yes. Build it as a **static React + TypeScript + Vite app**: perfect for GitHub Pages because Vite builds to static files, and GitHub Pages can deploy via GitHub Actions. Vite’s official docs note that for repo pages you must set `base: '/<REPO>/'` and use GitHub Actions because Vite needs a build step. ([vitejs][1])

## Product concept: “Phonics Quest”

A child becomes a “sound explorer” who unlocks islands by mastering sounds.

Core loop:

1. **Hear sound**
2. **Touch / drag tiles**
3. **Blend into word**
4. **Read word**
5. **Spell from audio**
6. **Earn tiny reward**
7. **Review later with spaced repetition**

Avoid making it a flashcard app. Make it a **tile-based phonics playground** with review built in.

---

## Recommended tech stack

Use:

```bash
pnpm create vite phonics-quest --template react-ts
cd phonics-quest
pnpm install
pnpm add zustand framer-motion @dnd-kit/core @dnd-kit/sortable lucide-react
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

Stack:

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Framework | React + TypeScript                       |
| Build     | Vite                                     |
| Hosting   | GitHub Pages                             |
| State     | Zustand                                  |
| Drag/drop | dnd-kit                                  |
| Animation | Framer Motion                            |
| Audio     | Web Speech API + optional recorded files |
| Storage   | localStorage first, IndexedDB later      |
| Styling   | Tailwind CSS                             |
| Tests     | Vitest                                   |

---

## App structure

```txt
src/
  app/
    App.tsx
    routes.tsx
  curriculum/
    phonemes.ts
    waves.ts
    words.ts
    decodableStories.ts
  components/
    SoundTile.tsx
    TileBoard.tsx
    ProgressMap.tsx
    RewardBurst.tsx
    AudioButton.tsx
  games/
    SoundMatchGame.tsx
    BlendBuilderGame.tsx
    WordSwapGame.tsx
    AudioSpellingGame.tsx
    DecodableReader.tsx
  srs/
    scheduler.ts
    reviewQueue.ts
  store/
    learnerStore.ts
  utils/
    speech.ts
    haptics.ts
    analytics.ts
```

---

## Curriculum model

Use a structured, explicit progression.

```ts
export type TileType = "consonant" | "vowel" | "digraph" | "magic-e";

export type Phoneme = {
  id: string;
  grapheme: string;
  sound: string;
  tileType: TileType;
  exampleWord: string;
  color: "blue" | "red" | "green" | "purple";
};

export const phonemes: Phoneme[] = [
  { id: "m", grapheme: "m", sound: "/mmm/", tileType: "consonant", exampleWord: "mat", color: "blue" },
  { id: "a", grapheme: "a", sound: "/ă/", tileType: "vowel", exampleWord: "cat", color: "red" },
  { id: "s", grapheme: "s", sound: "/sss/", tileType: "consonant", exampleWord: "sat", color: "blue" },
  { id: "sh", grapheme: "sh", sound: "/sh/", tileType: "digraph", exampleWord: "ship", color: "green" },
];
```

Words:

```ts
export type WordItem = {
  id: string;
  text: string;
  phonemes: string[];
  wave: number;
  imageEmoji?: string;
  decodable: boolean;
};

export const words: WordItem[] = [
  { id: "cat", text: "cat", phonemes: ["c", "a", "t"], wave: 1, imageEmoji: "🐱", decodable: true },
  { id: "mat", text: "mat", phonemes: ["m", "a", "t"], wave: 1, imageEmoji: "🟫", decodable: true },
  { id: "hop", text: "hop", phonemes: ["h", "o", "p"], wave: 2, imageEmoji: "🐇", decodable: true },
  { id: "ship", text: "ship", phonemes: ["sh", "i", "p"], wave: 4, imageEmoji: "🚢", decodable: true },
];
```

---

## Main learning modes

### 1. Sound Garden

Goal: learn individual grapheme-sound mappings.

Child taps a tile:

```txt
m → says /mmm/ → shows “mmm like mat”
```

Interaction:

* tap tile
* hear sound
* trace letter with finger/mouse
* choose matching sound from 2–3 options

Do **not** overuse pictures here. Pictures support meaning, but the letter-sound link is primary.

---

### 2. Blend Builder

This is the core.

UI:

```txt
[ c ] [ a ] [ t ]

Touch each tile:
 /k/   /a/   /t/

Slide rocket under word:
 cccaaaatt → cat
```

Engineering:

* drag finger across tiles
* trigger phoneme audio as pointer crosses each tile
* final animation blends into whole word

---

### 3. Word Swap Lab

This teaches phonemic manipulation.

```txt
cat → mat → sat → rat
```

Child swaps first, middle, or final sound.

Prompt:

```txt
Change cat into mat.
Which tile should change?
```

This is extremely valuable because it teaches that words are made of sound units.

---

### 4. Audio Spelling

Encoding mode.

Prompt:

```txt
🔊 “Spell hop”
```

Child drags:

```txt
h + o + p
```

Feedback should be gentle:

```txt
Almost! Listen again: /h/ /o/ /p/.
Which sound comes first?
```

Never show “WRONG” dramatically.

---

### 5. Decodable Story Mode

After Wave 1, unlock tiny stories.

Example:

```txt
Sam sat.
Sam had a mat.
The cat sat.
```

Rules:

* only use taught phonics patterns
* highlight each word as it is read
* tap a word to break it into tiles
* child can reread for fluency stars

This is essential. Games alone are not enough.

---

## Spaced repetition system

Do not copy Anki exactly for kids. Use a softer scheduler.

```ts
export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ReviewItem = {
  id: string;
  type: "sound" | "word" | "spelling";
  targetId: string;
  mastery: MasteryLevel;
  dueAt: number;
  intervalDays: number;
  ease: number;
};
```

Simple child-safe scheduler:

```ts
export function scheduleReview(
  item: ReviewItem,
  result: "again" | "good" | "easy"
): ReviewItem {
  const now = Date.now();

  if (result === "again") {
    return {
      ...item,
      mastery: Math.max(0, item.mastery - 1) as MasteryLevel,
      intervalDays: 0,
      dueAt: now + 10 * 60 * 1000,
    };
  }

  const nextInterval =
    result === "easy"
      ? Math.max(1, Math.round(item.intervalDays * 2.5 || 2))
      : Math.max(1, Math.round(item.intervalDays * 1.7 || 1));

  return {
    ...item,
    mastery: Math.min(5, item.mastery + 1) as MasteryLevel,
    intervalDays: nextInterval,
    dueAt: now + nextInterval * 24 * 60 * 60 * 1000,
  };
}
```

Daily review limit:

```ts
const MAX_DAILY_REVIEWS = 15;
const MAX_NEW_ITEMS = 4;
```

For a 6-year-old, this matters more than “efficiency.”

---

## UX principles for children

Use:

* large buttons
* no dense menus
* no long text instructions
* audio-first prompts
* immediate tactile feedback
* short sessions
* visible progress map
* funny micro-animations
* no punishment loops

Avoid:

* streak pressure
* failure screens
* competitive ranking
* too many cards
* distracting background music during phoneme tasks
* picture guessing

---

## Component example: SoundTile

```tsx
type SoundTileProps = {
  grapheme: string;
  color: "blue" | "red" | "green" | "purple";
  selected?: boolean;
  onClick?: () => void;
};

const colorMap = {
  blue: "bg-blue-100 border-blue-400 text-blue-900",
  red: "bg-red-100 border-red-400 text-red-900",
  green: "bg-green-100 border-green-400 text-green-900",
  purple: "bg-purple-100 border-purple-400 text-purple-900",
};

export function SoundTile({ grapheme, color, selected, onClick }: SoundTileProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-20 w-20 rounded-2xl border-4 text-4xl font-bold shadow-sm",
        "transition active:scale-95",
        colorMap[color],
        selected ? "ring-4 ring-yellow-300" : "",
      ].join(" ")}
      aria-label={`Sound tile ${grapheme}`}
    >
      {grapheme}
    </button>
  );
}
```

---

## Game example: Blend Builder

```tsx
import { motion } from "framer-motion";
import { SoundTile } from "../components/SoundTile";
import { speak } from "../utils/speech";

type BlendBuilderProps = {
  word: {
    text: string;
    phonemes: { grapheme: string; sound: string; color: "blue" | "red" | "green" | "purple" }[];
  };
};

export function BlendBuilderGame({ word }: BlendBuilderProps) {
  const playSounds = async () => {
    for (const p of word.phonemes) {
      speak(p.sound);
      await new Promise((r) => setTimeout(r, 500));
    }

    await new Promise((r) => setTimeout(r, 300));
    speak(word.text);
  };

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-8 p-6">
      <h1 className="text-3xl font-bold">Slide the sounds together</h1>

      <div className="flex gap-3">
        {word.phonemes.map((p) => (
          <SoundTile
            key={p.grapheme}
            grapheme={p.grapheme}
            color={p.color}
            onClick={() => speak(p.sound)}
          />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={playSounds}
        className="rounded-full bg-yellow-300 px-8 py-4 text-2xl font-bold shadow"
      >
        🚀 Blend!
      </motion.button>

      <div className="text-5xl font-black">{word.text}</div>
    </section>
  );
}
```

---

## Speech utility

For MVP, use browser speech synthesis:

```ts
export function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.75;
  utterance.pitch = 1.1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
```

Later, replace phoneme sounds with real recorded audio. Browser TTS is not reliable for pure phonemes like `/b/`, `/t/`, `/sh/`.

Best production approach:

```txt
public/audio/phonemes/m.mp3
public/audio/phonemes/a-short.mp3
public/audio/words/cat.mp3
```

---

## Zustand learner store

```ts
import { create } from "zustand";

type LearnerState = {
  currentWave: number;
  stars: number;
  completedWords: Record<string, number>;
  completeWord: (wordId: string) => void;
  unlockWave: (wave: number) => void;
};

export const useLearnerStore = create<LearnerState>((set) => ({
  currentWave: 1,
  stars: 0,
  completedWords: {},
  completeWord: (wordId) =>
    set((state) => ({
      stars: state.stars + 1,
      completedWords: {
        ...state.completedWords,
        [wordId]: (state.completedWords[wordId] ?? 0) + 1,
      },
    })),
  unlockWave: (wave) => set({ currentWave: wave }),
}));
```

Persist later with Zustand middleware or localStorage.

---

## Progress map

World map structure:

```txt
Island 1: Short a
Island 2: Short i / o
Island 3: Short e / u
Island 4: Blends
Island 5: Digraphs
Island 6: Magic e
Island 7: Heart words
```

Each island has:

```ts
type Island = {
  id: string;
  title: string;
  wave: number;
  requiredMastery: number;
  games: GameType[];
};
```

---

## GitHub Pages setup

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/phonics-quest/",
});
```

GitHub Actions workflow:

```yaml
name: Deploy static site to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: "pnpm"
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v4
        with:
          path: "./dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

In GitHub:

```txt
Settings → Pages → Source → GitHub Actions
```

---

## MVP build order

### Phase 1: Learning engine

Build:

* curriculum data
* tile component
* sound playback
* Blend Builder
* Word Swap
* local progress

### Phase 2: Kid engagement

Add:

* world map
* stars
* character guide
* unlock animations
* reward stickers

### Phase 3: Reading transfer

Add:

* decodable stories
* tap-to-decode words
* reread fluency mode

### Phase 4: Parent dashboard

Add:

* sounds mastered
* words mastered
* review due today
* suggested physical tile activity

### Phase 5: Better audio

Add:

* recorded phoneme audio
* parent voice recording
* word-level audio prompts

---

## The “world-class” product insight

The app should not replace the parent/teacher. It should create a **10-minute ritual**:

```txt
3 min: sound game
5 min: tile/blending game
2 min: review
optional: read tiny story together
```

The child should feel:

```txt
“I am playing with sounds.”
```

The parent should feel:

```txt
“I know exactly what to teach today.”
```

That’s the real product.

[1]: https://vite.dev/guide/static-deploy?utm_source=chatgpt.com "Deploying a Static Site | Vite"
