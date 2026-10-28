// Explicit one-off import into the authenticated, private company library.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base=process.argv[2];
if (!['https://sembrador.okto.ie','http://127.0.0.1:8307'].includes(base)) throw new Error('Unexpected destination');
const pin=base.startsWith('https:') ? (await fs.readFile('C:/Users/dev/.codex/private/sembrador/acceso-inicial.txt','utf8')).match(/\b\d{6}\b/)?.[0] : '742913';
if(!pin)throw new Error('Access file has no PIN');
const login=await fetch(base+'/api/login.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
if(!login.ok)throw new Error('Login failed: '+login.status);
const cookies=new Map(login.headers.getSetCookie().map(s=>{const pair=s.split(';')[0];return [pair.slice(0,pair.indexOf('=')),pair];}));
const cookie=[...cookies.values()].join('; ');
const before=await fetch(base+'/api/data.php',{headers:{cookie}}).then(r=>r.json());
for(const [name,title,category='flyer',extension='png'] of [['racion-ovejas','Ración para ovejas · 25 kg'],['ovejas-peletizado','Ovejas · Peletizado · 25 kg'],['ponedoras','Gallinas ponedoras · 25 kg'],['recria','Recría de pollitas · 25 kg'],['racion-bb','Ración BB · 25 kg'],['servicios-color','El Sembrador · Servicios y contacto','servicios'],['aviso-original','Aviso original de revista','servicios'],['referencia-ovejas','Referencia original · Ración para ovejas','etiqueta','jpeg']]){
  const bytes=await fs.readFile('.private/flyers/'+name+'.'+extension);
  const id=createHash('sha256').update(bytes).update(title).digest('hex').slice(0,32);
  const form=new FormData();form.set('id',id);form.set('title',title);form.set('category',category);form.set('file',new Blob([bytes],{type:extension==='jpeg'?'image/jpeg':'image/png'}),name+'.'+extension);
  const response=await fetch(base+'/api/media.php',{method:'POST',headers:{cookie,'X-Sembrador-Upload':'1'},body:form});
  if(!response.ok)throw new Error(name+': upload HTTP '+response.status);
  const saved=await fetch(base+'/api/media.php?id='+id,{headers:{cookie}});
  const digest=createHash('sha256').update(Buffer.from(await saved.arrayBuffer())).digest('hex');
  if(digest!==createHash('sha256').update(bytes).digest('hex'))throw new Error('Content mismatch');
  const unauth=await fetch(base+'/api/media.php?id='+id);
  if(unauth.status!==401)throw new Error('File not protected');
  console.log(name+': saved, checksum verified, unauthenticated access blocked');
}
const after=await fetch(base+'/api/data.php',{headers:{cookie}}).then(r=>r.json());
if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Farm data changed during media import');
await fetch(base+'/api/logout.php',{method:'POST',headers:{cookie}});
console.log('Farm records unchanged; session closed.');
