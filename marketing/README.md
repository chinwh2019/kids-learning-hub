# Marketing resources

Launch material for the Qissa Time Instagram and Threads accounts. Nothing here is part of the app.

- `posts.md` has handle ideas, two bios, the first 9 Instagram posts (captions, hashtags, slide and Reel plans) and 6 Threads posts. Replace `[APP LINK]` once the app's link is final.
- `carousels/<story-id>/` holds one Instagram carousel per story at 1080x1350 (4:5): a cover, one slide per page, then a lesson slide.
- `profile.png` is the profile picture (1080x1080).
- `render-carousels.cjs` regenerates the images from the built app. Run `node build.mjs`, then `node marketing/render-carousels.cjs`, or pass `dog`, `ant`, `gold` or `profile` to render just one. It needs Playwright with Chromium.

Notes:
- Re-render the carousels whenever a story's text changes, so the slides match the app.
- The Arabic on the slides uses Noto Naskh Arabic, because Amiri from Google Fonts placed the vowel marks wrongly in headless Chromium.
- Check the intro caption in `posts.md` ("Most nights at our house…") and edit it so it describes your own family.
