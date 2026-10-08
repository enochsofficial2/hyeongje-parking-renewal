const now=()=>new Date().toISOString();
export function notificationConfig(env){
 const missing=['SOLAPI_API_KEY','SOLAPI_API_SECRET','SOLAPI_PF_ID','SOLAPI_CUSTOMER_TEMPLATE','SOLAPI_OPERATOR_TEMPLATE','SOLAPI_OPERATOR_PHONE'].filter(key=>!env[key]);
 return {enabled:!missing.length,missing,operatorPhone:env.SOLAPI_OPERATOR_PHONE,customerTemplate:env.SOLAPI_CUSTOMER_TEMPLATE,operatorTemplate:env.SOLAPI_OPERATOR_TEMPLATE};
}
async function authorization(env){
 const date=now(),salt=crypto.randomUUID().replaceAll('-','');
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.SOLAPI_API_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(date+salt)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 return `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}
function message(env,job,reservation){
 const operator=job.recipient_role==='operator';
 const variables={'#{예약자명}':reservation.name,'#{입차일시}':`${reservation.in_date} ${reservation.in_time}`,'#{차량번호}':reservation.plate,'#{예약번호}':reservation.id};
 if(operator)Object.assign(variables,{'#{연락처}':reservation.phone,'#{차종}':reservation.car,'#{출차일시}':`${reservation.out_date} ${reservation.out_time}`});
 return {to:(operator?env.SOLAPI_OPERATOR_PHONE:reservation.phone).replace(/\D/g,''),type:'ATA',kakaoOptions:{pfId:env.SOLAPI_PF_ID,templateId:operator?env.SOLAPI_OPERATOR_TEMPLATE:env.SOLAPI_CUSTOMER_TEMPLATE,disableSms:true,variables},customFields:{reservationId:reservation.id,notificationId:job.id,recipientRole:job.recipient_role}};
}
export async function dispatchNotifications(env,reservationId){
 if(!notificationConfig(env).enabled)return;
 // An interrupted HTTP request may already have been accepted. Never blindly resend it.
 await env.DB.prepare("UPDATE reservation_notifications SET status='unknown',error_code='INTERRUPTED_REQUEST',updated_at=? WHERE status='sending' AND updated_at<?").bind(now(),new Date(Date.now()-5*60000).toISOString()).run();
 const {results}=await env.DB.prepare("SELECT id FROM reservation_notifications WHERE status='pending'"+(reservationId?' AND reservation_id=?':'')+' ORDER BY created_at LIMIT 20').bind(...(reservationId?[reservationId]:[])).all();
 for(const row of results){
  const job=await env.DB.prepare("UPDATE reservation_notifications SET status='sending',updated_at=? WHERE id=? AND status='pending' RETURNING *").bind(now(),row.id).first();
  if(!job)continue;
  const reservation=await env.DB.prepare('SELECT * FROM reservations WHERE id=?').bind(job.reservation_id).first();
  if(!reservation)continue;
  let status='unknown',groupId=null,messageId=null,errorCode='UNCONFIRMED_RESPONSE';
  try{
   const response=await fetch('https://api.solapi.com/messages/v4/send-many/detail',{method:'POST',headers:{Authorization:await authorization(env),'Content-Type':'application/json'},body:JSON.stringify({messages:[message(env,job,reservation)],strict:true,showMessageList:true,allowDuplicates:false}),signal:AbortSignal.timeout(10000)});
   const data=await response.json();
   groupId=data.groupInfo?.groupId||null;
   const rejected=data.failedMessageList?.[0],accepted=data.messageList?.[0];
   if(response.ok&&rejected){status='failed';errorCode=String(rejected.statusCode||'PROVIDER_REJECTED').slice(0,100)}
   else if(response.ok&&accepted&&Number(data.groupInfo?.count?.registeredSuccess)>0){status='accepted';messageId=accepted.messageId||null;errorCode=null}
   else if(response.status>=400&&response.status<500){status='failed';errorCode=String(data.errorCode||`HTTP_${response.status}`).slice(0,100)}
  }catch{errorCode='NETWORK_OR_RESPONSE_ERROR'}
  await env.DB.prepare('UPDATE reservation_notifications SET status=?,updated_at=?,group_id=?,message_id=?,error_code=? WHERE id=?').bind(status,now(),groupId,messageId,errorCode,job.id).run();
 }
}
