const ORN=`<svg class="orn %c" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2h30M2 2v30M8 8h18M8 8v18"/><polygon points="${starPts(9,6.8)}" transform="translate(17 17)"/><circle cx="17" cy="17" r="3"/></svg>`;

/* ================= Home ================= */
function bookCard(st,i){
  const pages=st.pages.length+4, mins=Math.max(2,Math.round(st.pages.reduce((a,p)=>a+p.text.join(' ').split(' ').length,0)/70)+1);
  return `<button class="book" type="button" data-open="${st.id}" style="--tint:${st.tint}">${i===STORIES.length-1?'<span class="newtag">New</span>':''}<div class="cover-art">${scene(st.cover,st)}</div><div class="body"><span class="chip">${esc(st.theme)}</span><h3>${esc(st.title)}</h3><p class="src">${esc(st.source)}</p><div class="meta"><span>${pages} pages · about ${mins} min</span>${store.read[st.id]?'<span class="ribbon">Read ✓</span>':''}</div></div></button>`;
}
/* Tonight's story: the newest book not read yet on this device, so a new story shows up here as soon as it is added.
   Once every book is read, a different one each night (the night turns over at 5am), skipping the one read last. */
function pickTonight(){
  const unread=STORIES.filter(s=>!store.read[s.id]);
  if(unread.length)return unread.reduce((a,b)=>b.date>=a.date?b:a);
  const pool=STORIES.length>1?STORIES.filter(s=>s.id!==store.lastRead):STORIES;
  const d=new Date(Date.now()-5*36e5),night=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5);
  return pool[night%pool.length];
}
function renderHome(){
  const tonight=pickTonight();
  $('#tonight').innerHTML=`<span class="tag">Tonight's story</span><div class="art">${scene(tonight.cover,tonight)}</div><div class="cap"><div><p class="eyebrow" style="color:${tonight.tint}">${esc(tonight.theme)}</p><h3>${esc(tonight.title)}</h3></div><button class="btn gold" type="button" data-open="${tonight.id}">Read</button></div>`;
  $('#ctaTonight').dataset.open=tonight.id;
  renderShelf();
  $('#values').innerHTML=STORIES.map(st=>`<div class="val ${store.read[st.id]?'on':''}" style="--tint:${st.tint}">${badgeSvg(st.value.icon)}<div><b>${st.value.name}</b><span>${store.read[st.id]?'Earned from “'+esc(st.title)+'”':'Finish “'+esc(st.title)+'” to light it up'}</span></div></div>`).join('');
  renderSky();
  liveArt($('#home'));
}
function greet(){const h=new Date().getHours();$('#greet').textContent=h>=18||h<5?'Assalamu alaikum. It is almost time for bed.':h<12?'Assalamu alaikum. Good morning, little reader.':'Assalamu alaikum, little reader.'}
$('#heroLanterns').innerHTML=lanternString(0,22,15,['#f2b84b','#ef7f8f','#56c7b4','#ffd98c'],1200);

/* ================= Reader ================= */
const R={st:null,i:0,pages:[],busy:false,playing:false,utt:null,timer:0,tok:0,raf:0};
function makeLeaf(n){
  const st=R.st,p=R.pages[n],used=new Set();
  const leaf=document.createElement('article');leaf.className='leaf';leaf.style.setProperty('--tint',st.tint);
  let art,words,rt={html:''};
  const orn=ORN.replace('%c','tl')+ORN.replace('%c','br');
  if(p.t==='cover'){
    art=scene(st.cover,st);
    words=`${orn}<p class="eyebrow">${esc(st.theme)}</p><h2 id="cv">${esc(st.title)}</h2><p class="ar">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p><p class="note">In the name of Allah, the Most Gracious, the Most Merciful.</p><p class="note"><b>Source:</b> ${esc(st.sourceLong)}</p><p class="hint">Swipe, tap the arrow, or press → to turn the page.</p>`;
  }else if(p.t==='story'){
    art=scene(p.scene,st);rt=richText(p.text,used);
    words=`${orn}<div class="${p.first?'first':''}" style="display:flex;flex-direction:column;gap:16px">${rt.html}</div>`+(p.dua?`<div class="callout"><p class="ar">${p.dua.ar}</p><p class="note">${esc(p.dua.ref)}</p></div>`:'');
  }else if(p.t==='lesson'){
    art=scene('lesson',st);rt=richText([st.lesson],used);
    words=`${orn}<p class="eyebrow">What we learned</p>${rt.html}<span class="earned">${badgeSvg(st.value.icon)}You lit the ${st.value.name} star</span><p class="note"><b>From:</b> ${esc(st.sourceLong)}</p>`;
  }else if(p.t==='ask'){
    art=scene('talk',st);rt=richText([st.ask],used);
    words=`${orn}<p class="eyebrow">Talk time</p>${rt.html}<p class="note"><b>Tip for parents:</b> ${esc(st.tip)}</p>`;
  }else if(p.t==='mission'){
    art=scene('mission',st);rt=richText([st.mission],used);
    const on=M().pending&&M().pending.id===st.id;
    words=`${orn}<p class="eyebrow">Tomorrow's kindness mission</p><div class="mission">${rt.html}</div><p class="note">Do it tomorrow, then open the bookshelf. A grown-up holds the star there to light it in your sky of good deeds.</p><div class="row"><button class="btn gold accept" type="button" data-act="accept" aria-pressed="${!!on}">${on?'Mission accepted ✓':'We accept the mission'}</button></div>`;
  }else{
    art=scene('night',st);
    words=`${orn}<p class="eyebrow">Before you sleep</p><p class="ar">بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا</p><p><i>Bismika Allahumma amutu wa ahya.</i></p><p>In Your name, O Allah, I die and I live.</p><p class="note">The Prophet ﷺ said this when he lay down to sleep. (Sahih al-Bukhari 6324)</p><div class="row"><button class="btn gold" type="button" data-act="shelf">Back to the bookshelf</button><button class="btn ghost" type="button" data-act="again" style="color:var(--paper-ink)">Read again</button></div>`;
  }
  leaf.innerHTML=`<div class="art">${art}</div><div class="words">${words}</div>`;
  leaf._scene={cover:st.cover,story:p.scene,lesson:'lesson',ask:'talk',mission:'mission',night:'night'}[p.t];const sp=pageSpeech(st,p);leaf._speech=sp.text;leaf._off=sp.off;leaf._tokens=[...leaf.querySelectorAll('.w')].map(el=>({el,s:+el.dataset.s}));
  pageArt(leaf);
  if(p.t==='lesson'){store.lastRead=st.id;if(!store.read[st.id]){store.read[st.id]=true;leaf._earned=true}save()}
  return leaf;
}
function openStory(id,from){
  R.st=STORIES.find(s=>s.id===id);if(!R.st)return;
  R.pages=buildPages(R.st);R.i=0;R.busy=false;
  $('#rTitle').textContent=R.st.title;
  $('#rDots').innerHTML=R.pages.map((_,k)=>`<button type="button" data-k="${k}" aria-label="Go to page ${k+1}"></button>`).join('');
  const bv=$('#bookview');bv.innerHTML='';const lf=makeLeaf(0);lf.classList.add('fade');bv.append(lf);
  $('#reader').hidden=false;document.body.classList.add('reading');pauseHome();fit(lf);
  chrome();$('#rNext').focus();zoomFrom(from);sfx.page();ambience(AMB[lf._scene]||'wind');
}
function closeReader(){stopSpeech();stopAmbience();$('#reader').hidden=true;document.body.classList.remove('reading');hideGloss();document.querySelectorAll('#bookview svg').forEach(s=>animate(s,false));renderHome();wakeSky();wakeDrift()}
function goTo(n){
  if(n<0||n>=R.pages.length||n===R.i||R.busy)return;
  const keepPlaying=R.playing;stopSpeech(true);hideGloss();
  const d=n>R.i?1:-1,bv=$('#bookview'),old=bv.querySelector('.leaf'),nw=makeLeaf(n);
  R.busy=true;R.i=n;
  nw.classList.add(d>0?'in-next':'in-prev');old.classList.add(d>0?'out-next':'out-prev');bv.append(nw);fit(nw);chrome();
  sfx.page();ambience(AMB[nw._scene]||'wind');if(nw._earned)setTimeout(()=>celebrate(nw),reduced?50:900);
  setTimeout(()=>{old.remove();nw.className='leaf';R.busy=false;if(keepPlaying){R.playing=true;speak()}},reduced?20:760);
}
// The value star pops with a shower of sparkles the first time a child reaches the lesson.
function celebrate(leaf){const e=leaf.querySelector('.earned');if(!e||!leaf.isConnected)return;e.classList.add('pop');const [x,y]=centre(e.querySelector('svg')||e);burst(x,y,{n:24,spread:120,big:true});sfx.glitter(14);buzz([10,40,14])}
// Shrink a page's words a little (never below 80%) until they fit without scrolling.
function fit(leaf){
  const w=leaf&&leaf.querySelector('.words');if(!w)return;
  let f=1;w.style.setProperty('--fit',f);
  while(w.scrollHeight>w.clientHeight+1&&f>.8){f=+(f-.04).toFixed(2);w.style.setProperty('--fit',f)}
}
addEventListener('resize',()=>{if(!$('#reader').hidden)fit($('#bookview .leaf:last-child'))});
function chrome(){
  [...$('#rDots').children].forEach((b,k)=>{b.classList.toggle('on',k===R.i);b.setAttribute('aria-current',k===R.i?'page':'false')});
  $('#rCount').textContent=`${R.i+1} / ${R.pages.length}`;
  $('#rPrev').disabled=R.i===0;$('#rNext').disabled=R.i===R.pages.length-1;
}

/* ================= Read aloud =================
   Pages with a recorded clip (NARR, made by narrate.mjs) play it; other pages use the phone's own voice.
   Either way the word being said lights up, and the nature sounds dip underneath. */
const synth=window.speechSynthesis;let voice=null;
function pickVoice(){if(!synth)return;const vs=synth.getVoices();voice=vs.find(v=>/^en[-_]GB/i.test(v.lang)&&/female|libby|sonia|serena|kate|martha/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang)&&/samantha|female|aria|jenny|ava|google/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null}
if(synth){pickVoice();synth.onvoiceschanged=pickVoice}
if(!synth&&!Object.keys(NARR).length)$('#rPlay').hidden=true;
const clipOf=()=>(NARR[R.st?.id]||[])[R.i]||null;
const SILENT='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAqAAbW1tbW1tbW1tbW1tbW1tbW1tbZKSkpKSkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb29vb2///////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEUAAAAAAAAAKgvT9A1gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
const voiceA=new Audio();voiceA.preload='auto';
function clearHl(){document.querySelectorAll('.w.on').forEach(e=>e.classList.remove('on'))}
function highlight(leaf,at){
  let hit=null;for(const t of leaf._tokens){if(t.s<=at-leaf._off)hit=t;else break}
  if(hit&&hit.el.classList.contains('on'))return;clearHl();
  if(hit){hit.el.classList.add('on');const w=leaf.querySelector('.words'),r=hit.el.getBoundingClientRect(),wr=w.getBoundingClientRect();if(r.bottom>wr.bottom-20||r.top<wr.top)hit.el.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'})}
}
function pageDone(){clearHl();if(!R.playing)return;if(R.i<R.pages.length-1)R.timer=setTimeout(()=>{if(R.playing)goTo(R.i+1)},1200);else{R.playing=false;playUI();duck(false)}}
function speak(){
  const leaf=$('#bookview .leaf:last-child');if(!leaf)return;
  const clip=clipOf();duck(true);
  if(clip)playClip(leaf,clip);else speakSynth(leaf);
}
function speakSynth(leaf){
  if(!synth){pageDone();return}
  synth.cancel();const u=new SpeechSynthesisUtterance(leaf._speech||'');R.utt=u;
  if(voice)u.voice=voice;u.rate=store.bed?.8:.9;u.pitch=1.05;
  u.onboundary=e=>{if(u!==R.utt||(e.name&&e.name!=='word'))return;highlight(leaf,e.charIndex)};
  u.onend=()=>{if(u===R.utt)pageDone()};
  synth.speak(u);
}
// Clips are kept in their own cache once heard, so a book read once can be read aloud offline.
const AUDIO_CACHE='qissa-audio';
let clipUrl='';
async function loadClip(f){
  const url='audio/'+f;
  if(!('caches' in window)||!/^https?:$/.test(location.protocol))return url;
  try{
    const c=await caches.open(AUDIO_CACHE);let res=await c.match(url);
    if(!res){res=await fetch(url);if(!res.ok)throw 0;await c.put(url,res.clone())}
    if(clipUrl)URL.revokeObjectURL(clipUrl);return clipUrl=URL.createObjectURL(await res.blob());
  }catch(e){return url}
}
async function playClip(leaf,clip){
  const tok=R.tok=(R.tok||0)+1,w=clip.w;
  const src=await loadClip(clip.f);if(tok!==R.tok)return;
  voiceA.onended=()=>{if(tok===R.tok){cancelAnimationFrame(R.raf);pageDone()}};
  voiceA.onerror=()=>{if(tok===R.tok&&voiceA.src!==SILENT){cancelAnimationFrame(R.raf);speakSynth(leaf)}};
  voiceA.src=src;voiceA.playbackRate=store.bed?.9:1;voiceA.preservesPitch=true;
  voiceA.play().catch(()=>{if(tok===R.tok)speakSynth(leaf)});
  const follow=()=>{if(tok!==R.tok)return;const t=voiceA.currentTime;let at=-1;for(let k=0;k<w.length;k+=2){if(w[k+1]<=t+.05)at=w[k];else break}if(at>=0)highlight(leaf,at);R.raf=requestAnimationFrame(follow)};
  R.raf=requestAnimationFrame(follow);
}
function stopSpeech(keep){clearTimeout(R.timer);R.utt=null;R.tok=(R.tok||0)+1;cancelAnimationFrame(R.raf);voiceA.pause();if(synth)synth.cancel();clearHl();if(!keep)duck(false);if(!keep){R.playing=false;playUI()}}
function playUI(){$('#rPlay').setAttribute('aria-pressed',R.playing);$('#rPlayLbl').textContent=R.playing?'Pause':'Read to me'}
// Phones only let sound start from a tap, so the tap itself plays a moment of silence first.
$('#rPlay').onclick=()=>{if(R.playing){stopSpeech()}else{R.playing=true;playUI();if(clipOf()){voiceA.src=SILENT;voiceA.play().catch(()=>{})}speak()}};
// Clear out clips from older recordings that no story uses any more.
if('caches' in window)caches.open(AUDIO_CACHE).then(c=>c.keys().then(ks=>{const live=new Set(Object.values(NARR).flat().filter(Boolean).map(c=>new URL('audio/'+c.f,location.href).href));ks.forEach(k=>{if(!live.has(k.url))c.delete(k)})})).catch(()=>{});

/* ================= Glossary ================= */
function showGloss(btn){
  const g=GLOSS[btn.dataset.g],box=$('#gloss');
  box.innerHTML=`<span class="ar">${g.ar}</span><b>${esc(g.tr)}</b><p>${esc(g.m)}</p><div class="row"><button type="button" id="gSay">Listen</button><button type="button" id="gClose">Close</button></div>`;
  box.hidden=false;const r=btn.getBoundingClientRect(),bw=box.offsetWidth,bh=box.offsetHeight;
  let top=r.bottom+10;if(top+bh>innerHeight-10)top=Math.max(10,r.top-bh-10);
  box.style.top=top+'px';box.style.left=Math.min(Math.max(16,r.left+r.width/2-bw/2),innerWidth-bw-16)+'px';
  $('#gSay').onclick=()=>{if(!synth)return;stopSpeech();const u=new SpeechSynthesisUtterance(g.tr+'. '+g.m);if(voice)u.voice=voice;u.rate=.9;synth.speak(u)};
  $('#gClose').onclick=hideGloss;$('#gClose').focus();
}
function hideGloss(){$('#gloss').hidden=true}
if(!synth)document.documentElement.classList.add('nosynth');

/* ================= Events ================= */
document.addEventListener('click',e=>{
  const g=e.target.closest('.g');if(g){showGloss(g);return}
  if(!e.target.closest('#gloss'))hideGloss();
  const o=e.target.closest('[data-open]');if(o){openStory(o.dataset.open,o.querySelector('.cover-art,.art')||(o.closest('.hero')&&$('#tonight .art')));return}
  const a=e.target.closest('[data-act]');if(a){const k=a.dataset.act;if(k==='shelf')closeReader();else if(k==='accept')acceptMission(R.st.id,a);else goTo(0);return}
  const k=e.target.closest('#rDots [data-k]');if(k)goTo(+k.dataset.k);
});
$('#rPrev').onclick=()=>goTo(R.i-1);$('#rNext').onclick=()=>goTo(R.i+1);$('#rClose').onclick=closeReader;
document.addEventListener('keydown',e=>{if($('#reader').hidden)return;if(e.key==='ArrowRight')goTo(R.i+1);else if(e.key==='ArrowLeft')goTo(R.i-1);else if(e.key==='Escape'){if(!$('#gloss').hidden)hideGloss();else closeReader()}});
let sx=0,sy=0,st0=0;
$('#bookview').addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;st0=Date.now()});
$('#bookview').addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-st0<800)goTo(R.i+(dx<0?1:-1));
  // Magic touch: tapping a picture scatters little lights with a water-drop sound.
  else if(Math.hypot(dx,dy)<10&&e.target.closest('.leaf .art')){burst(e.clientX,e.clientY,{n:10,spread:60});sfx.drop()}});
function applyFs(){document.documentElement.style.setProperty('--fs-mult',store.fs);if(!$('#reader').hidden)fit($('#bookview .leaf:last-child'))}
$('#rBigger').onclick=()=>{store.fs=Math.min(1.4,+(store.fs+.12).toFixed(2));applyFs();save()};
$('#rSmaller').onclick=()=>{store.fs=Math.max(.85,+(store.fs-.12).toFixed(2));applyFs();save()};
function applyBed(){document.body.classList.toggle('bedtime',!!store.bed);volume();$('#bedBtn').setAttribute('aria-pressed',!!store.bed);$('#rBed').setAttribute('aria-pressed',!!store.bed)}
$('#bedBtn').onclick=$('#rBed').onclick=()=>{store.bed=!store.bed;applyBed();save()};
function applySound(){$('#sndBtn').setAttribute('aria-pressed',!!store.sound);$('#rSnd').setAttribute('aria-pressed',!!store.sound)}
$('#sndBtn').onclick=$('#rSnd').onclick=()=>{store.sound=!store.sound;save();applySound();if(!store.sound)stopAmbience();else{sfx.drop();if(!$('#reader').hidden)ambience(AMB[$('#bookview .leaf:last-child')._scene]||'wind')}};

/* ================= Hero sky ================= */
// The stars stop while a book is open (closeReader wakes them), so nothing is drawn behind the reader.
let wakeSky=()=>{};
(function sky(){
  const cv=$('#sky'),ctx=cv.getContext('2d');let w=0,h=0,pts=[],col='#fff',shoot=null,f=0,on=true;
  function size(){const d=Math.min(2,devicePixelRatio||1);w=cv.clientWidth;h=cv.clientHeight;cv.width=w*d;cv.height=h*d;ctx.setTransform(d,0,0,d,0,0);const r=rng(7);pts=Array.from({length:Math.round(w*h/2300)},()=>({x:r()*w,y:r()*h*.85,r:r()*1.3+.3,p:r()*6.3,s:.4+r()*1.4}))}
  function draw(t){
    if(f++%90===0)col=getComputedStyle(document.documentElement).getPropertyValue('--star').trim()||'#fff';
    if(document.body.classList.contains('reading')){on=false;return}
    {
      ctx.clearRect(0,0,w,h);ctx.fillStyle=col;
      for(const s of pts){ctx.globalAlpha=reduced?.8:.3+.7*Math.abs(Math.sin(s.p+t/1000*s.s));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}
      if(!reduced){
        if(!shoot&&Math.random()<.004)shoot={x:Math.random()*w*.7+w*.2,y:Math.random()*h*.3,l:0};
        if(shoot){shoot.l+=.02;const L=shoot.l,x=shoot.x-L*260,y=shoot.y+L*110;const gr=ctx.createLinearGradient(x,y,x+70,y-30);gr.addColorStop(0,col);gr.addColorStop(1,'transparent');ctx.globalAlpha=Math.sin(L*Math.PI);ctx.strokeStyle=gr;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70,y-30);ctx.stroke();if(L>=1)shoot=null}
      }
      ctx.globalAlpha=1;
    }
    if(!reduced)requestAnimationFrame(draw);else on=false;
  }
  wakeSky=()=>{if(!on){on=true;requestAnimationFrame(draw)}};
  size();addEventListener('resize',()=>{size();wakeSky()});requestAnimationFrame(draw);
})();

/* ================= Offline and add to home screen ================= */
const canOffline='serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost');
if(canOffline)navigator.serviceWorker.register('sw.js').catch(()=>{});
let installEvt=null;
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$('#installBtn').hidden=false});
addEventListener('appinstalled',()=>{installEvt=null;$('#installBtn').hidden=true;$('#installTip').hidden=true});
if(ios&&!standalone&&canOffline)$('#installBtn').hidden=false;
$('#installBtn').onclick=()=>{
  if(installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null;$('#installBtn').hidden=true})}
  else $('#installTip').hidden=!$('#installTip').hidden;
};

greet();applyFs();applyBed();applySound();renderHome();
if(location.hash&&STORIES.some(s=>s.id===location.hash.slice(1)))openStory(location.hash.slice(1));
