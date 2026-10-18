// Builds docs/index.html, the single self-contained file GitHub Pages serves,
// by inlining src/styles.css and the scripts in src/js into src/index.html.
// Run with: node build.mjs   (no dependencies needed)
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const scripts = ['stories.js', 'helpers.js', 'illustrations.js', 'app.js'].map((f) => read(`src/js/${f}`)).join('');

const html = read('src/index.html')
  .replace('@@STYLES@@\n', () => read('src/styles.css'))
  .replace('@@SCRIPTS@@\n', () => scripts);

writeFileSync(new URL('docs/index.html', import.meta.url), html);
console.log(`Built docs/index.html (${(html.length / 1024).toFixed(1)} KB)`);
