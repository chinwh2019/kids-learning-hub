/* ================= Bookshelf rows ================= */
// The bookshelf is a few rows: books not read yet, one row per shelf (from the story's `shelf:` frontmatter), and books to read again.
// Rows with enough books drift slowly from left to right in an endless loop. Touching, hovering or swiping a row stops it; it carries on a few seconds later.
const DRIFT={speed:22,boost:1,tracks:[]};
function shelfRows(){
  const rows=[],unread=STORIES.filter(s=>!store.read[s.id]),done=STORIES.filter(s=>store.read[s.id]);
  if(unread.length)rows.push({name:'Not read yet',books:unread,tint:'var(--gold)'});
  const shelves=new Map();STORIES.forEach(s=>{if(!shelves.has(s.shelf))shelves.set(s.shelf,[]);shelves.get(s.shelf).push(s)});
  shelves.forEach((books,name)=>rows.push({name,books,tint:books[0].tint}));
  if(done.length)rows.push({name:'Read again',books:done,tint:'var(--teal)'});
  return rows;
}
function renderShelf(){
  $('#books').innerHTML=shelfRows().map(r=>`<div class="shelfrow" style="--rtint:${r.tint}"><div class="rowhead"><h3>${esc(r.name)}</h3><span>${r.books.length} ${r.books.length===1?'book':'books'}</span></div><div class="track"><div class="lane">${r.books.map(st=>bookCard(st,STORIES.indexOf(st))).join('')}</div></div></div>`).join('');
  DRIFT.tracks=[...document.querySelectorAll('#books .track')].map(setupTrack);
  liveArt($('#books'));
}
function setupTrack(el){
  const lane=el.firstElementChild,set=[...lane.children],t={el,lane,on:false,w:0,x:0,rest:0,hover:false};
  const gap=parseFloat(getComputedStyle(lane).columnGap)||0;
  t.w=set.reduce((a,c)=>a+c.offsetWidth+gap,0);
  // Only rows with three or more books, or more books than fit, move; a row of one or two books stays still.
  if(reduced||!t.w||(set.length<3&&t.w-gap<=el.clientWidth))return t;
  const copies=3+Math.ceil(el.clientWidth/t.w);
  for(let k=1;k<copies;k++)set.forEach(c=>{const d=c.cloneNode(true);d.setAttribute('aria-hidden','true');d.tabIndex=-1;lane.append(d)});
  t.on=true;el.classList.add('drifting');
  t.x=t.w*(1+Math.random());el.scrollLeft=Math.round(t.x);
  const hold=()=>{t.rest=performance.now()+3500};
  el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){t.hover=true;hold()}});
  el.addEventListener('pointerleave',()=>{t.hover=false;hold()});
  ['pointerdown','touchstart','wheel','focusin'].forEach(k=>el.addEventListener(k,hold,{passive:true}));
  // Swiping by hand loops too: jump by one set of books before reaching either end.
  el.addEventListener('scroll',()=>{
    if(performance.now()<t.rest){hold();let s=el.scrollLeft;if(s<t.w*.5)s+=t.w;else if(s>lane.scrollWidth-el.clientWidth-t.w*.5)s-=t.w;if(s!==el.scrollLeft)el.scrollLeft=s;t.x=s}
  },{passive:true});
  return t;
}
// The rows rest while a book is open; closeReader wakes them.
let wakeDrift=()=>{};
(function drift(){
  let last=performance.now(),on=true;
  wakeDrift=()=>{if(!on){on=true;last=performance.now();requestAnimationFrame(step)}};
  requestAnimationFrame(step);
  function step(now){
    if(!$('#reader').hidden){on=false;return}
    const dt=Math.min(64,now-last);last=now;
    if(!document.hidden){
      const v=DRIFT.speed*(store.bed?.6:1)*DRIFT.boost*dt/1000;
      DRIFT.tracks.forEach(t=>{
        if(!t.on||t.hover||now<t.rest||!t.el.isConnected)return;
        const r=t.el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
        // Moving left to right means the scroll position goes down; wrap round by one set of books.
        t.x-=v;if(t.x<t.w)t.x+=t.w;t.el.scrollLeft=Math.round(t.x);
      });
    }
    requestAnimationFrame(step);
  }
})();
let lastSurprise='';
// Surprise me: the rows race for a moment, then a book is picked (a book not read yet when there is one) and opens.
function surprise(btn){
  const unread=STORIES.filter(s=>!store.read[s.id]);let pool=(unread.length?unread:STORIES).filter(s=>s.id!==lastSurprise);
  if(!pool.length)pool=STORIES;
  const st=pool[Math.floor(Math.random()*pool.length)];lastSurprise=st.id;
  const [x,y]=centre(btn);burst(x,y,{n:18,spread:100,big:true});sfx.glitter(12);buzz([10,30,10]);
  const go=()=>{DRIFT.boost=1;const c=[...document.querySelectorAll(`#books [data-open="${st.id}"]`)].find(b=>{const r=b.getBoundingClientRect();return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight});openStory(st.id,c?c.querySelector('.cover-art'):null)};
  if(reduced)return go();
  const t0=performance.now();btn.disabled=true;
  (function race(now){const k=Math.min(1,(now-t0)/900);DRIFT.boost=1+14*(1-k)*(1-k);if(k<1)requestAnimationFrame(race);else{btn.disabled=false;go()}})(t0);
}
$('#surprise').onclick=e=>surprise(e.currentTarget);
const shelfW={w:innerWidth,t:0};addEventListener('resize',()=>{clearTimeout(shelfW.t);shelfW.t=setTimeout(()=>{if(Math.abs(innerWidth-shelfW.w)>40){shelfW.w=innerWidth;renderShelf()}},300)});
