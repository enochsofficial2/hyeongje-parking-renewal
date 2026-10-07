import {ga4} from './ga4.js';
const statuses=['접수대기','확정','이용완료','취소'];
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const clean=(value,length=200)=>String(value??'').replace(/[\u0000-\u001f]/g,'').slice(0,length);
const iso=()=>new Date().toISOString();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const parse=value=>{try{return JSON.parse(value)}catch{return null}};
const uuid=value=>/^[a-zA-Z0-9_-]{10,80}$/.test(value||'')?value:null;
function touch(value){
 if(!value||typeof value!=='object')return null;
 return {source:clean(value.source||'direct',100),medium:clean(value.medium||'none',100),campaign:clean(value.campaign),content:clean(value.content),term:clean(value.term),adId:clean(value.adId,80),path:clean(value.path,500),referrer:clean(value.referrer,500),at:Number.isFinite(value.at)?value.at:null,sessionId:uuid(value.sessionId)};
}
function journey(value){
 if(!value||typeof value!=='object')return null;
 const touches=(Array.isArray(value.touches)?value.touches:[]).slice(-30).map(touch).filter(Boolean);
 const paths=(Array.isArray(value.paths)?value.paths:[]).slice(-100).map(x=>({path:clean(x.path,500),at:Number.isFinite(x.at)?x.at:null,sessionId:uuid(x.sessionId),kind:clean(x.kind,30)}));
 return {version:1,first:touch(value.first),second:touch(value.second),last:touch(value.last),reservation:touch(value.reservation),touches,paths};
}
async function body(request){
 if(Number(request.headers.get('content-length'))>65536)fail('요청이 너무 큽니다.',413);
 const text=await request.text();if(text.length>65536)fail('요청이 너무 큽니다.',413);
 const data=parse(text);if(!data||typeof data!=='object')fail('올바른 요청이 아닙니다.');return data;
}
async function rate(env,request,group,limit,seconds){
 const now=Date.now(),key=await hash(`${env.PROXY_SECRET}:${request.headers.get('x-client-ip')}:${group}:${Math.floor(now/(seconds*1000))}`);
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+seconds*1000).first();
 if(row.count>limit)fail('잠시 후 다시 시도해 주세요.',429);
}
async function admin(request,env){
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)hj_admin=([^;]+)/)?.[1];
 if(!token)return null;
 return env.DB.prepare('SELECT a.id,a.email FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(token),Date.now()).first();
}
const cookie=(token,age)=>`hj_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
function filters(url,table='reservations'){
 const clauses=[],values=[];
 const from=url.searchParams.get('from'),to=url.searchParams.get('to');
 if(from&&/^\d{4}-\d{2}-\d{2}$/.test(from)){clauses.push("date(created_at,'+9 hours')>=?");values.push(from)}
 if(to&&/^\d{4}-\d{2}-\d{2}$/.test(to)){clauses.push("date(created_at,'+9 hours')<=?");values.push(to)}
 if(table==='reservations'){
  const q=clean(url.searchParams.get('q'),100),status=url.searchParams.get('status');
  if(q){clauses.push('(name LIKE ? OR phone LIKE ? OR plate LIKE ? OR dest LIKE ?)');values.push(...Array(4).fill(`%${q}%`))}
  if(status&&statuses.includes(status)){clauses.push('status=?');values.push(status)}
 }
 return {where:clauses.length?' WHERE '+clauses.join(' AND '):'',values};
}
async function handle(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 if(!env.PROXY_SECRET||request.headers.get('x-proxy-secret')!==env.PROXY_SECRET)fail('허용되지 않은 요청입니다.',403);
 if(path==='/api/auth/session')return json({user:await admin(request,env)});
 if(path==='/api/internal/auth/challenge'&&request.method==='POST'){
  await rate(env,request,'login',8,900);const data=await body(request);
  const user=await env.DB.prepare('SELECT * FROM admins WHERE email=?').bind(clean(data.email,254).trim().toLowerCase()).first();
  if(!user)fail('이메일 또는 비밀번호가 올바르지 않습니다.',401);
  return json(user);
 }
 if(path==='/api/internal/auth/session'&&request.method==='POST'){
  const data=await body(request),user=await env.DB.prepare('SELECT id,email FROM admins WHERE id=?').bind(clean(data.adminId,80)).first();
  if(!user)fail('관리자 계정을 찾을 수 없습니다.',401);
  const token=crypto.randomUUID()+crypto.randomUUID();await env.DB.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').bind(await hash(token),user.id,Date.now()+8*3600000).run();
  return json({user:{id:user.id,email:user.email}},200,{'Set-Cookie':cookie(token,28800)});
 }
 if(path==='/api/auth/logout'&&request.method==='POST'){
  const token=request.headers.get('cookie')?.match(/(?:^|;\s*)hj_admin=([^;]+)/)?.[1];
  if(token)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).run();
  return json({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 if(path==='/api/reservations'&&request.method==='POST'){
  await rate(env,request,'booking',15,3600);const data=await body(request),key=clean(request.headers.get('idempotency-key'),80);
  if(!uuid(key))fail('예약 요청 키가 필요합니다.');
  for(const field of ['name','phone','dest','plate','car'])if(!clean(data[field]).trim())fail('필수 항목을 입력해 주세요.');
  if(!/^01\d[- ]?\d{3,4}[- ]?\d{4}$/.test(data.phone))fail('휴대폰 번호를 확인해 주세요.');
  const entry=new Date(`${data.inDate}T${data.inTime}+09:00`),exit=new Date(`${data.outDate}T${data.outTime}+09:00`);
  if(!Number.isFinite(+entry)||!Number.isFinite(+exit)||entry<Date.now()-60000||exit<=entry||Math.ceil((exit-entry)/86400000)<3)fail('입차·출차 일시를 확인해 주세요. 온라인 예약은 3일 이상부터 가능합니다.');
  const people=Number(data.people),golf=Number(data.golf||0);
  if(!Number.isInteger(people)||people<1||people>50||!Number.isInteger(golf)||golf<0||golf>50)fail('인원과 골프백 수량을 확인해 주세요.');
  if(data.consent!==true)fail('개인정보 수집·이용 동의가 필요합니다.');
  const id=crypto.randomUUID(),j=journey(data.journey);
  const saved=await env.DB.prepare('INSERT INTO reservations(id,created_at,name,phone,route,dest,plate,car,people,golf,note,in_date,in_time,out_date,out_time,status,visitor_id,session_id,journey,idempotency_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO UPDATE SET id=reservations.id RETURNING id').bind(id,iso(),clean(data.name,40).trim(),clean(data.phone,20),clean(data.route,30),clean(data.dest,100),clean(data.plate,30),clean(data.car,80),people,golf,clean(data.note,2000),clean(data.inDate,10),clean(data.inTime,5),clean(data.outDate,10),clean(data.outTime,5),'접수대기',uuid(data.visitorId),uuid(data.sessionId),j?JSON.stringify(j):null,key).first();
  return json({id:saved.id},201);
 }
 if(path==='/api/track'&&request.method==='POST'){
  await rate(env,request,'track',400,600);const data=await body(request);
  if(!uuid(data.visitorId)||!uuid(data.sessionId)||!uuid(data.id))fail('올바른 방문 정보가 아닙니다.');
  const names=['visit','page_view','section_view','reservation_start','reservation_submit','reservation_complete','reservation_error','phone_click','navigation_click','outbound_click','scroll_depth','engagement'];
  if(!names.includes(data.name))fail('지원하지 않는 이벤트입니다.');
  const j=journey(data.journey),last=j?.last||{};
  if(data.name==='visit')await env.DB.prepare('INSERT OR IGNORE INTO visits VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(data.id,data.visitorId,data.sessionId,iso(),last.source||'direct',last.medium||'none',last.campaign||'',clean(data.path,500),last.referrer||'',clean(data.device,20),j?JSON.stringify(j):null).run();
  await env.DB.prepare('INSERT OR IGNORE INTO events(id,visitor_id,session_id,created_at,name,path,source,medium,section,engagement_ms) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(data.id,data.visitorId,data.sessionId,iso(),data.name,clean(data.path,500),last.source||'direct',last.medium||'none',clean(data.section,100),data.name==='engagement'?Math.min(60000,Math.max(0,Number(data.engagement_ms)||0)):0).run();
  return json({ok:true});
 }
 const user=await admin(request,env);if(!user)fail('관리자 로그인이 필요합니다.',401);
 if(path==='/api/admin/reservations'){
  const {where,values}=filters(url),page=Math.max(1,Number(url.searchParams.get('page'))||1),size=Math.min(200,Math.max(1,Number(url.searchParams.get('size'))||50));
  const total=await env.DB.prepare('SELECT count(*) AS n FROM reservations'+where).bind(...values).first();
  const {results}=await env.DB.prepare('SELECT * FROM reservations'+where+' ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').bind(...values,size,(page-1)*size).all();
  return json({rows:results.map(r=>({...r,journey:parse(r.journey)})),total:total.n,page,size});
 }
 if(path.startsWith('/api/admin/reservations/')){
  const id=path.split('/').pop();
  if(request.method==='PATCH'){
   const data=await body(request);if(!statuses.includes(data.status))fail('올바른 상태가 아닙니다.');
   const result=await env.DB.prepare('UPDATE reservations SET status=? WHERE id=?').bind(data.status,id).run();if(!result.meta.changes)fail('예약을 찾을 수 없습니다.',404);return json({ok:true});
  }
  if(request.method==='DELETE'){
   const result=await env.DB.prepare('DELETE FROM reservations WHERE id=?').bind(id).run();if(!result.meta.changes)fail('예약을 찾을 수 없습니다.',404);return json({ok:true});
  }
 }
 if(path==='/api/admin/analytics'){
  const f=filters(url,'visits'),r=filters(url),and=f.where?' AND ':' WHERE ';
  const all=async sql=>(await env.DB.prepare(sql).bind(...f.values).all()).results;
  const [visits,sources,paths,events,daily,booking,journeys,statusCounts]=await Promise.all([
   env.DB.prepare('SELECT count(*) AS visits,count(DISTINCT visitor_id) AS visitors,count(DISTINCT session_id) AS sessions FROM visits'+f.where).bind(...f.values).first(),
   all('SELECT source,medium,campaign,referrer,count(*) AS visits,count(DISTINCT visitor_id) AS visitors FROM visits'+f.where+' GROUP BY source,medium,campaign,referrer ORDER BY visits DESC'),
   all("SELECT path,section,sum(CASE WHEN name IN ('page_view','section_view') THEN 1 ELSE 0 END) AS views,sum(engagement_ms) AS active_ms,count(DISTINCT session_id) AS sessions FROM events"+f.where+and+"name IN ('page_view','section_view','engagement') GROUP BY path,section ORDER BY views DESC"),
   all('SELECT name,count(*) AS count,count(DISTINCT session_id) AS sessions FROM events'+f.where+' GROUP BY name'),
   all("SELECT date(created_at,'+9 hours') AS date,count(*) AS visits,count(DISTINCT visitor_id) AS visitors,count(DISTINCT session_id) AS sessions FROM visits"+f.where+' GROUP BY date ORDER BY date DESC LIMIT 90'),
   env.DB.prepare('SELECT count(*) AS bookings FROM reservations'+r.where).bind(...r.values).first(),
   env.DB.prepare('SELECT journey,status FROM reservations'+r.where).bind(...r.values).all(),
   env.DB.prepare('SELECT status,count(*) AS count FROM reservations'+r.where+' GROUP BY status').bind(...r.values).all()
  ]);
  const conversions=new Map();
  for(const row of journeys.results){const j=parse(row.journey);for(const stage of ['first','second','reservation']){const t=j?.[stage];if(stage==='second'&&j&&!t)continue;const key=JSON.stringify([stage,t?.source||'untracked',t?.medium||'',t?.campaign||'']);const a=conversions.get(key)||{stage,source:t?.source||'untracked',medium:t?.medium||'',campaign:t?.campaign||'',bookings:0,confirmed:0};a.bookings++;if(row.status==='확정'||row.status==='이용완료')a.confirmed++;conversions.set(key,a)}}
  const engagement=await env.DB.prepare("SELECT sum(engagement_ms) AS active_ms,sum(CASE WHEN name='page_view' THEN 1 ELSE 0 END) AS pageviews FROM events"+f.where).bind(...f.values).first();
  const dailyBookings=(await env.DB.prepare("SELECT date(created_at,'+9 hours') AS date,count(*) AS bookings FROM reservations"+r.where+' GROUP BY date ORDER BY date').bind(...r.values).all()).results;
  return json({dailyBookings,summary:{...visits,...booking,...engagement},sources,paths,events,daily,conversions:[...conversions.values()].sort((a,b)=>b.bookings-a.bookings),statuses:statusCounts.results});
 }
 if(path==='/api/admin/journeys'){
  const f=filters(url,'visits'),page=Math.max(1,Number(url.searchParams.get('page'))||1);
  const rows=await env.DB.prepare('SELECT * FROM visits'+f.where+' ORDER BY created_at DESC LIMIT 50 OFFSET ?').bind(...f.values,(page-1)*50).all();
  const total=await env.DB.prepare('SELECT count(*) AS n FROM visits'+f.where).bind(...f.values).first();
  const output=[];for(const row of rows.results){const events=await env.DB.prepare("SELECT name,path,section,created_at FROM events WHERE session_id=? AND name<>'engagement' ORDER BY created_at").bind(row.session_id).all();output.push({...row,journey:parse(row.journey),events:events.results})}
  return json({rows:output,total:total.n,page});
 }
 if(path==='/api/admin/ga4')return json(await ga4(env,url.searchParams.get('from'),url.searchParams.get('to')));
 if(path==='/api/admin/settings'){
  const settings=await env.DB.prepare('SELECT * FROM settings').all();return json({settings:Object.fromEntries(settings.results.map(x=>[x.key,x.value])),storage:!!env.STORAGE,backend:'Cloudflare Workers · D1',user});
 }
 if(path==='/api/admin/media'){
  if(request.method==='GET')return json({rows:(await env.DB.prepare('SELECT * FROM media ORDER BY created_at DESC').all()).results,enabled:!!env.STORAGE});
  if(request.method==='POST'){
   if(!env.STORAGE)fail('R2 활성화가 필요합니다.',503);
   const form=await request.formData(),file=form.get('file');
   if(!file||typeof file==='string'||file.size>4*1024*1024)fail('4MB 이하 파일을 선택해 주세요.');
   if(!['image/jpeg','image/png','image/webp','image/gif','application/pdf'].includes(file.type))fail('이미지 또는 PDF만 업로드할 수 있습니다.');
   const key=crypto.randomUUID()+'-'+clean(file.name,100).replace(/[^\w.\-]/g,'_');
   await env.STORAGE.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
   await env.DB.prepare('INSERT INTO media VALUES(?,?,?,?,?)').bind(key,clean(file.name,200),file.type,file.size,iso()).run();return json({key},201);
  }
 }
 if(path.startsWith('/api/admin/media/')&&request.method==='DELETE'){
  if(!env.STORAGE)fail('R2 활성화가 필요합니다.',503);const key=decodeURIComponent(path.split('/').pop());await env.STORAGE.delete(key);await env.DB.prepare('DELETE FROM media WHERE key=?').bind(key).run();return json({ok:true});
 }
 if(path.startsWith('/api/media/')&&request.method==='GET'){
  if(!env.STORAGE)fail('파일 저장소를 사용할 수 없습니다.',503);const object=await env.STORAGE.get(decodeURIComponent(path.split('/').pop()));if(!object)fail('파일이 없습니다.',404);
  return new Response(object.body,{headers:{'Content-Type':object.httpMetadata.contentType,'Content-Disposition':'inline','X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=300'}});
 }
 fail('요청한 경로를 찾을 수 없습니다.',404);
}
export default {
 async fetch(request,env,ctx){try{return await handle(request,env,ctx)}catch(error){if(!error.status)console.error('API failure',error.message);return json({error:error.status?error.message:'처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'},error.status||500)}},
 async scheduled(_event,env){await env.DB.batch([env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Date.now()),env.DB.prepare("DELETE FROM events WHERE julianday(created_at)<julianday('now','-90 days')"),env.DB.prepare("DELETE FROM visits WHERE julianday(created_at)<julianday('now','-90 days')")])}
};
