# Qissa Time

An illustrated bedtime storybook of Islamic stories for children and parents. Each story is a short book with animated scenes, gentle nature sounds, page turns, read-aloud with word highlighting, tap-to-learn Arabic words, a lesson page that lights up a value star, a talk-time question for parents, and the dua before sleep.

## Run it

The built app is one self-contained file: [`docs/index.html`](docs/index.html). Open it in a browser, or serve the repo with GitHub Pages from the `/docs` folder.

Served over HTTPS (as on GitHub Pages), the app also works offline and can be added to a phone's home screen. A service worker saves the page, its fonts and icons after the first visit. On Android and desktop Chrome an "Add to home screen" button appears in the top bar; on iPhone and iPad it shows how to do it from the Share menu.

## Source code

Edit the files in `src/`, then rebuild `docs/index.html`:

```sh
node build.mjs    # or: npm run build
```

The build needs only Node 18 or newer, with no packages to install. It reads the stories from `stories/*.md`, inlines them with the CSS and scripts into `src/index.html`, and writes the offline files (`sw.js`, `manifest.webmanifest`, `icons/`) next to it. Commit the rebuilt `docs/` folder together with your source changes.

| File | What it holds |
| --- | --- |
| `src/index.html` | Page markup: hero, bookshelf, value stars, reader. `@@STYLES@@` and `@@SCRIPTS@@` mark where the build inlines the rest. |
| `src/styles.css` | Colour tokens for dark and light themes, layout, page-turn animations. |
| `src/js/glossary.js` | The glossary of Arabic words (`GLOSS`) shown when a dotted word is tapped. |
| `src/js/helpers.js` | Small utilities and saved reading progress. |
| `src/js/illustrations.js` | The SVG drawing kit (people, dog, ants, camels, well, jar, Yemeni tower houses, lanterns and more) and every scene in `S`. |
| `src/js/fx.js` | Soft nature sounds made in the browser (paper, water drops, wind, birds, crickets; no music or sound files), the soundscape for each scene, sparkle bursts, the book-opening zoom and the tilting cards. |
| `src/js/sky.js` | Kindness missions and the sky of good deeds on the home page. |
| `src/js/shelf.js` | Bookshelf rows (not read yet, one row per shelf, read again), the slow left-to-right drift, and the Surprise me button. |
| `src/js/app.js` | Read-along text, bookshelf, book reader, read-aloud, glossary pop-up, the starry hero sky and the add-to-home-screen button. |
| `src/sw.js` | The service worker that keeps the app working offline. The build fills in its version, so every rebuild refreshes phones. |
| `src/manifest.webmanifest`, `src/icons/` | App name, colours and icons used when the app is added to a home screen. |

## Stories

The source text for each story lives in [`stories/`](stories) as Markdown with a small frontmatter block (`date`, `theme`, `source`). The app keeps this text word for word. Review notes are in [`stories/REVIEW.md`](stories/REVIEW.md).

| Story | Value | Source |
| --- | --- | --- |
| The man who helped a thirsty dog | Kindness | Sahih al-Bukhari and Sahih Muslim |
| Prophet Sulayman and the little ant | Gratitude | Quran, Surah An-Naml 27:17-19 |
| The honest men and the jar of gold | Honesty | Sahih al-Bukhari 3472, Sahih Muslim 1721 |
| Uwais and his mother | Care for parents | Sahih Muslim 2542 |

## Illustrations

All scenes are hand-built SVG, drawn in code in `src/js/illustrations.js`. People are drawn without facial features, and prophets are never pictured.

## Adding a story

Drop a new Markdown file into `stories/` and run `node build.mjs`. No code changes are needed. Files are shown in name order, so start the name with the date.

```markdown
---
date: 2026-10-19
theme: patience
source: Sahih al-Bukhari 1234
value: Patience
tip: Talk about one time you had to wait for something good.
mission: Wait for your turn tomorrow without complaining, even once.
---
# The title of the story

<!-- page: night -->
The first page of the story.

<!-- page: night -->
The second page.

**Lesson:** What the story teaches.

**Ask the kids:** A question to talk about.
```

- `<!-- page: sceneKey -->` starts a new page and picks its picture from the scenes in `src/js/illustrations.js`. A marker can also sit in the middle of a paragraph. Without any markers, each paragraph becomes its own page. A page with no picture yet, or a picture name that is not drawn, shows a starry night.
- `## Lesson` and `## Ask the kids` headings work too.
- `shelf` is the bookshelf row the book sits on, such as `Kindness and gentleness` (default: the value). Books that share a shelf name share a row. Rows with three or more books drift slowly from left to right; touching or swiping a row stops it for a moment.
- `value` (the star the story lights up, default: the first word of the theme) and `tip` (the tip for parents) are optional.
- `mission` is one small thing to do tomorrow. It gets its own page after Talk time; the child accepts it there, and when it is done a grown-up holds the star on the home page to light it in the sky of good deeds. Leave it out and the book has no mission page.
- More optional frontmatter: `id`, `icon` (`paw`, `ant`, `jar` or `hands`; anything else shows a heart), `tint` (cover colour), `cover` (scene for the cover), `source_note` (longer source line for the cover), `dua` and `dua_ref` (Arabic shown on a page marked `<!-- page: sceneKey, dua -->`).
- The HTML comments are invisible when the Markdown is read anywhere else, so the story text stays exactly as written.

To give a story its own pictures, draw new scenes in `S` in `src/js/illustrations.js` and name them in the page markers.

## The previous Kids Learning Hub

The earlier React learning games (phonics, shapes, math) are kept on the [`archive/kids-learning-hub`](../../tree/archive/kids-learning-hub) branch.
