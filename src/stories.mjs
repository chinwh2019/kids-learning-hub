// Reads the stories in stories/*.md, shared by build.mjs and narrate.mjs.
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

// Each story is a Markdown file in stories/ that starts with a frontmatter block.
// The story text is used word for word. <!-- page: sceneKey --> comments mark where a
// new page starts and which picture it shows; add ", dua" to show the frontmatter dua there.
const TINTS = ['#56c7b4', '#f2b84b', '#f08f80', '#9d8cf0', '#6fb3ef'];
const SCENES = new Set([...read('src/js/illustrations.js').matchAll(/^ (\w+):u=>/gm)].map((m) => m[1]));
const LABEL = /^(?:##\s*(Lesson|Ask the kids)\s*$|\*\*(Lesson|Ask the kids):\*\*)/im;

function parseFrontmatter(src, file) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: missing the --- frontmatter block at the top`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1').trim();
  }
  return { meta, body: src.slice(m[0].length) };
}

const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.split('\n').map((l) => l.trim()).join('\n').trim()).filter(Boolean);
const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function parseStory(file, index) {
  const { meta, body } = parseFrontmatter(read(`stories/${file}`).replace(/\r\n/g, '\n'), file);
  const titleLine = body.match(/^#\s+(.+)$/m);
  if (!titleLine) throw new Error(`${file}: missing a "# Title" line`);
  const title = titleLine[1].replace(/[\s\p{Extended_Pictographic}️‍]+$/u, '');

  // Split the rest into the story, the lesson and the question for the kids.
  let rest = body.slice(titleLine.index + titleLine[0].length);
  const parts = { story: '' };
  let key = 'story', m;
  while ((m = rest.match(LABEL))) {
    parts[key] = rest.slice(0, m.index);
    key = (m[1] || m[2]).toLowerCase().startsWith('lesson') ? 'lesson' : 'ask';
    rest = rest.slice(m.index + m[0].length);
  }
  parts[key] = rest;
  for (const k of ['lesson', 'ask']) if (!parts[k]?.trim()) throw new Error(`${file}: missing the "${k === 'ask' ? 'Ask the kids' : 'Lesson'}" part`);

  // Pages: split at <!-- page: ... --> markers, or one page per paragraph when there are none.
  const MARK = /<!--\s*page:\s*([^>]*?)\s*-->/g;
  const pages = [];
  if (MARK.test(parts.story)) {
    const chunks = parts.story.split(MARK); // [before, marker, text, marker, text, ...]
    if (chunks[0].trim()) throw new Error(`${file}: story text before the first <!-- page --> marker`);
    for (let i = 1; i < chunks.length; i += 2) {
      const [scene, ...flags] = chunks[i].split(',').map((s) => s.trim());
      const page = { scene, text: paragraphs(chunks[i + 1]) };
      if (flags.includes('dua')) {
        if (!meta.dua) throw new Error(`${file}: a page asks for the dua but the frontmatter has no "dua"`);
        page.dua = { ar: meta.dua, ref: meta.dua_ref || '' };
      }
      pages.push(page);
    }
  } else {
    for (const text of paragraphs(parts.story)) pages.push({ scene: '', text: [text] });
  }
  for (const p of pages) {
    if (p.scene && !SCENES.has(p.scene)) console.warn(`  ${file}: no picture called "${p.scene}" yet, a starry night is shown instead`);
  }

  const source = meta.source || '';
  return {
    id: meta.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title,
    date: meta.date || file.slice(0, 10),
    theme: sentence(meta.theme || ''),
    tint: meta.tint || TINTS[index % TINTS.length],
    source: source.replace(/\s*\([^)]*\)\s*$/, ''),
    sourceLong: meta.source_note || (source.endsWith('.') ? source : source + '.'),
    value: { name: meta.value || sentence((meta.theme || 'Goodness').split(/\s+and\s+|,/)[0]), icon: meta.icon || '' },
    shelf: meta.shelf || meta.value || sentence((meta.theme || 'Goodness').split(/\s+and\s+|,/)[0]),
    cover: meta.cover || pages.find((p) => p.scene)?.scene || '',
    pages,
    lesson: paragraphs(parts.lesson).join(' '),
    ask: paragraphs(parts.ask).join(' '),
    mission: meta.mission || '',
    tip: meta.tip || 'Ask your child what they liked most about the story, and share what you liked too.',
  };
}

export function loadStories() {
  return readdirSync(new URL('stories/', ROOT))
    .filter((f) => f.endsWith('.md') && read(`stories/${f}`).startsWith('---'))
    .sort()
    .map(parseStory);
}

/* ---------- Spoken words ---------- */
// What each page of a story says aloud, worked out by the same code the app runs
// (src/js/speech.js), so recorded narration always matches the read-aloud text.
let speechKit;
export function storySpeech(story) {
  speechKit ??= vm.runInNewContext(['glossary.js', 'helpers-esc', 'speech.js']
    .map((f) => f === 'helpers-esc' ? read('src/js/helpers.js').match(/^const esc=.*$/m)[0] : read(`src/js/${f}`))
    .join('\n') + '\n({buildPages, pageSpeech})');
  return speechKit.buildPages(story).map((p) => speechKit.pageSpeech(story, p));
}

