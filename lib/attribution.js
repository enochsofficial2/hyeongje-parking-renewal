'use client';
const KEY='hj_journey_v1',TTL=90*86400000;
let memory=null,loaded=false,session=null,lastActivity=0,lastEntry='',visitor=null;
const own=host=>['hjairport.com','www.hjairport.com',location.hostname].includes(host);
export function safePath(href){try{const u=new URL(href,location.origin);return u.pathname+u.hash.slice(0,100)}catch{return '/'}}
function capture(url,referrer,id,now){
 const p=url.searchParams;let source='direct',medium='none',ref='';
 try{const r=new URL(referrer);if(!own(r.hostname)){ref=r.origin+r.pathname;const h=r.hostname.toLowerCase();
 const rules=[['cafe.naver.com','naver_cafe','community'],['blog.naver.com','naver_blog','blog'],['naver.com','naver','organic'],['mail.google.com','gmail','email'],['maps.google.com','google_maps','referral'],['docs.google.com','google_docs','referral'],['google.','google','organic'],['duckduckgo.com','duckduckgo','organic'],['search.yahoo.com','yahoo','organic'],['daum.net','daum','organic'],['bing.com','bing','organic'],['instagram.com','instagram','social'],['facebook.com','facebook','social'],['fb.com','facebook','social'],['threads.','threads','social'],['youtube.com','youtube','social_video'],['youtu.be','youtube','social_video'],['tistory.com','tistory','blog'],['kakao.com','kakaotalk','messenger'],['x.com','x','social'],['twitter.com','x','social'],['chatgpt.com','chatgpt','ai_assistant'],['perplexity.ai','perplexity','ai_assistant'],['claude.ai','claude','ai_assistant'],['chat.openai.com','chatgpt','ai_assistant'],['gemini.google.com','gemini','ai_assistant'],['copilot.microsoft.com','copilot','ai_assistant']];
 rules.sort((a,b)=>b[0].length-a[0].length);const match=rules.find(([d])=>h===d||h.endsWith('.'+d)||(d.endsWith('.')&&(h.startsWith(d)||h.includes('.'+d))));source=match?.[1]||h;medium=match?.[2]||'referral';}}
 catch{}
 if(p.has('ads')){source='ads_'+(p.get('ads')?.trim()||'blank');medium='cpc'}
 else if(p.get('utm_source')){source=p.get('utm_source').trim().toLowerCase();medium=p.get('utm_medium')?.trim().toLowerCase()||'custom_utm'}
 else if(p.get('gclid')||p.get('gbraid')||p.get('wbraid')){source='google';medium='cpc'}
 else if(p.get('msclkid')){source='bing';medium='cpc'}
 else if(p.get('fbclid')){source='facebook';medium='social'}
 return {source:source.slice(0,100),medium:medium.slice(0,100),campaign:(p.get('utm_campaign')||'').slice(0,200),content:(p.get('utm_content')||'').slice(0,200),term:(p.get('utm_term')||'').slice(0,200),adId:(p.get('meta_ad_id')||p.get('ad_id')||'').slice(0,80),path:safePath(url.href),referrer:ref.slice(0,500),sessionId:id,at:now};
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(memory));localStorage.setItem('hj_visitor',visitor);sessionStorage.setItem('hj_session',session);sessionStorage.setItem('hj_activity',String(lastActivity))}catch{}}
export function readJourney(){
 if(typeof window==='undefined')return null;
 const now=Date.now(),url=new URL(location.href);let firstLoad=!loaded;
 if(!loaded){loaded=true;try{memory=JSON.parse(localStorage.getItem(KEY)||'null');visitor=localStorage.getItem('hj_visitor');session=sessionStorage.getItem('hj_session');lastActivity=Number(sessionStorage.getItem('hj_activity'))||0}catch{}}
 if(!memory?.first||!memory?.last||!Number.isFinite(memory.first.at)||memory.first.at>now||now-memory.first.at>TTL||!Array.isArray(memory.touches)||!Array.isArray(memory.paths))memory=null;
 visitor=visitor||crypto.randomUUID();let external=false;
 if(firstLoad&&performance.getEntriesByType('navigation')[0]?.type!=='reload'){try{external=!!document.referrer&&!own(new URL(document.referrer).hostname)}catch{}}
 const newSession=!session||now-lastActivity>30*60000||external;
 if(newSession)session=crypto.randomUUID();lastActivity=now;
 const entry=capture(url,firstLoad?document.referrer:'',session,now);
 const explicit=['ads','utm_source','gclid','gbraid','wbraid','msclkid','fbclid'].some(x=>url.searchParams.has(x));
 const signature=JSON.stringify([entry.source,entry.medium,entry.campaign,entry.content,entry.adId]);
 if(!memory||newSession||external||(explicit&&lastEntry!==signature&&JSON.stringify([memory.last.source,memory.last.medium,memory.last.campaign,memory.last.content,memory.last.adId])!==signature)){
  const touches=[...(memory?.touches||[]),entry].slice(-30);
  memory={version:1,first:memory?.first||entry,second:memory?.second||((memory?.first&&entry.at!==memory.first.at)?entry:null),last:entry,touches,paths:memory?.paths||[]};
 }
 lastEntry=signature;memory.reservation={...memory.last,path:safePath(location.href),at:now};persist();
 return {visitorId:visitor,sessionId:session,journey:JSON.parse(JSON.stringify(memory))};
}
export function recordPath(path,kind='page'){
 const data=readJourney();if(!data)return;
 const previous=memory.paths.at(-1);
 if(previous?.path!==path||previous?.sessionId!==session){memory.paths=[...memory.paths,{path,kind,at:Date.now(),sessionId:session}].slice(-100);persist()}
 return readJourney();
}
export function track(name,extra={}){
 if(typeof window==='undefined'||location.pathname.startsWith('/admin'))return;
 const data=readJourney();if(!data)return;
 const payload={id:crypto.randomUUID(),name,path:safePath(location.href),device:matchMedia('(max-width:760px)').matches?'mobile':'desktop',...data,...extra};
 fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
 const t=data.journey.last;
 const gaName=name==='reservation_complete'?'generate_lead':name;
 const params={page_location:location.origin+safePath(location.href),page_path:safePath(location.href),traffic_source:t.source,traffic_medium:t.medium,first_source:data.journey.first.source,second_source:data.journey.second?.source||'none',reservation_source:t.source,campaign_name:t.campaign,section:extra.section||'',percent_scrolled:name==='scroll_depth'?Number(extra.section):undefined,lead_type:name==='reservation_complete'?'parking_reservation':undefined};
 if(name!=='visit'&&name!=='engagement')window.gtag?.('event',gaName,params);
}
