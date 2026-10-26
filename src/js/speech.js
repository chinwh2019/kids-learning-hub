/* ================= Text with read-along spans ================= */
function richText(paras,used){
  let speech='',html='';
  for(const para of paras){
    let ph='',inQ=false,inB=false,inI=false;
    para.split('\n').forEach((line,li)=>{
      if(li)ph+='<br>';
      line.split(/\s+/).filter(Boolean).forEach(raw=>{
        /* **bold** in the Markdown, such as a du'a to learn by heart, is shown strong and read without the stars. */
        const opensB=raw.startsWith('**'),closesB=/\*\*\W*$/.test(raw),b=raw.replace(/\*\*/g,'');
        /* *italic*, such as a sound word like *drip*, is shown slanted and read without the star. */
        const opensI=/^\W*\*/.test(b),closesI=/\*\W*$/.test(b),w=b.replace(/\*/g,'');
        if(opensB)inB=true;
        if(opensI)inI=true;
        const start=speech.length;
        speech+=w.replace(/ﷺ/g,'peace be upon him')+' ';
        const startsQ=w.startsWith('"'),qn=(w.match(/"/g)||[]).length;
        let cls='w'+((inQ||startsQ)?' said':'')+(inB?' strong':'')+(inI?' em':'');
        if(closesB)inB=false;
        if(closesI)inI=false;
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
/* ================= What each page says aloud =================
   Used by the read-aloud button and by narrate.mjs, which records the same words as audio clips.
   off is where the page's own words start, after a spoken heading such as "Talk time." */
function buildPages(st){return [{t:'cover'},...st.pages.map((p,k)=>({t:'story',...p,first:k===0})),{t:'lesson'},{t:'ask'},...(st.mission?[{t:'mission'}]:[]),{t:'night'}]}
function pageSpeech(st,p){
  const said=(head,paras,tail='')=>({text:head+richText(paras,new Set()).speech.trim()+tail,off:head.length});
  if(p.t==='cover')return{text:st.title+'. Bismillah ir-Rahman ir-Raheem. In the name of Allah, the Most Gracious, the Most Merciful.',off:0};
  if(p.t==='story')return said('',p.text);
  if(p.t==='lesson')return said('What we learned. ',[st.lesson],' You lit the '+st.value.name+' star!');
  if(p.t==='ask')return said('Talk time. ',[st.ask]);
  if(p.t==='mission')return said("Tomorrow's kindness mission. ",[st.mission]);
  return{text:'Before you sleep, say: Bismika Allahumma amutu wa ahya. In your name, O Allah, I die and I live. Good night.',off:0};
}
