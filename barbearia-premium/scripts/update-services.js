import {DatabaseSync} from 'node:sqlite';
import {existsSync} from 'node:fs';
import {initialServices} from '../src/lib/services.js';
const databasePath=process.env.DATABASE_PATH||'./data/barbearia.sqlite';
if(!existsSync(databasePath))throw new Error('Banco não encontrado. Inicie o sistema primeiro.');
const db=new DatabaseSync(databasePath);
db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
try{
 for(const service of initialServices){
  const existing=db.prepare('SELECT id FROM services WHERE name=?').get(service.name);
  if(existing)db.prepare('UPDATE services SET price=? WHERE id=?').run(service.price,existing.id);
  else db.prepare('INSERT INTO services(name,description,price,duration,active) VALUES(?,?,?,?,1)').run(service.name,service.description,service.price,service.duration);
 }
 db.exec('COMMIT');
 console.log('Serviços e preços atualizados. Reservas e durações existentes preservadas.');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
