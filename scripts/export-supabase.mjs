import fs from 'node:fs/promises';
export async function exportSource(page) {
 const result=await page.evaluate(async()=>{
  const session=JSON.parse(localStorage.getItem('supabase.dashboard.auth.token'));
  const query=async sql=>{const r=await fetch('https://api.supabase.com/v1/projects/aypohyjkuhfncnyynmuw/database/query',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({query:sql})});const b=await r.json();if(!r.ok)throw new Error(JSON.stringify(b));return b};
  const policies=await query("select policyname,qual,with_check from pg_policies where tablename='reservations'");
  const reservations=await query('select * from public.reservations');
  const admins=await query("select id,email,encrypted_password as password_hash from auth.users where deleted_at is null");
  const stats=await query('select * from public.stats');
  const referrers=await query('select * from public.referrer_stats');
  const buckets=await query('select id,name,public from storage.buckets');
  const objects=await query('select bucket_id,name from storage.objects');
  return {reservations,admins,stats,referrers,buckets,objects,policies};
 });
 const dir='C:/Users/denky/Documents/webs/hyeongje-parking-renewal/.migration';
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/source-backup.json',JSON.stringify(result));
 return {reservations:result.reservations.length,admins:result.admins.map(a=>a.email),buckets:result.buckets,objects:result.objects.length,policies:result.policies};
}
