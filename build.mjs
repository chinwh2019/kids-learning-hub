// Builds docs/, the folder GitHub Pages serves:
// - docs/index.html, a single self-contained file: src/index.html with src/styles.css
//   and the scripts in src/js inlined, plus the STORIES list read from stories/*.md
// - the offline and install files: sw.js, manifest.webmanifest and the icons
// - docs/audio/, the recorded narration clips from audio/ (made by narrate.mjs) that still match the stories
// Run with: node build.mjs   (no dependencies needed)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadStories, storySpeech } from './src/stories.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const out = (p) => new URL(`docs/${p}`, import.meta.url);

/* ---------- Stories from Markdown (see src/stories.mjs) ---------- */
const STORIES = loadStories();

/* ---------- Recorded narration ---------- */
// A page uses its clip only while the clip's words still match the page; otherwise the app
// falls back to the phone's own voice until narrate.mjs records it again.
const NARR = {};
const narration = existsSync(new URL('audio/narration.json', import.meta.url)) ? JSON.parse(read('audio/narration.json')) : null;
let stale = 0;
rmSync(out('audio'), { recursive: true, force: true });
if (narration) {
  for (const st of STORIES) {
    NARR[st.id] = storySpeech(st).map((sp, i) => {
      const f = narration.stories[st.id]?.[i], clip = f && narration.clips[f];
      if (!clip || clip.text !== sp.text || !existsSync(new URL(`audio/${f}`, import.meta.url))) { stale++; return 0; }
      mkdirSync(out(`audio/${f.replace(/[^/]+$/, '')}`), { recursive: true });
      copyFileSync(new URL(`audio/${f}`, import.meta.url), out(`audio/${f}`));
      return { f, w: clip.words.flat() };
    });
  }
  if (stale) console.warn(`  ${stale} pages have no up-to-date narration clip; run node narrate.mjs to record them`);
}

/* ---------- docs/index.html ---------- */
const scripts = `/* ================= Stories (generated from stories/*.md by build.mjs) ================= */\nconst STORIES=${JSON.stringify(STORIES)};\nconst NARR=${JSON.stringify(NARR)};\n`
  + ['glossary.js', 'helpers.js', 'illustrations.js', 'fx.js', 'sky.js', 'shelf.js', 'speech.js', 'app.js'].map((f) => read(`src/js/${f}`)).join('');

const html = read('src/index.html')
  .replace('@@STYLES@@\n', () => read('src/styles.css'))
  .replace('@@SCRIPTS@@\n', () => scripts);

mkdirSync(out('icons'), { recursive: true });
writeFileSync(out('index.html'), html);

/* ---------- Offline and install files ---------- */
const icons = readdirSync(new URL('src/icons/', import.meta.url));
for (const f of icons) copyFileSync(new URL(`src/icons/${f}`, import.meta.url), out(`icons/${f}`));
const manifest = read('src/manifest.webmanifest');
writeFileSync(out('manifest.webmanifest'), manifest);
// The service worker's cache name changes whenever the app changes, so phones pick up new stories.
const version = createHash('sha256').update(html + manifest).digest('hex').slice(0, 10);
writeFileSync(out('sw.js'), read('src/sw.js')
  .replace('@@VERSION@@', version)
  .replace('@@FILES@@', JSON.stringify(['./', 'manifest.webmanifest', ...icons.map((f) => `icons/${f}`)])));

console.log(`Built docs/index.html (${(html.length / 1024).toFixed(1)} KB) with ${STORIES.length} stories: ${STORIES.map((s) => s.id).join(', ')}`);
