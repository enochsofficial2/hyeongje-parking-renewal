import {revalidatePath,revalidateTag} from 'next/cache';
// Same-origin proxy keeps administrator sessions in HttpOnly cookies on Vercel.
import bcrypt from 'bcryptjs';
export const dynamic = 'force-dynamic';
async function proxy(request, context) {
  const { path } = await context.params;
  if(path[0]==='internal')return Response.json({error:'허용되지 않은 경로입니다.'},{status:404});
  const base = process.env.CLOUDFLARE_API_URL;
  const secret = process.env.CLOUDFLARE_PROXY_SECRET;
  if (!base || !secret) return Response.json({error:'서비스 연결 설정이 필요합니다.'},{status:503});
  const url = new URL(request.url);
  const headers = new Headers();
  for (const name of ['content-type','cookie','idempotency-key']) if(request.headers.has(name)) headers.set(name,request.headers.get(name));
  headers.set('x-proxy-secret',secret);
  headers.set('x-client-ip',request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
  headers.set('x-site-origin',url.origin);
  const origin=request.headers.get('origin');
  if (origin && origin!==url.origin) return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
  if(path.join('/')==='auth/login'&&request.method==='POST'){
    const text=await request.text();
    if(text.length>2048)return Response.json({error:'올바른 로그인 요청이 아닙니다.'},{status:400});
    let data;try{data=JSON.parse(text)}catch{return Response.json({error:'올바른 로그인 요청이 아닙니다.'},{status:400})}
    const challenge=await fetch(`${base}/api/internal/auth/challenge`,{method:'POST',headers,body:JSON.stringify({email:data.email}),cache:'no-store'});
    const user=await challenge.json();
    if(!challenge.ok)return Response.json(user,{status:challenge.status});
    if(!user.password_hash||!(await bcrypt.compare(String(data.password||'').slice(0,256),user.password_hash)))return Response.json({error:'이메일 또는 비밀번호가 올바르지 않습니다.'},{status:401});
    // Password hashing runs in Node; D1 owns administrator identities and sessions.
    const session=await fetch(`${base}/api/internal/auth/session`,{method:'POST',headers,body:JSON.stringify({adminId:user.id}),cache:'no-store'});
    const output=new Headers({'Cache-Control':'no-store','Content-Type':'application/json'});
    if(session.headers.has('set-cookie'))output.set('set-cookie',session.headers.get('set-cookie'));
    return new Response(session.body,{status:session.status,headers:output});
  }
  const response = await fetch(`${base}/api/${path.map(encodeURIComponent).join('/')}${url.search}`,{
    method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer(),redirect:'manual',cache:'no-store'
  });
  if(response.ok&&path[0]==='admin'&&path[1]==='reviews'&&request.method!=='GET'){revalidateTag('reviews',{expire:0});revalidatePath('/reviews','layout');revalidatePath('/sitemap.xml');}
  const output=new Headers({'Cache-Control':'no-store'});
  for(const name of ['content-type','set-cookie','content-disposition']) if(response.headers.has(name))output.set(name,response.headers.get(name));
  return new Response(response.body,{status:response.status,headers:output});
}
export {proxy as GET,proxy as POST,proxy as PATCH,proxy as DELETE};
