import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const names = ['Ishak','Sari','Esther R','Farid','Iffi','Melky','Ester F','Rindu','Desi','Priska','Leni','Anes','Regina'];
const types = ['ibadah','ibadahkc','cooljc','coolanak','coolkc','cool','doa'];
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control':'no-store'}});
function isRecord(x: any) {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !/^[A-Za-z0-9.-]{1,80}$/.test(x.id) || typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !types.includes(x.type) || !Number.isSafeInteger(x.total) || x.total < 0 || x.total > 100000) return false;
  if (x.newcomers !== undefined && (x.type !== 'ibadah' || !Number.isSafeInteger(x.newcomers) || x.newcomers < 0 || x.newcomers > x.total)) return false;
  const d = new Date(x.date + 'T00:00:00Z'); if (Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== x.date) return false;
  if (x.type === 'doa') {
    if (!Array.isArray(x.absent) || x.absent.some((n: unknown) => typeof n !== 'string' || !names.includes(n)) || new Set(x.absent).size !== x.absent.length || x.total !== names.length - x.absent.length) return false;
    if (x.reasons !== undefined && (!x.reasons || typeof x.reasons !== 'object' || Array.isArray(x.reasons) || Object.entries(x.reasons).some(([n,r]) => !x.absent.includes(n) || !['Sakit','Kerja','Nihil'].includes(r as string)))) return false;
  } else {
    const length = x.type === 'ibadah' ? 3 : x.type === 'ibadahkc' || x.type === 'cool' ? 2 : 0;
    if (!Array.isArray(x.groups) || x.groups.length !== length || x.groups.some((n: unknown) => !Number.isSafeInteger(n) || (n as number) < 0 || (n as number) > 100000) || x.groups.reduce((a: number,b: number)=>a+b,0) > x.total || (x.type === 'ibadahkc' && x.groups[0] + x.groups[1] !== x.total)) return false;
  }
  return true;
}
function db() { if (!env.DB) throw new Error('Database unavailable'); return env.DB; }
function sameOrigin(request: Request) { const origin = request.headers.get('Origin'); return !origin || origin === new URL(request.url).origin; }
export async function GET() { try { const result = await db().prepare('SELECT payload FROM attendance ORDER BY date, id').all<{payload:string}>(); return json(result.results.map(row=>JSON.parse(row.payload))); } catch {return json({error:'Database belum tersedia'},503)} }
async function write(request: Request, update: boolean) {
  if (!sameOrigin(request)) return json({error:'Origin tidak diizinkan'},403);
  try {
    if (Number(request.headers.get('content-length') || 0)>16000) return json({error:'Data terlalu besar'},413);
    const input = await request.json(); if (!isRecord(input)) return json({error:'Data tidak valid'},400);
    const x = input as any;
    const record: any = {id:x.id,date:x.date,type:x.type,total:x.total,...(x.type==='doa'?{absent:x.absent,...(x.reasons?{reasons:x.reasons}:{})}:{groups:x.groups}),...(x.type==='ibadah' && x.newcomers!==undefined?{newcomers:x.newcomers}:{})};
    const database=db();
    // Older clients omit newcomers. Preserve the value instead of silently erasing it.
    if(update && x.type==='ibadah' && x.newcomers===undefined) {
      const existing = await database.prepare('SELECT payload FROM attendance WHERE id=?').bind(record.id).first<{payload:string}>();
      if(existing) { const old=JSON.parse(existing.payload); if(Number.isSafeInteger(old.newcomers) && old.newcomers>=0) { if(old.newcomers>record.total) return json({error:'Total hadir lebih kecil dari jumlah jemaat baru. Muat ulang dan periksa kembali.'},409); record.newcomers=old.newcomers; } }
    }
    // An update may change a record, but cannot overwrite another record for the same meeting.
    if(update) { const result = await database.prepare('UPDATE attendance SET date=?2,type=?3,payload=?4 WHERE id=?1').bind(record.id,record.date,record.type,JSON.stringify(record)).run(); if (!result.meta.changes) return json({error:'Catatan tidak ditemukan'},404); } else { await database.prepare('INSERT INTO attendance (id,date,type,payload) VALUES (?1,?2,?3,?4)').bind(record.id,record.date,record.type,JSON.stringify(record)).run(); }
    return json({ok:true});
  } catch (e) { if (String(e).includes('UNIQUE constraint failed')) return json({error:'Catatan untuk jenis dan tanggal ini sudah ada'},409); return json({error:'Tidak dapat menyimpan catatan'},503); }
}
export async function POST(request: Request) { return write(request, false); }
export async function PUT(request: Request) { return write(request, true); }
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({error:'Origin tidak diizinkan'},403);
  try { const id=new URL(request.url).searchParams.get('id'); if (!id || !/^[A-Za-z0-9.-]{1,80}$/.test(id)) return json({error:'ID tidak valid'},400); await db().prepare('DELETE FROM attendance WHERE id = ?').bind(id).run(); return json({ok:true}); } catch {return json({error:'Tidak dapat menghapus catatan'},503)}
}
