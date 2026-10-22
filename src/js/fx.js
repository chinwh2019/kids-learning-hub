/* ================= Sound: soft nature and paper sounds made in the browser ================= */
// No music, no instruments and no sound files: paper rustles, water drops, wind, birds and crickets,
// all synthesised with Web Audio so they work offline. Nothing plays until the reader taps something.
const SND={ctx:null,master:null,amb:null,kind:''};
function actx(){
  if(!store.sound)return null;
  if(!SND.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;SND.ctx=new C();SND.master=SND.ctx.createGain();SND.master.connect(SND.ctx.destination);volume()}
  if(SND.ctx.state==='suspended')SND.ctx.resume();
  return SND.ctx;
}
function volume(){if(SND.master)SND.master.gain.value=store.bed?.45:.8}
let NOISE=null;
function noise(c){if(!NOISE){const n=c.sampleRate*2;NOISE=c.createBuffer(1,n,c.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}return NOISE}
function env(g,t,a,v,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
function hiss(c,{type='bandpass',f0,f1,q=1,a=.01,d=.3,v=.3,t=0,out}){
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),T=c.currentTime+t;
  s.buffer=noise(c);f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,T);f.frequency.exponentialRampToValueAtTime(f1,T+a+d);
  env(g,T,a,v,d);s.connect(f).connect(g).connect(out||SND.master);s.start(T,Math.random()*1.5);s.stop(T+a+d+.05);
}
function tone(c,{f0,f1=f0,a=.005,d=.15,v=.2,t=0,out}){
  const o=c.createOscillator(),g=c.createGain(),T=c.currentTime+t;
  o.frequency.setValueAtTime(f0,T);o.frequency.exponentialRampToValueAtTime(f1,T+a+d*.6);
  env(g,T,a,v,d);o.connect(g).connect(out||SND.master);o.start(T);o.stop(T+a+d+.05);
}
const sfx={
  page(){const c=actx();if(!c)return;hiss(c,{f0:900,f1:4200,q:.7,a:.05,d:.34,v:.2});hiss(c,{type:'lowpass',f0:420,f1:160,a:.004,d:.14,v:.16,t:.3})},
  drop(p=1){const c=actx();if(!c)return;const f=(480+Math.random()*260)*p;tone(c,{f0:f,f1:f*2.6,d:.13,v:.2})},
  glitter(n=8){const c=actx();if(!c)return;for(let i=0;i<n;i++){const f=2400+Math.random()*2600;tone(c,{f0:f,f1:f*1.25,d:.07+Math.random()*.12,v:.045,t:i*.055+Math.random()*.03})}},
  whoosh(){const c=actx();if(!c)return;hiss(c,{f0:260,f1:2600,q:1.4,a:.3,d:.5,v:.18})},
  tap(){const c=actx();if(!c)return;tone(c,{f0:1300,f1:900,d:.05,v:.05})}
};

/* Ambience: each scene has a soundscape that fades in under the story. */
const AMB={hungryGuest:'wind',onlyWater:'wind',whoWill:'wind',iWill:'wind',whisper:'night',plan:'night',lampOut:'night',happyHearts:'night',verse:'birds',allahSees:'night',desertWalk:'wind',wellDrink:'water',thirstyDog:'wind',shoeClimb:'water',dogDrinks:'water',kindNight:'night',kingdom:'birds',march:'birds',antCall:'birds',gratitude:'birds',safeHome:'birds',sale:'birds',digging:'birds',jarGlow:'night',backForth:'birds',wiseMan:'birds',wedding:'birds',charity:'birds',farYemen:'birds',listening:'wind',uwaisMother:'night',caravan:'wind',found:'wind',meeting:'wind',dua:'night',kufa:'water',yunusTown:'birds',fullShip:'water',lots:'water',bigFish:'water',darkness:'night',yunusDua:'night',answered:'water',beachPlant:'water',townBelieves:'birds',duaToday:'night',threeMen:'birds',angelSent:'wind',skinHealed:'birds',hairGrows:'birds',sightBack:'birds',valleys:'birds',angelReturns:'wind',firstRefuses:'wind',secondRefuses:'wind',sharing:'birds',pleased:'wind',lesson:'wind',talk:'birds',mission:'birds',night:'night'};
const AMB_EVENTS={
  birds(c,out){const n=2+Math.floor(Math.random()*3),f=2600+Math.random()*1600,up=Math.random()>.5;for(let k=0;k<n;k++)tone(c,{f0:f,f1:f*(up?1.45:.7),d:.07,v:.035,t:k*.12,out});return 1400+Math.random()*3600},
  night(c,out){for(let r=0;r<2;r++)for(let k=0;k<3;k++)tone(c,{f0:4700,f1:4550,a:.004,d:.022,v:.018,t:r*.36+k*.05,out});return 900+Math.random()*900},
  water(c,out){const f=380+Math.random()*420;tone(c,{f0:f,f1:f*2.4,d:.12,v:.06,out});return 700+Math.random()*2200},
  wind(){return 4000}
};
function ambience(kind){
  if(!kind||kind===SND.kind&&SND.amb)return;
  stopAmbience();const c=actx();if(!c)return;
  const out=c.createGain(),s=c.createBufferSource(),f=c.createBiquadFilter(),lfo=c.createOscillator(),lg=c.createGain(),wg=c.createGain();
  out.gain.value=.0001;out.connect(SND.master);out.gain.setTargetAtTime(R.playing?.4:1,c.currentTime,.6);
  s.buffer=noise(c);s.loop=true;f.type='lowpass';f.frequency.value=380;lfo.frequency.value=.07;lg.gain.value=230;lfo.connect(lg).connect(f.frequency);
  wg.gain.value={wind:.15,night:.03,water:.045,birds:.04}[kind];s.connect(f).connect(wg).connect(out);s.start();lfo.start();
  const me={out,nodes:[s,lfo],timer:0};SND.amb=me;SND.kind=kind;
  (function next(){if(SND.amb!==me)return;me.timer=setTimeout(next,AMB_EVENTS[kind](c,out))})();
}
function stopAmbience(){
  const a=SND.amb;SND.amb=null;SND.kind='';if(!a)return;clearTimeout(a.timer);
  const c=SND.ctx;a.out.gain.cancelScheduledValues(c.currentTime);a.out.gain.setTargetAtTime(.0001,c.currentTime,.35);
  setTimeout(()=>{a.nodes.forEach(n=>{try{n.stop()}catch(e){}});a.out.disconnect()},1600);
}
// Keep the soundscape quieter while the book is reading aloud.
function duck(on){if(SND.amb&&SND.ctx)SND.amb.out.gain.setTargetAtTime(on?.4:1,SND.ctx.currentTime,.4)}
document.addEventListener('visibilitychange',()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend();else if(store.sound)SND.ctx.resume()});

/* ================= Sparkles ================= */
// A burst of little lights at a point on the screen: the "magic touch" on pictures, and every celebration.
function burst(x,y,{n=12,spread=70,big=false}={}){
  if(reduced)return;const layer=$('#fx');
  for(let i=0;i<n;i++){
    const m=document.createElement('i'),a=Math.random()*6.283,d=spread*(.35+Math.random()*.65);
    m.className='mote'+(i%3?'':' star')+(big?' big':'');
    m.style.cssText=`left:${x}px;top:${y}px;--dx:${(Math.cos(a)*d).toFixed(1)}px;--dy:${(Math.sin(a)*d-spread*.3).toFixed(1)}px;--s:${(.5+Math.random()*.9).toFixed(2)};--t:${(700+Math.random()*600)|0}ms`;
    layer.append(m);setTimeout(()=>m.remove(),1400);
  }
}
const centre=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* ================= Opening a book ================= */
// The cover lifts off the shelf and grows into the open book.
function zoomFrom(src){
  const dst=$('#bookview .leaf .art');if(reduced||!src||!dst)return;
  const a=src.getBoundingClientRect(),b=dst.getBoundingClientRect();if(!a.width||!b.width)return;
  const fly=document.createElement('div');fly.className='fly';fly.innerHTML=dst.innerHTML;
  fly.style.cssText=`left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px`;
  document.body.append(fly);dst.style.visibility='hidden';$('#reader').classList.add('opening');
  fly.animate([{transform:`translate(${a.left-b.left}px,${a.top-b.top}px) scale(${a.width/b.width},${a.height/b.height})`,borderRadius:'18px',boxShadow:'0 20px 40px -20px rgba(0,0,0,.5)'},{transform:'none',borderRadius:'20px',boxShadow:'0 40px 80px -30px rgba(0,0,0,.7)'}],{duration:700,easing:'cubic-bezier(.2,.85,.25,1)'})
    .onfinish=()=>{dst.style.visibility='';fly.remove();$('#reader').classList.remove('opening')};
}

/* ================= Living cards and hero ================= */
// Cards tilt towards the pointer with a soft glint; the hero's lanterns and dunes shift with depth.
if(!reduced&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.addEventListener('pointermove',e=>{
    const card=e.target.closest('.book,.tonight');
    document.querySelectorAll('.tilting').forEach(c=>{if(c!==card){c.classList.remove('tilting');c.style.removeProperty('transform')}});
    if(card){const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.classList.add('tilting');card.style.transform=`perspective(900px) rotateX(${((.5-y)*8).toFixed(2)}deg) rotateY(${((x-.5)*10).toFixed(2)}deg) translateY(-6px)`;card.style.setProperty('--gx',(x*100).toFixed(1)+'%');card.style.setProperty('--gy',(y*100).toFixed(1)+'%')}
    const h=$('.hero');if(h&&!document.body.classList.contains('reading')){h.style.setProperty('--px',(e.clientX/innerWidth-.5).toFixed(3));h.style.setProperty('--py',(e.clientY/innerHeight-.5).toFixed(3))}
  });
}
