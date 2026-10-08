import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('.env')){
 const password=randomBytes(18).toString('base64url');
 const example=readFileSync('.env.example','utf8').replace('ADMIN_PASSWORD=',`ADMIN_PASSWORD=${password}`);
 writeFileSync('.env',example,{flag:'wx'});
 console.log('Arquivo .env criado com senha aleatória. Consulte ADMIN_EMAIL e ADMIN_PASSWORD nesse arquivo para entrar no painel.');
}else console.log('Configuração .env existente preservada.');
mkdirSync('data',{recursive:true});
