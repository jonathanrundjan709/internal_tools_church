/* Dashboard flow refinements. Wraps globals defined in dashboard.html's main script. */
(()=>{
const $=s=>document.querySelector(s);
const ICON={
 home:'<path d="M3.5 10.5 12 3.8l8.5 6.7v8a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z"/><path d="M9.3 20.2v-6.4h5.4v6.4"/>',
 analytics:'<path d="M4 19.5h16M6.5 16V11m5.5 5V5m5.5 11V8"/>',
 history:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17"/>',
 poster:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m6 17 4-4 2.5 2.5 2-2 3.5 3.5"/>'};
const svg=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ---- Toasts ---- */
const box=document.createElement('div');box.id='toasts';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;box.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),300)},3200)}

/* ---- Sidebar: icons, primary action, scroll-synced active state ---- */
const nav=$('.nav');
if(nav){
 const items=[['home','Beranda',"window.scrollTo({top:0})"],['analytics','Analisis',"document.querySelector('#analytics').scrollIntoView()"],['history','Riwayat',"document.querySelector('#history').scrollIntoView()"],['calendar','Kalender',"document.querySelector('#calendar').scrollIntoView()"],['poster','Studio Poster',"location.href='/poster'"]];
 nav.innerHTML=items.map(([k,l,a],i)=>`<button data-target="${k}" ${i?'':'aria-current="page" class="active"'} onclick="${a}">${svg(k)}<span>${l}</span></button>`).join('');
 const cta=document.createElement('button');cta.className='side-cta';cta.type='button';cta.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Catat kehadiran';cta.onclick=()=>openForm();
 nav.closest('.sidebar').insertBefore(cta,nav.parentElement);
 const secs=['analytics','history','calendar'].map(id=>document.getElementById(id));
 let t;const sync=()=>{let cur='home';for(const s of secs)if(s&&s.getBoundingClientRect().top<=140)cur=s.id;
  nav.querySelectorAll('button[data-target]').forEach(b=>{const on=b.dataset.target===cur;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})};
 addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(sync,60)},{passive:true});sync();
}

/* ---- Hero: last-recorded nudge + quick-start shortcuts ---- */
const hero=$('.hero');
if(hero){
 const left=hero.firstElementChild,btn=hero.querySelector('.primary');
 left.classList.add('hero-copy');
 const note=document.createElement('p');note.className='lastnote';note.id='lastNote';left.appendChild(note);
 const side=document.createElement('div');side.className='hero-side';
 hero.appendChild(side);side.appendChild(btn);
 const q=document.createElement('div');q.className='quick';q.setAttribute('aria-label','Pintasan cepat');
 q.innerHTML=[['ibadah','Ibadah Raya'],['ibadahkc','Ibadah KC'],['cooljc','COOL'],['doa','Rumah Doa']].map(([t,l])=>`<button type="button" data-q="${t}">${l}</button>`).join('');
 q.onclick=e=>{const b=e.target.closest('[data-q]');if(b)openForm(null,b.dataset.q)};
 side.appendChild(q);
}
function daysAgo(s){const a=new Date(s+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.round((b-a)/864e5)}
function updateLast(){const el=$('#lastNote');if(!el)return;
 const mine=records.filter(r=>r.type==='ibadah').sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(!mine){el.textContent='Belum ada catatan Ibadah Raya. Mulai dengan satu pertemuan.';return}
 const d=daysAgo(mine.date),rel=d<=0?'hari ini':d===1?'kemarin':d+' hari lalu';
 el.innerHTML=`Ibadah Raya terakhir dicatat: <b>${dateFmt(mine.date)}</b> (${rel})${d>7?' — sudah waktunya mencatat lagi.':''}`}

/* ---- Cards: show how many meetings back each average ---- */
function updateCards(){const data=filtered();
 for(const [t,id] of [['ibadah','sIbadah'],['ibadahkc','sIbadahKC'],['cooljc','sCoolJC'],['coolanak','sCoolAnak'],['doa','sDoa']]){
  const n=data.filter(x=>x.type===t).length,s=document.getElementById(id)?.nextElementSibling;
  if(s)s.innerHTML=n?`Rata-rata hadir · <b>${n} pertemuan</b>`:'Belum ada catatan'}}

/* ---- History: type filter + show more ---- */
const hl=$('#historyList');let filter='all',showAll=false;const LIMIT=8;
if(hl){
 const bar=document.createElement('div');bar.className='chips';bar.id='historyFilter';bar.setAttribute('role','group');bar.setAttribute('aria-label','Saring catatan');
 bar.innerHTML=[['all','Semua'],['ibadah','Ibadah Raya'],['ibadahkc','Ibadah KC'],['cool','COOL'],['doa','Rumah Doa']].map(([k,l])=>`<button type="button" data-f="${k}" aria-pressed="${k==='all'}" class="${k==='all'?'active':''}">${l}</button>`).join('');
 hl.parentElement.insertBefore(bar,hl);hl.style.marginTop='10px';
 bar.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;showAll=false;bar.querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});applyHistory()};
}
const match=(t,f)=>f==='all'||(f==='cool'?t.startsWith('cool'):t===f);
function applyHistory(){if(!hl)return;
 hl.querySelector('.morebtn')?.remove();hl.querySelector('.filter-empty')?.remove();
 const rows=[...hl.querySelectorAll('.row')];if(!rows.length)return;
 const vis=rows.filter(row=>{const id=(row.querySelector('.textbtn')?.getAttribute('onclick')||'').match(/'([^']+)'/)?.[1],r=records.find(x=>x.id===id),ok=!!r&&match(r.type,filter);row.dataset.ok=ok?'1':'';return ok});
 rows.forEach(r=>r.hidden=true);
 if(!vis.length){const d=document.createElement('div');d.className='listempty filter-empty';d.textContent='Tidak ada catatan untuk jenis ini di periode ini.';hl.appendChild(d);return}
 vis.forEach((r,i)=>r.hidden=!showAll&&i>=LIMIT);
 if(!showAll&&vis.length>LIMIT){const m=document.createElement('button');m.type='button';m.className='morebtn';m.textContent=`Tampilkan semua (${vis.length} catatan)`;m.onclick=()=>{showAll=true;applyHistory()};hl.appendChild(m)}
 const lastVisible=vis.filter(r=>!r.hidden).at(-1);rows.forEach(r=>r.style.borderBottom=r===lastVisible?'0':'')}
const style=document.createElement('style');style.textContent='.row[hidden]{display:none!important}';document.head.appendChild(style);

const baseRender=render;
render=function(){baseRender();updateCards();updateLast();applyHistory()};

/* ---- Entry form ---- */
const baseOpen=openForm;
openForm=function(id,preset){baseOpen(id);if(!id&&preset&&preset!==type){drafts={};setType(preset,{})}checkDup()};

const dup=document.createElement('div');dup.className='dup';dup.setAttribute('role','status');
$('#error').parentElement.insertBefore(dup,$('#error'));
function checkDup(){
 const date=form.elements.date.value,ex=records.find(x=>x.date===date&&x.id!==editId&&x.type===type);
 if(ex){dup.innerHTML=`Sudah ada catatan ${labels[type]} untuk ${dateFmt(date)}. <button type="button">Ubah catatan itu</button>`;dup.classList.add('show');dup.querySelector('button').onclick=()=>{modal.close();openForm(ex.id)}}
 else{dup.classList.remove('show');dup.textContent=''}}
form.addEventListener('change',e=>{if(e.target.name==='date'||e.target.id==='coolChoice')setTimeout(checkDup,0)});
document.querySelector('.tabs').addEventListener('click',()=>setTimeout(checkDup,0));

const baseFields=renderFields;
renderFields=function(r){baseFields(r);
 if(type==='doa'&&!document.querySelector('.doa-tools')){
  const checks=document.querySelector('#formFields .checks'),bar=document.createElement('div');bar.className='doa-tools';
  bar.innerHTML='<span class="hint" style="margin:0">Mulai dengan semua hadir.</span><button type="button">Tandai semua hadir</button>';
  bar.querySelector('button').onclick=()=>{document.querySelectorAll('[name=absent]:checked').forEach(c=>{c.checked=false;delete absenceReasons[c.value];const l=c.closest('.check').querySelector('.reason-link');if(l)l.textContent=''});updateCount()};
  checks.parentElement.insertBefore(bar,checks)}};

/* ---- Success feedback ---- */
const baseSubmit=form.onsubmit;
form.onsubmit=async e=>{const was=modal.open,isEdit=!!editId;await baseSubmit(e);if(was&&!modal.open)toast(isEdit?'Perubahan disimpan':'Catatan tersimpan')};
const baseRemove=removeRecord;
removeRecord=async function(id){const n=records.length;await baseRemove(id);if(records.length<n)toast('Catatan dihapus')};

/* Re-render now that wrappers are installed (data may already be loaded). */
render();
})();
