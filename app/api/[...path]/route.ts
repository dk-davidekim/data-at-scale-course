import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
const validLesson=(id:string)=>/^(?:1\.[12]|2\.[12]|3\.[12]|4\.[123]|6\.1|7\.1|8\.1|10\.[12]|11\.[12]|12\.[12]|hw[123]|general)$/.test(id);
async function handle(request:Request){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,''),method=request.method;
 let cookie='';
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
 // A random browser credential identifies a post's author; it is never a login or a public user ID.
 if(method!=='GET'){
  if(request.headers.get('origin')!==url.origin)return json({error:'Invalid request origin.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON request required.'},415);
 }
 const cookieName=url.protocol==='https:'?'__Host-course_visitor':'course_visitor';
 const rawCookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 let token=rawCookie&&/^[a-f0-9]{64}$/.test(rawCookie)?rawCookie:'';
 if(path==='visitor'&&method==='POST'){
  if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');cookie=`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;}
  return json({ready:true});
 }
 if(!token&&method!=='GET')return json({error:'Allow this site’s browser cookie to post and manage discussions.'},401);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const userId=token?'guest_'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join(''):'';
 const db=env.DB;if(!db)return json({error:'Discussions are temporarily unavailable.'},503);
 let data:any={};if(method!=='GET'){const raw=await request.text();if(raw.length>15000)return json({error:'Request too large.'},413);try{data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))return json({error:'A JSON object is required.'},400)}catch{return json({error:'Invalid JSON.'},400)}}
 if(path==='threads'&&method==='GET'){
  const lesson=url.searchParams.get('lesson')||'general';if(!validLesson(lesson))return json({error:'Unknown lesson.'},400);
  const result=await db.prepare("SELECT t.*, (SELECT COUNT(*) FROM guest_replies r WHERE r.thread_id=t.id AND r.deleted=0 AND substr(r.user_id,1,6)='guest_') AS reply_count FROM guest_threads t WHERE lesson=? AND deleted=0 AND substr(t.user_id,1,6)='guest_' ORDER BY pinned DESC,created_at DESC LIMIT 100").bind(lesson).all<any>();
  return json({threads:result.results.map(({user_id,...r})=>({...r,mine:user_id===userId}))});
 }
 if(path==='threads'&&method==='POST'){
  const lesson=clean(data.lesson,20),title=clean(data.title,140),body=clean(data.body,5000),name=clean(data.name,60)||'Learner';
  if(!validLesson(lesson)||title.length<5||body.length<10)return json({error:'Use a title of at least 5 characters and a message of at least 10 characters.'},400);
  const rate=await db.prepare('SELECT COUNT(*) AS n FROM guest_threads WHERE user_id=? AND created_at>?').bind(userId,Date.now()-60000).first<any>();if(rate.n>=3)return json({error:'Please wait a minute before starting another discussion.'},429);
  const id=crypto.randomUUID(),now=Date.now();await db.prepare('INSERT INTO guest_threads(id,user_id,name,lesson,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,userId,name,lesson,title,body,now,now).run();return json({id},201);
 }
 const match=path.match(/^threads\/([a-f0-9-]+)(?:\/(replies|report))?$/);
 if(match){const id=match[1],action=match[2];const thread=await db.prepare("SELECT * FROM guest_threads WHERE id=? AND substr(user_id,1,6)='guest_' AND deleted=0").bind(id).first<any>();
  if(!thread)return json({error:'Discussion not found.'},404);const mine=thread.user_id===userId;
  if(!action&&method==='GET'){
   const result=await db.prepare("SELECT * FROM guest_replies WHERE thread_id=? AND deleted=0 AND substr(user_id,1,6)='guest_' ORDER BY created_at LIMIT 200").bind(id).all<any>();const {user_id,...safe}=thread;
   return json({thread:{...safe,mine},replies:result.results.map(({user_id,...r})=>({...r,mine:user_id===userId}))});
  }
  if(!action&&method==='PUT'){
   if(!mine)return json({error:'You can only change discussions created in this browser.'},403);
   const edits:string[]=[],values:any[]=[];
   if(data.status!==undefined&&['open','resolved'].includes(data.status)){edits.push('status=?');values.push(data.status)}
   if(data.deleted===true){edits.push('deleted=1')}
   if(data.title!==undefined||data.body!==undefined){const title=clean(data.title,140),body=clean(data.body,5000);if(title.length<5||body.length<10)return json({error:'Title or message is too short.'},400);edits.push('title=?','body=?');values.push(title,body)}
   if(!edits.length)return json({error:'No supported changes provided.'},400);edits.push('updated_at=?');values.push(Date.now(),id);
   await db.prepare('UPDATE guest_threads SET '+edits.join(',')+' WHERE id=?').bind(...values).run();return json({saved:true});
  }
  if(action==='replies'&&method==='POST'){
   const body=clean(data.body,3000),name=clean(data.name,60)||'Learner';if(body.length<3)return json({error:'Write at least 3 characters.'},400);
   const rate=await db.prepare('SELECT COUNT(*) AS n FROM guest_replies WHERE user_id=? AND created_at>?').bind(userId,Date.now()-60000).first<any>();if(rate.n>=8)return json({error:'Please wait before adding more replies.'},429);
   await db.prepare('INSERT INTO guest_replies(id,thread_id,user_id,name,body,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,userId,name,body,Date.now()).run();return json({saved:true},201);
  }
  if(action==='report'&&method==='POST'){
   const reason=clean(data.reason,500);if(reason.length<5)return json({error:'Explain the issue in at least 5 characters.'},400);
   const prior=await db.prepare('SELECT id FROM guest_reports WHERE thread_id=? AND user_id=? AND resolved=0').bind(id,userId).first();
   if(!prior)await db.prepare('INSERT INTO guest_reports(id,thread_id,user_id,reason,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,userId,reason,Date.now()).run();return json({reported:true});
  }
 }
 const replyMatch=path.match(/^replies\/([a-f0-9-]+)$/);
 if(replyMatch&&method==='DELETE'){
  const r=await db.prepare("SELECT user_id FROM guest_replies WHERE id=? AND substr(user_id,1,6)='guest_' AND deleted=0").bind(replyMatch[1]).first<any>();
  if(!r)return json({error:'Reply not found.'},404);if(r.user_id!==userId)return json({error:'You can only remove replies created in this browser.'},403);
  await db.prepare('UPDATE guest_replies SET deleted=1 WHERE id=?').bind(replyMatch[1]).run();return json({deleted:true});
 }
 // Previous account data and restricted discussions remain private and are never exposed by guest endpoints.
 return json({error:'Not found.'},404);
 }catch(error){console.error('Discussion request failed',error instanceof Error?error.message:'unknown');return json({error:'The request could not be completed. Please try again.'},500)}
}
export const GET=handle;export const POST=handle;export const PUT=handle;export const DELETE=handle;
