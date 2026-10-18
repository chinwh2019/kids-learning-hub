# Qissa Time

An illustrated bedtime storybook of Islamic stories for children and parents. Each story is a short book with animated scenes, page turns, read-aloud with word highlighting, tap-to-learn Arabic words, a lesson page that lights up a value star, a talk-time question for parents, and the dua before sleep.

## Run it

The built app is one self-contained file: [`docs/index.html`](docs/index.html). Open it in a browser, or serve the repo with GitHub Pages from the `/docs` folder.

## Source code

Edit the files in `src/`, then rebuild `docs/index.html`:

```sh
node build.mjs    # or: npm run build
```

The build needs only Node 18 or newer, with no packages to install. It inlines the CSS and scripts into `src/index.html`, so the result still works offline as a single file. Commit the rebuilt `docs/index.html` together with your source changes.

| File | What it holds |
| --- | --- |
| `src/index.html` | Page markup: hero, bookshelf, value stars, reader. `@@STYLES@@` and `@@SCRIPTS@@` mark where the build inlines the rest. |
| `src/styles.css` | Colour tokens for dark and light themes, layout, page-turn animations. |
| `src/js/stories.js` | The story text (`STORIES`), split into pages, plus the glossary of Arabic words (`GLOSS`). |
| `src/js/helpers.js` | Small utilities and saved reading progress. |
| `src/js/illustrations.js` | The SVG drawing kit (people, dog, ants, well, jar, lanterns and more) and every scene in `S`. |
| `src/js/app.js` | Read-along text, bookshelf, book reader, read-aloud, glossary pop-up and the starry hero sky. |

## Stories

The source text for each story lives in [`stories/`](stories) as Markdown with a small frontmatter block (`date`, `theme`, `source`). The app keeps this text word for word. Review notes are in [`stories/REVIEW.md`](stories/REVIEW.md).

| Story | Value | Source |
| --- | --- | --- |
| The man who helped a thirsty dog | Kindness | Sahih al-Bukhari and Sahih Muslim |
| Prophet Sulayman and the little ant | Gratitude | Quran, Surah An-Naml 27:17-19 |
| The honest men and the jar of gold | Honesty | Sahih al-Bukhari 3472, Sahih Muslim 1721 |

## Illustrations

All scenes are hand-built SVG, drawn in code in `src/js/illustrations.js`. People are drawn without facial features, and prophets are never pictured.

## Adding a story

Add the Markdown file to `stories/`, add an entry to `STORIES` in `src/js/stories.js` with its pages and a scene key for each page, draw any new scenes in `S` in `src/js/illustrations.js`, then run the build.

## The previous Kids Learning Hub

The earlier React learning games (phonics, shapes, math) are kept on the [`archive/kids-learning-hub`](../../tree/archive/kids-learning-hub) branch.
