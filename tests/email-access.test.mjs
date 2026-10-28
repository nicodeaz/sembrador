import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import net from 'node:net';

test('Email codes and remembered devices',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'sembrador-email-'));
  const data=path.join(temp,'data'),capture=path.join(temp,'mail'),release=path.join(temp,'release');
  await Promise.all([mkdir(data),mkdir(capture),mkdir(release)]);
  await cp(path.resolve('api'),path.join(release,'api'),{recursive:true,filter:p=>path.basename(p)!=='data'&&!p.endsWith('config.local.php')});
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  const php=process.platform==='win32'?'C:\\xampp\\php\\php.exe':'php';
  const env={...process.env,SEMBRADOR_AUTH_MODE:'email',SEMBRADOR_OWNER_EMAIL:'owner@example.test',SEMBRADOR_DATA_DIR:data,SEMBRADOR_TEST_MAIL_DIR:capture};
  let child;
  const stop=async()=>{if(child&&child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}};
  const start=async()=>{child=spawn(php,['-S',`127.0.0.1:${port}`,'-t',release],{env,windowsHide:true,stdio:'ignore'});for(let i=0;i<80;i++){try{await fetch(`http://127.0.0.1:${port}/api/access_mode.php`);return;}catch{await new Promise(r=>setTimeout(r,50));}}throw new Error('Server failed');};
  t.after(stop);await start();
  const req=(file,body,cookie='',headers={})=>fetch(`http://127.0.0.1:${port}/api/${file}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',cookie,...headers},...(body?{body:JSON.stringify(body)}:{})});
  const sqlFile=path.join(temp,'query.php');await writeFile(sqlFile,"<?php $db=new PDO('sqlite:'.$argv[1]);$db->exec($argv[2]);");
  const sql=q=>{const r=spawnSync(php,[sqlFile,path.join(data,'farm.sqlite'),q],{windowsHide:true});assert.equal(r.status,0);};
  const ask=async()=>{const r=await req('access_request.php',{email:'OWNER@example.test'});assert.equal(r.status,200);const b=await r.json();return {challenge:b.challenge,expiresIn:b.expiresIn,code:await readFile(path.join(capture,'latest-code.txt'),'utf8')};};
  const enableHelp=()=>{const r=spawnSync(php,[path.resolve('deploy/enable-access-help.php'),path.join(release,'api/config.php')],{env,windowsHide:true});assert.equal(r.status,0,r.stderr.toString());return JSON.parse(r.stdout.toString());};
  let first,cookie;
  await t.test('PIN cannot grant access; unknown mail never sends; cross-site is rejected',async()=>{
    assert.equal((await req('login.php',{pin:'742913'})).status,410);
    assert.equal((await req('data.php')).status,401);assert.equal((await req('media.php')).status,401);
    assert.equal((await req('access_request.php',{email:'other@example.test'})).status,200);
    await assert.rejects(readFile(path.join(capture,'latest-code.txt')));
    assert.equal((await req('access_request.php',{email:'owner@example.test'},'',{'Sec-Fetch-Site':'cross-site'})).status,403);
    first=await ask();
    assert.ok(first.expiresIn>590&&first.expiresIn<=600);
    assert.equal((await req('access_request.php',{email:'owner@example.test'})).status,429);
  });
  await t.test('one-time code issues persistent HttpOnly cookie and prevents replay',async()=>{
    assert.equal((await req('access_verify.php',{...first,code:'000000'})).status,401);
    const r=await req('access_verify.php',first);assert.equal(r.status,200);
    const header=r.headers.getSetCookie().find(c=>c.startsWith('sembrador_device='));assert.match(header,/HttpOnly/i);assert.match(header,/SameSite=Lax/i);assert.match(header,/expires=/i);cookie=header.split(';')[0];
    assert.equal((await req('access_verify.php',first)).status,401);
    assert.equal((await req('data.php',null,cookie)).status,200);assert.equal((await req('media.php',null,cookie)).status,200);
    assert.equal((await req('data.php',null,cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a'))).status,401);
  });
  await t.test('remembered device survives server restart and renews; logout revokes',async()=>{
    await stop();await start();assert.equal((await req('data.php',null,cookie)).status,200);
    sql('UPDATE access_devices SET renewed=0');const renewed=await req('data.php',null,cookie);assert.match(renewed.headers.get('set-cookie'),/sembrador_device=/);
    assert.equal((await req('logout.php',{},cookie,{'Sec-Fetch-Site':'cross-site'})).status,403);
    assert.equal((await req('data.php',null,cookie)).status,200);
    assert.equal((await req('logout.php',{},cookie)).status,200);assert.equal((await req('data.php',null,cookie)).status,401);
  });
  await t.test('codes expire and five wrong attempts disable a challenge',async()=>{
    sql('UPDATE access_codes SET created=0');let challenge=await ask();sql('UPDATE access_codes SET expires=0');assert.equal((await req('access_verify.php',challenge)).status,401);
    sql('UPDATE access_codes SET created=0');challenge=await ask();for(let i=0;i<5;i++)assert.equal((await req('access_verify.php',{...challenge,code:'000000'})).status,401);
    assert.equal((await req('access_verify.php',challenge)).status,401);
  });
  await t.test('temporary hour-long access ends on first login and stays off after restart or activation retry',async()=>{
    assert.equal(enableHelp().codeMinutes,60);
    sql('UPDATE access_codes SET created=0');const older=await ask();
    assert.ok(older.expiresIn>3590&&older.expiresIn<=3600);
    sql('UPDATE access_codes SET created=0');const current=await ask();
    // Simulate spending 20 minutes reading the email, beyond the usual 10.
    sql('UPDATE access_codes SET created=created-1200,expires=expires-1200 WHERE expires>0');
    const wrong=await req('access_verify.php',{...current,code:'000000'});
    assert.equal(wrong.status,401);assert.equal((await wrong.json()).error,'invalid_code');
    assert.equal(enableHelp().codeMinutes,60);
    await stop();await start();
    assert.equal((await req('access_verify.php',current)).status,200);
    assert.equal((await req('access_verify.php',older)).status,401);
    assert.equal((await req('access_verify.php',current)).status,401);
    await stop();await start();
    assert.equal(enableHelp().codeMinutes,10);
    sql('UPDATE access_codes SET created=0');const normal=await ask();
    assert.ok(normal.expiresIn>590&&normal.expiresIn<=600);
    sql('UPDATE access_codes SET expires=expires-601 WHERE expires>0');
    const expired=await req('access_verify.php',normal);
    assert.equal(expired.status,401);assert.equal((await expired.json()).error,'expired_code');
  });
  await t.test('help expires even without login and never bypasses the five-attempt limit',async()=>{
    sql('UPDATE access_help SET consumed=0,expires='+ (Math.floor(Date.now()/1000)+172800));
    sql('UPDATE access_codes SET created=0');const limited=await ask();
    for(let i=0;i<5;i++)assert.equal((await req('access_verify.php',{...limited,code:'000000'})).status,401);
    const blocked=await req('access_verify.php',limited);
    assert.equal(blocked.status,401);assert.equal((await blocked.json()).error,'too_many_attempts');
    sql('UPDATE access_help SET expires=0');
    sql('UPDATE access_codes SET created=0');const normal=await ask();
    assert.ok(normal.expiresIn>590&&normal.expiresIn<=600);
    assert.equal(enableHelp().codeMinutes,10);
  });
});
