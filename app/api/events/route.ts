import { env } from 'cloudflare:workers';
import { sb, supabaseEnabled } from '../../../lib/supabase';
export const dynamic = 'force-dynamic';
const standard = ['Rumah Doa','Menara Doa','Doa Keliling','Doa Pengerja','COOL JC & Youth','COOL Anak','Fellowship Pemusik'];
const json = (value: unknown, status = 200) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const db = () => { if (!env.DB) throw Error('Database unavailable'); return env.DB; };
const sameOrigin = (r: Request) => {const o=r.headers.get('Origin');return !o || o===new URL(r.url).origin};
function validate(raw: any) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[a-zA-Z0-9.-]{1,80}$/.test(raw.id) || typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
  const date = new Date(raw.date+'T00:00:00Z'); if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==raw.date) return null;
  if (typeof raw.category !== 'string' || !raw.category.trim() || raw.category.trim().length>60 || /[\u0000-\u001f]/.test(raw.category)) return null;
  if (typeof raw.time !== 'string' || (raw.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time))) return null;
  if (typeof raw.location !== 'string' || raw.location.length>120 || typeof raw.note !== 'string' || raw.note.length>300) return null;
  return {id:raw.id,date:raw.date,category:raw.category.trim(),time:raw.time,location:raw.location.trim(),note:raw.note.trim()};
}
export async function GET() {try {if(supabaseEnabled()){const [events,categories]=await Promise.all([sb<unknown[]>('calendar_events?select=id,date,category,time,location,note&order=date,time,category'),sb<{name:string}[]>('calendar_categories?select=name&order=name')]);return json({events,categories:categories.map(r=>r.name)});}const [events,categories]=await db().batch([db().prepare('SELECT id,date,category,time,location,note FROM calendar_events ORDER BY date,time,category'),db().prepare('SELECT name FROM calendar_categories ORDER BY name')]);return json({events:events.results,categories:categories.results.map((r:any)=>r.name)});} catch {return json({error:'Kalender belum dapat dimuat'},503)} }
async function write(request: Request, update: boolean) {
  if(!sameOrigin(request)) return json({error:'Origin tidak diizinkan'},403);
  try { if(Number(request.headers.get('content-length')||0)>10000)return json({error:'Data terlalu besar'},413);
    const v=validate(await request.json());if(!v)return json({error:'Periksa tanggal dan rincian acara'},400); if(supabaseEnabled()){const q=encodeURIComponent(v.id);
      if(update){const hit=await sb<unknown[]>(`calendar_events?select=id&id=eq.${q}`);if(!hit.length)return json({error:'Acara sudah tidak tersedia'},404)}
      if(!standard.includes(v.category))await sb('calendar_categories',{method:'POST',body:{name:v.category},prefer:'resolution=ignore-duplicates,return=minimal'});
      if(update)await sb(`calendar_events?id=eq.${q}`,{method:'PATCH',body:{date:v.date,category:v.category,time:v.time,location:v.location,note:v.note},prefer:'return=minimal'});else await sb('calendar_events',{method:'POST',body:v,prefer:'return=minimal'});
      return json({ok:true})}
    const database=db();
    if(update){const exists=await database.prepare('SELECT id FROM calendar_events WHERE id=?').bind(v.id).first();if(!exists)return json({error:'Acara sudah tidak tersedia'},404)}
    const event=update?database.prepare('UPDATE calendar_events SET date=?,category=?,time=?,location=?,note=? WHERE id=?').bind(v.date,v.category,v.time,v.location,v.note,v.id):database.prepare('INSERT INTO calendar_events (id,date,category,time,location,note) VALUES (?,?,?,?,?,?)').bind(v.id,v.date,v.category,v.time,v.location,v.note);
    if(standard.includes(v.category))await event.run();else await database.batch([database.prepare('INSERT OR IGNORE INTO calendar_categories (name) VALUES (?)').bind(v.category),event]);
    return json({ok:true});
  }catch{return json({error:'Acara belum berhasil disimpan. Coba lagi.'},503)}
}
export async function POST(r:Request){return write(r,false)}
export async function PUT(r:Request){return write(r,true)}
export async function DELETE(r:Request){if(!sameOrigin(r))return json({error:'Origin tidak diizinkan'},403);try{const id=new URL(r.url).searchParams.get('id');if(!id||!/^[a-zA-Z0-9.-]{1,80}$/.test(id))return json({error:'ID tidak valid'},400);if(supabaseEnabled())await sb(`calendar_events?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',prefer:'return=minimal'});else await db().prepare('DELETE FROM calendar_events WHERE id=?').bind(id).run();return json({ok:true})}catch{return json({error:'Acara belum berhasil dihapus'},503)}}
