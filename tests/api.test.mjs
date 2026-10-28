import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

test('API persistence, authentication, conflicts, backups and release replacement', async t => {
  const temp = await mkdtemp(path.join(os.tmpdir(),'sembrador-test-'));
  const root = path.resolve(import.meta.dirname,'..');
  const dataDir = path.join(temp,'private');
  const sessions = path.join(temp,'sessions');
  const release1 = path.join(temp,'release-1');
  const release2 = path.join(temp,'release-2');
  await Promise.all([mkdir(dataDir),mkdir(sessions),mkdir(release1),mkdir(release2)]);
  await cp(path.join(root,'api'),path.join(release1,'api'),{recursive:true,filter:source => path.basename(source) !== 'data' && !source.endsWith('config.local.php')});
  await cp(path.join(release1,'api'),path.join(release2,'api'),{recursive:true});
  const batch = { id:'old-batch',name:'Prueba de migración',startDate:'2026-01-01',initialCount:100,initialCostPerPullet:2,status:'active',createdAt:'2026-01-01' };
  await writeFile(path.join(dataDir,'batches.json'),JSON.stringify([batch]));
  await writeFile(path.join(dataDir,'records.json'),'[]');
  const probe = net.createServer(); await new Promise(resolve => probe.listen(0,'127.0.0.1',resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const php = process.env.PHP_BINARY || (process.platform === 'win32' ? 'C:\\xampp\\php\\php.exe' : 'php');
  const env = {...process.env,SEMBRADOR_DATA_DIR:dataDir,SEMBRADOR_INITIAL_PIN:'742913'};
  let child;
  let logs = '';
  async function start(release) {
    child = spawn(php,['-d',`session.save_path=${sessions}`,'-S',`127.0.0.1:${port}`,'-t',release],{env,windowsHide:true,stdio:['ignore','ignore','pipe']});
    child.stderr.on('data',chunk => { logs += chunk; });
    for (let i=0;i<80;i++) { try { await fetch(`http://127.0.0.1:${port}/api/data.php`); return; } catch { await new Promise(resolve => setTimeout(resolve,50)); } }
    throw new Error(logs);
  }
  async function stop() { if (child && child.exitCode === null) { const done = new Promise(resolve => child.once('exit',resolve)); child.kill(); await done; } }
  t.after(stop);
  await start(release1);
  let cookie = '';
  async function request(file, body, custom = {}) {
    return fetch(`http://127.0.0.1:${port}/api/${file}`,{method: body ? 'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie,...custom},...(body ? {body:JSON.stringify(body)} : {})});
  }
  await t.test('private data requires login and auth never gets cached', async () => {
    const response = await request('data.php'); assert.equal(response.status,401); assert.match(response.headers.get('cache-control'),/no-store/);
    const login = await request('login.php',{pin:'742913'}); assert.equal(login.status,200); cookie = login.headers.get('set-cookie').split(';')[0];
  });
  let initial;
  await t.test('legacy JSON migration is additive and keeps source files', async () => {
    initial = await (await request('data.php')).json(); assert.equal(initial.data.batches[0].id,batch.id); assert.equal(initial.revision,0);
    assert.equal(JSON.parse(await readFile(path.join(dataDir,'batches.json'),'utf8')).length,1);
  });
  const data = {...initial.data,tasks:[{id:'clean',title:'Limpieza',date:'2026-01-15',kind:'limpieza',status:'pending',cost:20,notes:''}],movements:[{id:'corn',type:'purchase',date:'2026-01-01',product:'Maíz',quantityKg:100,amount:50,contact:'',notes:''}]};
  await t.test('writes are atomic and duplicate requests are idempotent', async () => {
    for (let i=0;i<2;i++) { const result = await request('data.php',{revision:0,data,requestId:'save-one'}); assert.equal(result.status,200); assert.equal((await result.json()).revision,1); }
  });
  await t.test('stale device cannot overwrite newer data', async () => {
    assert.equal((await request('data.php',{revision:0,data:initial.data,requestId:'stale'})).status,409);
    const loaded = await (await request('data.php')).json(); assert.deepEqual(loaded.data,data);
  });
  await t.test('malformed data and cross-site writes are rejected without changing revision', async () => {
    assert.equal((await request('data.php',{revision:1,data:{...data,batches:[{...batch,initialCount:-1}]},requestId:'bad'})).status,422);
    assert.equal((await request('data.php',{revision:1,data,requestId:'cross'},{'Sec-Fetch-Site':'cross-site'})).status,403);
    assert.equal((await request('data.php',{revision:1,data,requestId:'old'},{'Content-Type':'text/plain'})).status,415);
    assert.equal((await (await request('data.php')).json()).revision,1);
  });
  const imageBytes = await readFile(path.join(root,'public','icons','favicon-32.png'));
  const mediaId='a'.repeat(32);
  const mediaUrl=`http://127.0.0.1:${port}/api/media.php`;
  const mediaBody=(bytes=imageBytes) => { const body=new FormData(); body.set('file',new Blob([bytes],{type:'image/png'}),'test.png'); body.set('id',mediaId);body.set('title','Logo de prueba');body.set('category','logo');return body; };
  await t.test('media requires login and accepts only validated files with same-origin writes', async () => {
    assert.equal((await fetch(mediaUrl)).status,401);
    assert.equal((await fetch(mediaUrl,{method:'POST',headers:{Cookie:cookie},body:mediaBody()})).status,403);
    assert.equal((await fetch(mediaUrl,{method:'POST',headers:{Cookie:cookie,'X-Sembrador-Upload':'1'},body:mediaBody('not an image')})).status,415);
    for(let i=0;i<2;i++) assert.equal((await fetch(mediaUrl,{method:'POST',headers:{Cookie:cookie,'X-Sembrador-Upload':'1'},body:mediaBody()})).status,200);
    const list=await (await request('media.php')).json(); assert.equal(list.assets.length,1); assert.equal(list.assets[0].title,'Logo de prueba');assert.ok(list.maxUploadBytes>0);
    const file=await request('media.php?id='+mediaId); assert.equal(file.headers.get('content-type'),'image/png'); assert.deepEqual(Buffer.from(await file.arrayBuffer()),imageBytes);
  });
  await t.test('server rejects invalid links between feed and purchases', async () => {
    const feed={id:'feed',type:'feed',date:'2026-01-02',product:'Maíz',quantityKg:20,amount:10,batchId:batch.id,purchaseId:'corn',contact:'',notes:''};
    for(const invalid of [{...feed,amount:999},{...feed,purchaseId:'missing'},{...feed,quantityKg:101,amount:50.5}]) assert.equal((await request('data.php',{revision:1,data:{...data,movements:[...data.movements,invalid]},requestId:'invalid-link'})).status,422);
  });
  await t.test('new code release and PHP restart preserve all data and the PIN', async () => {
    const pin = await readFile(path.join(dataDir,'pin.json'),'utf8');
    await stop(); await start(release2);
    const loaded = await (await request('data.php')).json(); assert.deepEqual(loaded.data,data); assert.equal(loaded.revision,1);
    assert.equal(await readFile(path.join(dataDir,'pin.json'),'utf8'),pin);
    const library=await (await request('media.php')).json();assert.equal(library.assets[0].id,mediaId);
    const file=await request('media.php?id='+mediaId);assert.deepEqual(Buffer.from(await file.arrayBuffer()),imageBytes);
  });
  await t.test('snapshot and portable backup are readable after restart', async () => {
    const backups = path.join(temp,'backups'); await mkdir(backups);
    const output = spawnSync(php,[path.join(release2,'api','backup.php'),backups],{env,windowsHide:true,encoding:'utf8'});
    assert.equal(output.status,0,output.stderr);
    const files = await readdir(backups); assert.equal(files.length,2);
    assert.deepEqual(JSON.parse(await readFile(path.join(backups,files.find(f => f.endsWith('.json'))),'utf8')),data);
    const check=path.join(temp,'verify-backup.php');
    await writeFile(check,"<?php $db=new PDO('sqlite:' . $argv[1]); echo $db->query('SELECT COUNT(*) FROM media')->fetchColumn();");
    const result=spawnSync(php,[check,path.join(backups,files.find(f=>f.endsWith('.sqlite')))],{windowsHide:true,encoding:'utf8'});assert.equal(result.status,0);assert.equal(result.stdout,'1');
  });
  await t.test('PIN changes persist and login lockouts are enforced', async () => {
    assert.equal((await request('change_pin.php',{currentPin:'742913',newPin:'835204'})).status,200);
    await request('logout.php',{}); cookie='';
    for (let i=0;i<3;i++) assert.equal((await request('login.php',{pin:'111111'})).status,401);
    const locked = await request('login.php',{pin:'835204'}); assert.equal(locked.status,423); assert.ok((await locked.json()).lockedSeconds > 0);
  });
});
