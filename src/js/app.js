/* ================= Text with read-along spans ================= */
function richText(paras,used){
  let speech='',html='';
  for(const para of paras){
    let ph='',inQ=false;
    para.split('\n').forEach((line,li)=>{
      if(li)ph+='<br>';
      line.split(/\s+/).filter(Boolean).forEach(w=>{
        const start=speech.length;
        speech+=w.replace(/ﷺ/g,'peace be upon him')+' ';
        const startsQ=w.startsWith('"'),qn=(w.match(/"/g)||[]).length;
        let cls='w'+((inQ||startsQ)?' said':'');
        if(qn%2)inQ=!inQ;
        let disp=w.replace(/^"/,'“').replace(/"/g,'”').replace(/'/g,'’');
        const key=w.toLowerCase().replace(/[^a-zﷺ]/g,'');
        const m=disp.match(/^([^A-Za-zﷺ]*)(.*?)([^A-Za-zﷺ]*)$/);
        if(GLOSS[key]&&!used.has(key)&&m){used.add(key);ph+=`${esc(m[1])}<button type="button" class="${cls} g" data-g="${key}" data-s="${start}">${esc(m[2])}</button>${esc(m[3])} `}
        else ph+=`<span class="${cls}" data-s="${start}">${esc(disp)}</span> `;
      });
      speech+=' ';
    });
    html+=`<p>${ph.trim()}</p>`;
  }
  return {html,speech};
}
const ORN=`<svg class="orn %c" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2h30M2 2v30M8 8h18M8 8v18"/><polygon points="${starPts(9,6.8)}" transform="translate(17 17)"/><circle cx="17" cy="17" r="3"/></svg>`;

/* ================= Home ================= */
function bookCard(st,i){
  const pages=st.pages.length+4, mins=Math.max(2,Math.round(st.pages.reduce((a,p)=>a+p.text.join(' ').split(' ').length,0)/70)+1);
  return `<button class="book" type="button" data-open="${st.id}" style="--tint:${st.tint}">${i===STORIES.length-1?'<span class="newtag">New</span>':''}<div class="cover-art">${scene(st.cover,st)}</div><div class="body"><span class="chip">${esc(st.theme)}</span><h3>${esc(st.title)}</h3><p class="src">${esc(st.source)}</p><div class="meta"><span>${pages} pages · about ${mins} min</span>${store.read[st.id]?'<span class="ribbon">Read ✓</span>':''}</div></div></button>`;
}
function renderHome(){
  const tonight=STORIES.find(s=>!store.read[s.id])||STORIES[STORIES.length-1];
  $('#tonight').innerHTML=`<span class="tag">Tonight's story</span><div class="art">${scene(tonight.cover,tonight)}</div><div class="cap"><div><p class="eyebrow" style="color:${tonight.tint}">${esc(tonight.theme)}</p><h3>${esc(tonight.title)}</h3></div><button class="btn gold" type="button" data-open="${tonight.id}">Read</button></div>`;
  $('#ctaTonight').dataset.open=tonight.id;
  $('#books').innerHTML=STORIES.map(bookCard).join('');
  $('#values').innerHTML=STORIES.map(st=>`<div class="val ${store.read[st.id]?'on':''}" style="--tint:${st.tint}">${badgeSvg(st.value.icon)}<div><b>${st.value.name}</b><span>${store.read[st.id]?'Earned from “'+esc(st.title)+'”':'Finish “'+esc(st.title)+'” to light it up'}</span></div></div>`).join('');
  freeze($('#home'));
}
function greet(){const h=new Date().getHours();$('#greet').textContent=h>=18||h<5?'Assalamu alaikum. It is almost time for bed.':h<12?'Assalamu alaikum. Good morning, little reader.':'Assalamu alaikum, little reader.'}
$('#heroLanterns').innerHTML=lanternString(0,22,15,['#f2b84b','#ef7f8f','#56c7b4','#ffd98c'],1200);

/* ================= Reader ================= */
const R={st:null,i:0,pages:[],busy:false,playing:false,utt:null,timer:0};
function buildPages(st){return [{t:'cover'},...st.pages.map((p,k)=>({t:'story',...p,first:k===0})),{t:'lesson'},{t:'ask'},{t:'night'}]}
function makeLeaf(n){
  const st=R.st,p=R.pages[n],used=new Set();
  const leaf=document.createElement('article');leaf.className='leaf';leaf.style.setProperty('--tint',st.tint);
  let art,words,rt={html:'',speech:''};
  const orn=ORN.replace('%c','tl')+ORN.replace('%c','br');
  if(p.t==='cover'){
    art=scene(st.cover,st);
    words=`${orn}<p class="eyebrow">${esc(st.theme)}</p><h2 id="cv">${esc(st.title)}</h2><p class="ar">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p><p class="note">In the name of Allah, the Most Gracious, the Most Merciful.</p><p class="note"><b>Source:</b> ${esc(st.sourceLong)}</p><p class="hint">Swipe, tap the arrow, or press → to turn the page.</p>`;
    rt.speech=st.title+'. Bismillah ir-Rahman ir-Raheem. In the name of Allah, the Most Gracious, the Most Merciful.';
  }else if(p.t==='story'){
    art=scene(p.scene,st);rt=richText(p.text,used);
    words=`${orn}<div class="${p.first?'first':''}" style="display:flex;flex-direction:column;gap:16px">${rt.html}</div>`+(p.dua?`<div class="callout"><p class="ar">${p.dua.ar}</p><p class="note">${esc(p.dua.ref)}</p></div>`:'');
  }else if(p.t==='lesson'){
    art=scene('lesson',st);rt=richText([st.lesson],used);
    words=`${orn}<p class="eyebrow">What we learned</p>${rt.html}<span class="earned">${badgeSvg(st.value.icon)}You lit the ${st.value.name} star</span><p class="note"><b>From:</b> ${esc(st.sourceLong)}</p>`;
    rt.speech='What we learned. '+rt.speech+' You lit the '+st.value.name+' star!';
  }else if(p.t==='ask'){
    art=scene('talk',st);rt=richText([st.ask],used);
    words=`${orn}<p class="eyebrow">Talk time</p>${rt.html}<p class="note"><b>Tip for parents:</b> ${esc(st.tip)}</p>`;
    rt.speech='Talk time. '+rt.speech;
  }else{
    art=scene('night',st);
    words=`${orn}<p class="eyebrow">Before you sleep</p><p class="ar">بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا</p><p><i>Bismika Allahumma amutu wa ahya.</i></p><p>In Your name, O Allah, I die and I live.</p><p class="note">The Prophet ﷺ said this when he lay down to sleep. (Sahih al-Bukhari 6324)</p><div class="row"><button class="btn gold" type="button" data-act="shelf">Back to the bookshelf</button><button class="btn ghost" type="button" data-act="again" style="color:var(--paper-ink)">Read again</button></div>`;
    rt.speech='Before you sleep, say: Bismika Allahumma amutu wa ahya. In your name, O Allah, I die and I live. Good night.';
  }
  leaf.innerHTML=`<div class="art">${art}</div><div class="words">${words}</div>`;
  leaf._speech=rt.speech;leaf._tokens=[...leaf.querySelectorAll('.w')].map(el=>({el,s:+el.dataset.s}));
  freeze(leaf);
  if(p.t==='lesson'&&!store.read[st.id]){store.read[st.id]=true;save()}
  return leaf;
}
function openStory(id){
  R.st=STORIES.find(s=>s.id===id);if(!R.st)return;
  R.pages=buildPages(R.st);R.i=0;R.busy=false;
  $('#rTitle').textContent=R.st.title;
  $('#rDots').innerHTML=R.pages.map((_,k)=>`<button type="button" data-k="${k}" aria-label="Go to page ${k+1}"></button>`).join('');
  const bv=$('#bookview');bv.innerHTML='';const lf=makeLeaf(0);lf.classList.add('fade');bv.append(lf);
  $('#reader').hidden=false;document.body.classList.add('reading');fit(lf);
  chrome();$('#rNext').focus();
}
function closeReader(){stopSpeech();$('#reader').hidden=true;document.body.classList.remove('reading');hideGloss();renderHome()}
function goTo(n){
  if(n<0||n>=R.pages.length||n===R.i||R.busy)return;
  const keepPlaying=R.playing;stopSpeech(true);hideGloss();
  const d=n>R.i?1:-1,bv=$('#bookview'),old=bv.querySelector('.leaf'),nw=makeLeaf(n);
  R.busy=true;R.i=n;
  nw.classList.add(d>0?'in-next':'in-prev');old.classList.add(d>0?'out-next':'out-prev');bv.append(nw);fit(nw);chrome();
  setTimeout(()=>{old.remove();nw.className='leaf';R.busy=false;if(keepPlaying){R.playing=true;speak()}},reduced?20:760);
}
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

/* ================= Read aloud ================= */
const synth=window.speechSynthesis;let voice=null;
function pickVoice(){if(!synth)return;const vs=synth.getVoices();voice=vs.find(v=>/^en[-_]GB/i.test(v.lang)&&/female|libby|sonia|serena|kate|martha/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang)&&/samantha|female|aria|jenny|ava|google/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null}
if(synth){pickVoice();synth.onvoiceschanged=pickVoice}else{$('#rPlay').hidden=true}
function clearHl(){document.querySelectorAll('.w.on').forEach(e=>e.classList.remove('on'))}
function speak(){
  const leaf=$('#bookview .leaf:last-child');if(!synth||!leaf)return;
  synth.cancel();const u=new SpeechSynthesisUtterance(leaf._speech||'');R.utt=u;
  if(voice)u.voice=voice;u.rate=store.bed?.8:.9;u.pitch=1.05;
  u.onboundary=e=>{if(u!==R.utt||(e.name&&e.name!=='word'))return;let hit=null;for(const t of leaf._tokens){if(t.s<=e.charIndex)hit=t;else break}clearHl();if(hit){hit.el.classList.add('on');const w=leaf.querySelector('.words'),r=hit.el.getBoundingClientRect(),wr=w.getBoundingClientRect();if(r.bottom>wr.bottom-20||r.top<wr.top)hit.el.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'})}};
  u.onend=()=>{if(u!==R.utt)return;clearHl();if(!R.playing)return;if(R.i<R.pages.length-1)R.timer=setTimeout(()=>{if(R.playing)goTo(R.i+1)},1200);else{R.playing=false;playUI()}};
  synth.speak(u);
}
function stopSpeech(keep){clearTimeout(R.timer);R.utt=null;if(synth)synth.cancel();clearHl();if(!keep){R.playing=false;playUI()}}
function playUI(){$('#rPlay').setAttribute('aria-pressed',R.playing);$('#rPlayLbl').textContent=R.playing?'Pause':'Read to me'}
$('#rPlay').onclick=()=>{if(R.playing){stopSpeech()}else{R.playing=true;playUI();speak()}};

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
  const o=e.target.closest('[data-open]');if(o){openStory(o.dataset.open);return}
  const a=e.target.closest('[data-act]');if(a){if(a.dataset.act==='shelf')closeReader();else goTo(0);return}
  const k=e.target.closest('#rDots [data-k]');if(k)goTo(+k.dataset.k);
});
$('#rPrev').onclick=()=>goTo(R.i-1);$('#rNext').onclick=()=>goTo(R.i+1);$('#rClose').onclick=closeReader;
document.addEventListener('keydown',e=>{if($('#reader').hidden)return;if(e.key==='ArrowRight')goTo(R.i+1);else if(e.key==='ArrowLeft')goTo(R.i-1);else if(e.key==='Escape'){if(!$('#gloss').hidden)hideGloss();else closeReader()}});
let sx=0,sy=0,st0=0;
$('#bookview').addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;st0=Date.now()});
$('#bookview').addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-st0<800)goTo(R.i+(dx<0?1:-1))});
function applyFs(){document.documentElement.style.setProperty('--fs-mult',store.fs);if(!$('#reader').hidden)fit($('#bookview .leaf:last-child'))}
$('#rBigger').onclick=()=>{store.fs=Math.min(1.4,+(store.fs+.12).toFixed(2));applyFs();save()};
$('#rSmaller').onclick=()=>{store.fs=Math.max(.85,+(store.fs-.12).toFixed(2));applyFs();save()};
function applyBed(){document.body.classList.toggle('bedtime',!!store.bed);$('#bedBtn').setAttribute('aria-pressed',!!store.bed);$('#rBed').setAttribute('aria-pressed',!!store.bed)}
$('#bedBtn').onclick=$('#rBed').onclick=()=>{store.bed=!store.bed;applyBed();save()};

/* ================= Hero sky ================= */
(function sky(){
  const cv=$('#sky'),ctx=cv.getContext('2d');let w=0,h=0,pts=[],col='#fff',shoot=null,f=0;
  function size(){const d=Math.min(2,devicePixelRatio||1);w=cv.clientWidth;h=cv.clientHeight;cv.width=w*d;cv.height=h*d;ctx.setTransform(d,0,0,d,0,0);const r=rng(7);pts=Array.from({length:Math.round(w*h/2300)},()=>({x:r()*w,y:r()*h*.85,r:r()*1.3+.3,p:r()*6.3,s:.4+r()*1.4}))}
  function draw(t){
    if(f++%90===0)col=getComputedStyle(document.documentElement).getPropertyValue('--star').trim()||'#fff';
    if(!document.body.classList.contains('reading')){
      ctx.clearRect(0,0,w,h);ctx.fillStyle=col;
      for(const s of pts){ctx.globalAlpha=reduced?.8:.3+.7*Math.abs(Math.sin(s.p+t/1000*s.s));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill()}
      if(!reduced){
        if(!shoot&&Math.random()<.004)shoot={x:Math.random()*w*.7+w*.2,y:Math.random()*h*.3,l:0};
        if(shoot){shoot.l+=.02;const L=shoot.l,x=shoot.x-L*260,y=shoot.y+L*110;const gr=ctx.createLinearGradient(x,y,x+70,y-30);gr.addColorStop(0,col);gr.addColorStop(1,'transparent');ctx.globalAlpha=Math.sin(L*Math.PI);ctx.strokeStyle=gr;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70,y-30);ctx.stroke();if(L>=1)shoot=null}
      }
      ctx.globalAlpha=1;
    }
    if(!reduced)requestAnimationFrame(draw);
  }
  size();addEventListener('resize',size);requestAnimationFrame(draw);
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

greet();applyFs();applyBed();renderHome();
if(location.hash&&STORIES.some(s=>s.id===location.hash.slice(1)))openStory(location.hash.slice(1));
