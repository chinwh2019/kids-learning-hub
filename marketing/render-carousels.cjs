// Renders the Instagram carousel slides (1080x1350) and profile picture from the built app.
// Run `node build.mjs` first, then `node marketing/render-carousels.cjs [dog|ant|gold|profile]`.
// Needs Playwright with Chromium (npm i -g playwright).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = 'file://' + path.resolve(__dirname, '../docs/index.html');
const OUT = __dirname;
const ONLY = process.argv[2]; // optional story id

const CSS = `
#slide{position:fixed;inset:0;width:1080px;height:1350px;z-index:99999;overflow:hidden;
  background:radial-gradient(140% 100% at 100% 0%,var(--paper),var(--paper-2));color:var(--paper-ink);
  font-family:var(--body);display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
#slide,#slide *{transition:none!important;animation:none!important}
#slide .sc{width:1080px;height:810px;flex:none;position:relative;overflow:hidden}
#slide .sc svg{width:1080px;height:810px;display:block}
#slide .txt{flex:1;min-height:0;position:relative;padding:40px 64px 46px;display:flex;flex-direction:column;justify-content:center;gap:var(--gap,22px);
  font-size:var(--fs,44px);line-height:1.45}
#slide .txt p{margin:0}
#slide .saw{font-family:var(--arabic);font-size:1.15em;line-height:1;color:var(--gold-2)}
#slide .said{color:color-mix(in srgb,var(--paper-ink) 70%,var(--gold))}
#slide .g{border:0;background:none;padding:0;font:inherit;color:inherit;line-height:inherit;cursor:default}
#slide .paras{display:flex;flex-direction:column;gap:.5em}
#slide .first p:first-of-type::first-letter{font-family:var(--display);float:left;font-size:2.7em;line-height:.9;padding:6px 14px 0 0;color:var(--gold)}
#slide .ar{font-family:var(--arabic);direction:rtl;font-size:1.22em;line-height:1.75;color:var(--gold)}
#slide .callout{border-left:5px solid var(--gold);padding:4px 0 4px 26px;display:flex;flex-direction:column;gap:2px}
#slide .ref{font-size:.7em;color:var(--paper-muted)}
#slide .pg{position:absolute;right:30px;bottom:16px;font-size:24px;color:var(--paper-muted);letter-spacing:.06em}
#slide .orn{position:absolute;width:110px;height:110px;color:var(--gold);opacity:.6}
#slide .orn.tl{top:18px;left:18px}#slide .orn.br{bottom:18px;right:18px;transform:rotate(180deg)}
#slide .brandbar{height:120px;flex:none;display:flex;align-items:center;justify-content:center;gap:18px;font-family:var(--display);font-size:46px;color:var(--ink);background:var(--night)}
#slide .brandbar svg{width:66px;height:66px}
#slide .brandbar .qa{font-family:var(--arabic);color:var(--gold);font-size:46px;line-height:1;margin-left:4px}
#slide .chip{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;border-radius:999px;padding:8px 26px 8px 10px;font-size:32px;font-weight:700;
  background:color-mix(in srgb,var(--tint) 22%,transparent);border:2px solid color-mix(in srgb,var(--tint) 65%,transparent);color:var(--paper-ink)}
#slide .chip svg{width:50px;height:50px}
#slide h1{font-family:var(--display);font-weight:400;font-size:var(--hs,74px);line-height:1.1;margin:0;text-wrap:balance;color:var(--paper-ink)}
#slide .src{font-size:28px;color:var(--paper-muted)}
#slide .eyebrow{font-size:30px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);font-weight:700;font-family:var(--body)}
#slide.end{justify-content:center;align-items:stretch}
#slide.end .blk{display:flex;flex-direction:column;gap:18px}
#slide.end .badge{width:190px;height:190px;align-self:center}
#slide.end .foot{position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center;align-items:center;gap:14px;font-size:30px;color:var(--paper-muted)}
#slide.end .foot svg{width:42px;height:42px}
#slide.end .foot b{font-family:var(--display);font-weight:400;color:var(--paper-ink)}
#slide hr{border:0;border-top:2px solid var(--line);margin:8px 0;width:100%}
`;

const MARK = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><mask id="bmX"><rect width="40" height="40" fill="#fff"/><circle cx="25" cy="15" r="12" fill="#000"/></mask></defs><circle cx="19" cy="20" r="14" fill="var(--gold)" mask="url(#bmX)"/><path d="M29 9 l1.6 3.4 3.6.4 -2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="var(--gold-2)"/></svg>`;

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(APP, { waitUntil: 'networkidle' });
  await page.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap' });
  await page.addStyleTag({ content: CSS + '\n#slide .ar{font-family:"Noto Naskh Arabic",serif}' });
  // make sure all three families (and weights) are loaded
  await page.evaluate(async () => {
    await Promise.all(['400 40px "Young Serif"', '400 40px Andika', '700 40px Andika', '400 40px Amiri', '700 40px Amiri', '400 40px "Noto Naskh Arabic"']
      .map(f => document.fonts.load(f, 'abc قصة رَبِّ')));
    await document.fonts.ready;
  });
  const fontsOk = await page.evaluate(() => ['400 40px "Young Serif"', '400 40px Andika', '400 40px Amiri'].map(f => document.fonts.check(f)));
  console.log('fonts', fontsOk);
  const ORN = await page.evaluate(() => ORN.replace('%c', ''));

  const stories = await page.evaluate(() => STORIES.map(s => s.id));
  for (const id of stories) {
    if (ONLY && id !== ONLY) continue;
    const dir = path.join(OUT, 'carousels', id);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
    const n = await page.evaluate(id => STORIES.find(s => s.id === id).pages.length, id);
    const total = n + 2;
    const slides = [{ t: 'cover', name: '01-cover' }];
    for (let i = 0; i < n; i++) slides.push({ t: 'page', i, name: '' });
    slides.push({ t: 'end', name: '' });
    for (let k = 0; k < slides.length; k++) {
      const s = slides[k];
      const info = await page.evaluate(({ id, s, k, total, MARK, ORN }) => {
        const st = STORIES.find(x => x.id === id);
        document.getElementById('slide')?.remove();
        const el = document.createElement('div'); el.id = 'slide'; el.style.setProperty('--tint', st.tint);
        let html = '', name;
        const tidy = src => src.replace(/ and |, (?=Sahih)/g, ' · ');
        if (s.t === 'cover') {
          name = '01-cover';
          html = `<div class="brandbar">${MARK}<span>Qissa Time</span><span class="qa">قصة</span></div>
            <div class="sc">${scene(st.cover, st)}</div>
            <div class="txt" style="--gap:22px;padding-top:34px;padding-bottom:40px"><span class="chip">${badgeSvg(st.value.icon)}${esc(st.value.name)}</span><h1>${esc(st.title)}</h1><p class="src">${esc(tidy(st.source))}</p></div>`;
        } else if (s.t === 'page') {
          const p = st.pages[s.i];
          name = String(k + 1).padStart(2, '0') + '-' + p.scene;
          const rt = richText(p.text, new Set());
          html = `<div class="sc">${scene(p.scene, st)}</div><div class="txt"><div class="paras ${s.i === 0 ? 'first' : ''}">${rt.html}</div>` +
            (p.dua ? `<div class="callout"><p class="ar">${p.dua.ar}</p><p class="ref">${esc(p.dua.ref)}</p></div>` : '') +
            `<span class="pg">${k + 1} / ${total}</span></div>`;
        } else {
          name = String(k + 1).padStart(2, '0') + '-lesson';
          el.className = 'end';
          html = `${ORN.replace('class="orn "', 'class="orn tl"')}${ORN.replace('class="orn "', 'class="orn br"')}
            <div class="txt" style="flex:none;padding:0 90px 80px;--gap:34px;--fs:46px">
              <div class="badge">${badgeSvg(st.value.icon)}</div>
              <div class="blk"><p class="eyebrow">Lesson</p>${richText([st.lesson], new Set()).html}</div>
              <hr>
              <div class="blk"><p class="eyebrow">Ask the kids</p>${richText([st.ask], new Set()).html}</div>
            </div>
            <div class="foot">${MARK}<b>Qissa Time</b><span>· link in bio</span></div>`;
        }
        el.innerHTML = html;
        { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const hits = [];
          while (w.nextNode()) if (w.currentNode.nodeValue.includes('ﷺ')) hits.push(w.currentNode);
          hits.forEach(t => { const frag = document.createDocumentFragment();
            t.nodeValue.split('ﷺ').forEach((part, i) => { if (i) { const sp = document.createElement('span'); sp.className = 'saw'; sp.textContent = 'ﷺ'; frag.append(sp); } frag.append(part); });
            t.replaceWith(frag); }); }
        document.body.appendChild(el);
        // freeze SMIL animations at a settled moment, like the app's reduced-motion mode
        el.querySelectorAll('svg').forEach(sv => { try { sv.pauseAnimations(); sv.setCurrentTime(5); } catch (e) { } });
        // fit text: measure real content extent (justify-content:center hides top overflow from scrollHeight)
        const txt = el.querySelector('.txt');
        const h1 = el.querySelector('h1');
        const sc = el.querySelector('.sc');
        const kids = () => [...txt.children].filter(c => !c.classList.contains('pg'));
        const contentH = () => { const ks = kids(); const cs = getComputedStyle(txt);
          return ks[ks.length - 1].getBoundingClientRect().bottom - ks[0].getBoundingClientRect().top + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); };
        const avail = () => s.t === 'end' ? 1350 - 150 : txt.getBoundingClientRect().height;
        const over = () => contentH() > avail() + 0.5;
        let fs = 46, hs = 74, scw = 1080;
        txt.style.setProperty('--fs', fs + 'px');
        if (h1) { while (over() && hs > 52) { hs -= 2; txt.style.setProperty('--hs', hs + 'px'); } }
        while (over() && fs > 38) { fs -= 1; txt.style.setProperty('--fs', fs + 'px'); }
        // long pages: tighten spacing a little before touching the scene
        if (over() && s.t === 'page') {
          txt.style.padding = '26px 54px 34px'; txt.style.lineHeight = '1.38'; txt.style.setProperty('--gap', '14px');
          el.querySelectorAll('.paras').forEach(e => e.style.gap = '.32em'); el.querySelectorAll('.ar').forEach(e => e.style.lineHeight = '1.6');
          fs = 42; txt.style.setProperty('--fs', fs + 'px');
          while (over() && fs > 38) { fs -= 1; txt.style.setProperty('--fs', fs + 'px'); }
        }
        // last resort for very long pages: shrink the (uncropped, 4:3) scene rather than the text
        if (over() && sc && s.t === 'page') {
          sc.style.cssText = 'margin:28px auto 0;border-radius:22px;box-shadow:0 0 0 2px var(--line)';
          while (over() && scw > 640) { scw -= 20; sc.style.width = scw + 'px'; sc.style.height = (scw * 0.75) + 'px';
            const sv = sc.querySelector('svg'); sv.style.width = scw + 'px'; sv.style.height = (scw * 0.75) + 'px'; }
        }
        const dbg = [sc && [getComputedStyle(sc).height, getComputedStyle(sc).minHeight, getComputedStyle(sc).display, getComputedStyle(sc).padding, sc.children.length, sc.firstElementChild.getBoundingClientRect().height].join(','), sc && Math.round(sc.getBoundingClientRect().height), Math.round(txt.getBoundingClientRect().top), Math.round(el.getBoundingClientRect().height), ...kids().map(c => { const r = c.getBoundingClientRect(); return c.className + ':' + Math.round(r.top) + '-' + Math.round(r.bottom); })];
        return { dbg, name, fs, hs: h1 ? hs : null, scw, ch: Math.round(contentH()), av: Math.round(avail()), overflow: over() };
      }, { id, s, k, total, MARK, ORN });
      await page.waitForTimeout(150);
      const file = path.join(dir, info.name + '.png');
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      console.log(info.dbg.join(' '), id, info.name, 'fs', info.fs, 'hs', info.hs, 'scw', info.scw, info.ch + '/' + info.av, info.overflow ? 'OVERFLOW' : '');
    }
  }

  if (!ONLY || ONLY === 'profile') {
    await page.evaluate(() => {
      document.getElementById('slide')?.remove();
      const el = document.createElement('div'); el.id = 'slide';
      el.style.cssText = 'width:1080px;height:1080px;background:#0c1233';
      el.innerHTML = `<svg viewBox="0 0 512 512" width="1080" height="1080"><defs><linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1233"/><stop offset="1" stop-color="#2b2f72"/></linearGradient><mask id="pm"><rect x="-100" y="-100" width="712" height="712" fill="#fff"/><circle cx="296" cy="214" r="128" fill="#000"/></mask><radialGradient id="pgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2b84b" stop-opacity=".22"/><stop offset="1" stop-color="#f2b84b" stop-opacity="0"/></radialGradient></defs>
        <rect width="512" height="512" fill="url(#pbg)"/>
        
        <g transform="translate(256 256) scale(1.12) translate(-249 -262)">
          <g fill="#fff6da" opacity=".75"><circle cx="120" cy="140" r="5"/><circle cx="390" cy="380" r="4"/><circle cx="160" cy="390" r="3"/><circle cx="420" cy="130" r="3"/></g>
          <circle cx="232" cy="262" r="150" fill="#f2b84b" mask="url(#pm)"/>
          <path d="M352 130l19 41 45 5-34 30 10 44-40-23-40 23 10-44-34-30 45-5z" fill="#ffd98c"/>
        </g></svg>`;
      document.body.appendChild(el);
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(OUT, 'profile.png'), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    console.log('profile done');
  }
  await browser.close();
})();
