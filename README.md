# Qissa Time

An illustrated bedtime storybook of Islamic stories for children and parents. Each story is a short book with animated scenes, page turns, read-aloud with word highlighting, tap-to-learn Arabic words, a lesson page that lights up a value star, a talk-time question for parents, and the dua before sleep.

## Run it

The whole app is one self-contained file: [`docs/index.html`](docs/index.html). Open it in a browser, or serve the repo with GitHub Pages from the `/docs` folder.

## Stories

The source text for each story lives in [`stories/`](stories) as Markdown with a small frontmatter block (`date`, `theme`, `source`). The app keeps this text word for word. Review notes are in [`stories/REVIEW.md`](stories/REVIEW.md).

| Story | Value | Source |
| --- | --- | --- |
| The man who helped a thirsty dog | Kindness | Sahih al-Bukhari and Sahih Muslim |
| Prophet Sulayman and the little ant | Gratitude | Quran, Surah An-Naml 27:17-19 |
| The honest men and the jar of gold | Honesty | Sahih al-Bukhari 3472, Sahih Muslim 1721 |

## Illustrations

All scenes are hand-built SVG inside `docs/index.html`. People are drawn without facial features, and prophets are never pictured.

## Adding a story

Add the Markdown file to `stories/`, then add an entry to the `STORIES` array in `docs/index.html` with its pages and a scene key for each page (scenes live in the `S` object).

## The previous Kids Learning Hub

The earlier React learning games (phonics, shapes, math) are kept on the [`archive/kids-learning-hub`](../../tree/archive/kids-learning-hub) branch.
