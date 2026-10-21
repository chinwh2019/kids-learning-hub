// Records narration for every page of every story with OpenAI's text-to-speech, and saves
// the clips in audio/ so they can be reused. Run it again after adding or changing a story:
// it only records pages whose words (or the voice settings below) changed, and removes
// clips nothing uses any more. Then run `node build.mjs` to put the clips in the app.
//
//   node narrate.mjs              record missing or changed clips
//   node narrate.mjs --samples    record one page in a few voices into audio/samples/ to compare
//   node narrate.mjs --dry-run    list what would be recorded, without calling OpenAI
//
// Needs Node 18 or newer and an OpenAI API key, either in the OPENAI_API_KEY environment
// variable or in a .env file next to this script (OPENAI_API_KEY=...). .env is git-ignored;
// never commit the key. ffmpeg is optional: when installed, clips are squeezed to small mono
// MP3s so the app stays light to download.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadStories, storySpeech } from './src/stories.mjs';

/* ---------- Voice settings (changing any of these re-records every clip) ---------- */
const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'coral';
const INSTRUCTIONS = `You are reading a bedtime story aloud to young Muslim children, aged about 3 to 8.
Voice: warm, gentle and loving, like a parent at the bedside. Never loud, scary or theatrical.
Pace: slow and unhurried. Pause softly at commas, a little longer at full stops, and longer between paragraphs.
Dialogue: give each character a slightly different, soft voice, but keep everything calm and cosy.
Pronunciation: say Arabic names, words and phrases the way an Arabic-speaking Muslim would, not as English words:
Allah (al-LAAH), Bismillah ir-Rahman ir-Raheem, Alhamdulillah, du'a (du-AA), Quran (qur-AAN), Sulayman (su-lay-MAAN),
Yunus (YOO-nus), Uwais (u-WAIS), Umar (OO-mar), Muhammad (mu-HAM-mad), Kufa (KOO-fa), Allahumma (al-laa-HUM-ma).
Read transliterated Arabic du'as such as "La ilaha illa anta, subhanaka, inni kuntu minaz-zalimin" and
"Bismika Allahumma amutu wa ahya" slowly and clearly, as Arabic.`;
// Spoken spellings for words the voice still says wrongly, used only for the recording
// (the words on the page never change). Keys are matched as whole words, ignoring case.
// Example: 'Uwais': 'Oo-wise'
const PRONOUNCE = {};
const SAMPLE_VOICES = ['coral', 'sage', 'fable', 'marin'];

const ROOT = new URL('./', import.meta.url);
const AUDIO = new URL('audio/', ROOT);
const MANIFEST = new URL('audio/narration.json', ROOT);
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

/* ---------- The API key ---------- */
function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const env = new URL('.env', ROOT);
  if (existsSync(env)) {
    const m = readFileSync(env, 'utf8').match(/^\s*(?:export\s+)?OPENAI_API_KEY\s*=\s*["']?([^"'\s#]+)/m);
    if (m) return m[1];
  }
  throw new Error('No OpenAI API key. Set OPENAI_API_KEY or put OPENAI_API_KEY=... in a .env file next to narrate.mjs.');
}

/* ---------- Words for the voice ---------- */
// Each page's words are split at spaces. The voice gets the same words, with PRONOUNCE
// spellings swapped in, and every spoken word remembers which page word it came from,
// so the app can light up the right word while the clip plays.
const words = (text) => [...text.matchAll(/\S+/g)].map((m) => ({ w: m[0], at: m.index }));
const pronounce = Object.entries(PRONOUNCE).map(([k, v]) => [new RegExp(`(?<![\\p{L}'])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu'), v]);
function forVoice(text) {
  const spoken = [];
  for (const [i, { w }] of words(text).entries()) {
    let say = w;
    for (const [re, v] of pronounce) say = say.replace(re, v);
    for (const part of say.split(/\s+/).filter(Boolean)) spoken.push({ w: part, of: i });
  }
  return spoken;
}
const clipHash = (input) => createHash('sha256').update([MODEL, VOICE, INSTRUCTIONS, input].join('\n')).digest('hex').slice(0, 10);

/* ---------- OpenAI calls ---------- */
async function call(path, init, tries = 4) {
  for (let n = 1; ; n++) {
    const res = await fetch(`https://api.openai.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${apiKey()}`, ...init.headers } });
    if (res.ok) return res;
    const body = await res.text();
    if (n >= tries || (res.status < 500 && res.status !== 429)) throw new Error(`OpenAI ${path} failed (${res.status}): ${body.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000 * 2 ** n));
  }
}
async function tts(input, voice = VOICE) {
  const res = await call('audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice, input, instructions: INSTRUCTIONS, response_format: 'mp3' }),
  });
  return Buffer.from(await res.arrayBuffer());
}
// Word timings come from transcribing the clip with Whisper, which reports when each word starts.
async function timings(mp3) {
  const form = new FormData();
  form.append('file', new Blob([mp3], { type: 'audio/mpeg' }), 'page.mp3');
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  const res = await call('audio/transcriptions', { method: 'POST', body: form });
  const j = await res.json();
  return { words: j.words || [], duration: j.duration || 0 };
}

/* ---------- Lining up heard words with page words ---------- */
const norm = (w) => w.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
function close(a, b) {
  if (!a || !b) return false;
  if (a === b || a.startsWith(b) || b.startsWith(a)) return true;
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length] <= Math.max(1, Math.floor(Math.max(a.length, b.length) / 3));
}
// Returns [characterOffset, seconds] for each page word: when the voice starts saying it.
function align(text, spoken, heard, duration) {
  const A = spoken.map((s) => norm(s.w)), B = heard.map((h) => norm(h.word));
  const n = A.length, m = B.length, cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  for (let i = 0; i <= n; i++) cost[i][0] = i;
  for (let j = 0; j <= m; j++) cost[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1, cost[i - 1][j - 1] + (close(A[i - 1], B[j - 1]) ? 0 : 1.5));
  const start = new Array(n).fill(null);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (cost[i][j] === cost[i - 1][j - 1] + (close(A[i - 1], B[j - 1]) ? 0 : 1.5)) { start[i - 1] = heard[j - 1].start; i--; j--; }
    else if (cost[i][j] === cost[i - 1][j] + 1) i--;
    else j--;
  }
  // Words the transcript missed get a time between their neighbours.
  // If the transcript barely matches (it sometimes drops most of a clip), share the time out by word length instead.
  const end = Math.max(duration - 0.4, heard.length ? heard[heard.length - 1].end : 0);
  if (start.filter((t) => t != null).length < n / 2) {
    const len = A.map((w) => w.length + 2), total = len.reduce((a, b) => a + b, 0), t0 = heard[0]?.start || 0.2;
    let acc = 0;
    for (let i = 0; i < n; i++) { start[i] = t0 + ((end - t0) * acc) / total; acc += len[i]; }
  }
  for (let i = 0; i < n; i++) if (start[i] == null) {
    const before = i ? start[i - 1] : 0;
    let k = i + 1; while (k < n && start[k] == null) k++;
    const after = k < n ? start[k] : end;
    for (let x = i; x < k; x++) start[x] = before + ((after - before) * (x - i + 1)) / (k - i + 1);
    i = k - 1;
  }
  const page = words(text), out = [];
  spoken.forEach((s, i) => { if (!out.length || out[out.length - 1].of !== s.of) out.push({ of: s.of, t: start[i] }) });
  let last = 0;
  return out.map(({ of, t }) => [page[of].at, +(last = Math.max(last, t)).toFixed(2)]);
}

/* ---------- Smaller files ---------- */
let hasFfmpeg;
function squeeze(mp3) {
  hasFfmpeg ??= (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true } catch { return false } })();
  if (!hasFfmpeg) return mp3;
  const a = join(tmpdir(), `qissa-${process.pid}-in.mp3`), b = join(tmpdir(), `qissa-${process.pid}-out.mp3`);
  writeFileSync(a, mp3);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', a, '-ac', '1', '-ar', '24000', '-b:a', '48k', b]);
  const small = readFileSync(b); rmSync(a); rmSync(b);
  return small;
}

/* ---------- Samples ---------- */
async function samples() {
  const yunus = loadStories().find((s) => s.id === 'yunus');
  const sp = storySpeech(yunus);
  const text = `${sp[0].text} ${sp.find((p) => p.text.includes('La ilaha')).text}`;
  mkdirSync(new URL('samples/', AUDIO), { recursive: true });
  for (const v of SAMPLE_VOICES) {
    process.stdout.write(`  sample: ${v}... `);
    if (!dryRun) writeFileSync(new URL(`samples/${v}.mp3`, AUDIO), await tts(forVoice(text).map((s) => s.w).join(' '), v));
    console.log('done');
  }
  console.log(`Listen to audio/samples/*.mp3, then set VOICE in narrate.mjs to the one you like.`);
}

/* ---------- Everything ---------- */
async function narrate() {
  const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { clips: {} };
  const pages = loadStories().flatMap((st) => storySpeech(st).map((sp, i) => {
    const spoken = forVoice(sp.text);
    return { story: st.id, i, text: sp.text, spoken, hash: clipHash(spoken.map((s) => s.w).join(' ')) };
  }));
  // A page said the same way in several stories (like the du'a before sleep) is recorded once, in audio/common/.
  const uses = {};
  for (const p of pages) uses[p.hash] = (uses[p.hash] || 0) + 1;
  const fileFor = (p) => (uses[p.hash] > 1 ? `common/${p.hash}.mp3` : `${p.story}/${String(p.i).padStart(2, '0')}-${p.hash}.mp3`);

  const clips = {}, stories = {};
  let made = 0, kept = 0, seconds = 0;
  for (const p of pages) {
    const file = fileFor(p);
    (stories[p.story] ||= [])[p.i] = file;
    if (clips[file]) continue;
    const prev = old.clips[file];
    if (prev && prev.hash === p.hash && existsSync(new URL(file, AUDIO))) { clips[file] = prev; kept++; continue; }
    console.log(`  recording ${file}: ${p.text.slice(0, 60)}${p.text.length > 60 ? '…' : ''}`);
    made++;
    if (dryRun) { clips[file] = {}; continue; }
    const raw = await tts(p.spoken.map((s) => s.w).join(' '));
    const { words: heard, duration } = await timings(raw);
    mkdirSync(new URL(file.replace(/[^/]+$/, ''), AUDIO), { recursive: true });
    writeFileSync(new URL(file, AUDIO), squeeze(raw));
    clips[file] = { hash: p.hash, text: p.text, words: align(p.text, p.spoken, heard, duration) };
    seconds += duration;
    // Save as we go, so a stopped run picks up where it left off.
    writeFileSync(MANIFEST, JSON.stringify({ model: MODEL, voice: VOICE, stories, clips: { ...old.clips, ...clips } }, null, 1));
  }
  if (dryRun) return console.log(`Would record ${made} clips (${kept} already up to date).`);

  writeFileSync(MANIFEST, JSON.stringify({ model: MODEL, voice: VOICE, stories, clips }, null, 1) + '\n');
  // Clean up clips no page uses any more.
  let removed = 0;
  for (const dir of readdirSync(AUDIO, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'samples')) {
    for (const f of readdirSync(new URL(`${dir.name}/`, AUDIO))) {
      if (f.endsWith('.mp3') && !clips[`${dir.name}/${f}`]) { rmSync(new URL(`${dir.name}/${f}`, AUDIO)); removed++; }
    }
    if (!readdirSync(new URL(`${dir.name}/`, AUDIO)).length) rmSync(new URL(`${dir.name}/`, AUDIO), { recursive: true });
  }
  const size = Object.keys(clips).reduce((a, f) => a + statSync(new URL(f, AUDIO)).size, 0);
  console.log(`Recorded ${made} clips${made ? ` (about ${Math.round(seconds / 60)} min)` : ''}, kept ${kept}, removed ${removed}. audio/ holds ${Object.keys(clips).length} clips, ${(size / 1048576).toFixed(1)} MB.`);
  console.log('Now run: node build.mjs');
}

if (!dryRun) mkdirSync(AUDIO, { recursive: true });
await (args.has('--samples') ? samples() : narrate());
