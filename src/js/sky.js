/* ================= Kindness missions and the sky of good deeds ================= */
// Each book ends with one small thing to do tomorrow. When it is done, a grown-up holds the button
// and a new star flies up into the family's sky. Everything stays on this device.
const M=()=>store.missions;
const dayDiff=t=>{const a=new Date(t),b=new Date();a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.round((b-a)/864e5)};
const fmtDay=t=>new Date(t).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
// Star i sits on a golden-ratio scatter, so the sky fills evenly however many stars there are.
function starPos(i){const r=rng(i*97+13);return{x:7+((i*.618034+.11)%1)*86,y:14+r()*50}}

function acceptMission(id,btn){
  M().pending={id,at:Date.now()};save();
  btn.setAttribute('aria-pressed','true');btn.textContent='Mission accepted ✓';btn.classList.remove('stamp');void btn.offsetWidth;btn.classList.add('stamp');
  const [x,y]=centre(btn);burst(x,y,{n:16,spread:90});sfx.glitter(10);buzz(12);
}

function missionCard(){
  const p=M().pending,st=p&&STORIES.find(s=>s.id===p.id);
  if(!st)return `<div class="mcard empty"><span class="mseal">${starSvg()}</span><div><p class="eyebrow">No mission yet</p><p class="mtext">Finish a book to get a kindness mission for tomorrow.</p></div></div>`;
  const d=dayDiff(p.at),when=d===0?'Accepted today. Do it tomorrow, then come back here.':`Accepted ${d===1?'yesterday':d+' days ago'}. Did you do it?`;
  return `<div class="mcard" style="--tint:${st.tint}"><span class="mseal">${badgeSvg(st.value.icon)}</span><div class="mbody"><p class="eyebrow">Mission from “${esc(st.title)}”</p><p class="mtext">${esc(st.mission)}</p><p class="mwhen">${when}</p></div><button class="hold" type="button" id="holdBtn" aria-describedby="holdHint"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" class="track"/><circle cx="24" cy="24" r="21" class="prog" pathLength="1"/><polygon points="${starPts(11,4.6,5)}" transform="translate(24 24)"/></svg><span>We did it!</span></button><p class="hint" id="holdHint">A grown-up holds the star to light it.</p></div>`;
}
function starSvg(){return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><polygon points="${starPts(11,4.6,5)}"/></svg>`}

function renderSky(){
  const done=M().done,n=done.length;
  let lines='';
  for(let i=1;i<n;i++){const a=starPos(i-1),b=starPos(i);if(Math.hypot(a.x-b.x,(a.y-b.y)*.5)<34)lines+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" ${i===n-1?'class="new"':''}/>`}
  const stars=done.map((m,i)=>{const st=STORIES.find(s=>s.id===m.id),p=starPos(i);return `<button type="button" class="dstar" data-star="${i}" style="left:${p.x}%;top:${p.y}%;--tint:${st?st.tint:'#f2b84b'}" aria-label="${esc((st?st.value.name:'Good deed')+', '+fmtDay(m.at))}">${starSvg()}</button>`}).join('');
  const nx=starPos(n);
  $('#skyPanel').innerHTML=`<svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${stars}<span class="slot" style="left:${nx.x}%;top:${nx.y}%" aria-hidden="true"></span><svg class="skyline" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34 Q70 14 150 30 T300 26 T400 22 V60H0Z" fill="#232a63"/><path d="M0 46 Q120 30 230 44 T400 40 V60H0Z" fill="#161c48"/></svg><p class="count">${n?`<b>${n}</b> good deed${n>1?'s':''} so far`:'Your first star is waiting'}</p><div class="stip" id="skyTip" hidden></div>`;
  $('#missionSlot').innerHTML=missionCard();
  const p=M().pending,st=p&&STORIES.find(s=>s.id===p.id);
  $('#missionChip').hidden=!st;
  if(st)$('#missionChip').innerHTML=`${starSvg()}<span><b>Your mission:</b> ${esc(st.mission)}</span>`;
  wireHold();
}

/* Hold to confirm: a ring fills while a grown-up keeps a finger on the star. Keyboard users press it once. */
function wireHold(){
  const b=$('#holdBtn');if(!b)return;let t0=0,raf=0;
  const set=v=>b.style.setProperty('--p',v);
  const tick=()=>{const v=Math.min(1,(performance.now()-t0)/1100);set(v);if(v>=1){stop();completeMission(b)}else raf=requestAnimationFrame(tick)};
  const stop=()=>{cancelAnimationFrame(raf);t0=0;b.classList.remove('holding')};
  b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture&&b.setPointerCapture(e.pointerId);t0=performance.now();b.classList.add('holding');sfx.tap();tick()};
  b.onpointerup=b.onpointercancel=()=>{if(t0){stop();set(0)}};
  b.oncontextmenu=e=>e.preventDefault();
  b.onclick=e=>{if(e.detail===0)completeMission(b)};
}

function completeMission(btn){
  const p=M().pending;if(!p)return;
  M().done.push({id:p.id,at:Date.now()});M().pending=null;save();
  const i=M().done.length-1,panel=$('#skyPanel'),pos=starPos(i),pr=panel.getBoundingClientRect();
  const [x0,y0]=centre(btn),x1=pr.left+pr.width*pos.x/100,y1=pr.top+pr.height*pos.y/100;
  const land=()=>{renderSky();const s=panel.querySelector(`[data-star="${i}"]`);if(s){s.classList.add('ignite');const [x,y]=centre(s);burst(x,y,{n:22,spread:110,big:true})}panel.classList.add('glow');setTimeout(()=>panel.classList.remove('glow'),1600);sfx.glitter(14);buzz([10,40,14]);cheer()};
  burst(x0,y0,{n:14,spread:70});
  if(reduced){land();return}
  sfx.whoosh();
  const f=document.createElement('i');f.className='flystar';f.innerHTML=starSvg();$('#fx').append(f);
  const mx=(x0+x1)/2+(x1>x0?-80:80),my=Math.min(y0,y1)-140,frames=[];
  for(let k=0;k<=24;k++){const t=k/24,x=(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,y=(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1;frames.push({transform:`translate(${x}px,${y}px) translate(-50%,-50%) scale(${1.6-t*.8}) rotate(${t*300}deg)`})}
  let trail=setInterval(()=>{const r=f.getBoundingClientRect();if(r.width)burst(r.left+r.width/2,r.top+r.height/2,{n:2,spread:18})},50);
  f.animate(frames,{duration:1000,easing:'cubic-bezier(.45,.05,.35,1)'}).onfinish=()=>{clearInterval(trail);f.remove();land()};
}
function cheer(){
  const slot=$('#missionSlot');slot.innerHTML=`<div class="mcard cheer"><span class="mseal">${starSvg()}</span><div><p class="eyebrow">MashaAllah!</p><p class="mtext">A new star is shining in your sky. Read another book for your next mission.</p></div></div>`;
}

document.addEventListener('click',e=>{
  const s=e.target.closest('.dstar'),tip=$('#skyTip');
  if(!s){if(tip&&!e.target.closest('#skyTip'))tip.hidden=true;return}
  const m=M().done[+s.dataset.star],st=STORIES.find(x=>x.id===m.id);
  tip.innerHTML=`<b>${esc(st?st.value.name:'A good deed')}</b> · ${fmtDay(m.at)}${st&&st.mission?`<span>${esc(st.mission)}</span>`:''}`;
  tip.hidden=false;const pr=$('#skyPanel').getBoundingClientRect(),[x,y]=centre(s);
  tip.style.left=Math.min(Math.max(8,x-pr.left-tip.offsetWidth/2),pr.width-tip.offsetWidth-8)+'px';tip.style.top=(y-pr.top+18)+'px';
  sfx.drop(1.6);burst(x,y,{n:8,spread:40});
});
