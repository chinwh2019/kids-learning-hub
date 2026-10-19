/* ================= Helpers ================= */
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shade(hex,a){const n=parseInt(hex.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(a<0?v*(1+a):v+(255-v)*a));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let store={read:{},fs:1,bed:false,sound:true,missions:{pending:null,done:[]}};
try{Object.assign(store,JSON.parse(localStorage.getItem('qissa-time')||'{}'))}catch(e){}
function save(){try{localStorage.setItem('qissa-time',JSON.stringify(store))}catch(e){}}

