import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.test-artifacts/email-preview');
await mkdir(path.join(root,'mail'),{recursive:true});
const php=process.platform==='win32'?'C:\\xampp\\php\\php.exe':'php';
const child=spawn(php,['-d','upload_max_filesize=10M','-d','post_max_size=12M','-S','127.0.0.1:8308','-t','dist'],{windowsHide:true,env:{...process.env,SEMBRADOR_DATA_DIR:path.join(root,'data'),SEMBRADOR_AUTH_MODE:'email',SEMBRADOR_OWNER_EMAIL:'owner@example.test',SEMBRADOR_TEST_MAIL_DIR:path.join(root,'mail')},stdio:'inherit'});
console.log('Local email-access preview: http://127.0.0.1:8308; email owner@example.test. No email is sent.');
process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
