import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {mkdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {initialServices} from '../src/lib/services.js';

const statuses=['pendente','confirmado','cancelado','concluido'];
const id=z.coerce.number().int().positive();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const time=z.string().regex(/^(0\d|1\d|2[0-3]):[0-5]\d$/);
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
const clock=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const bookingSchema=z.object({service_id:id,barber_id:id,date,time,name:z.string().trim().min(2).max(100),phone:z.string().trim().regex(/^\+?[\d ()-]{10,20}$/).refine(v=>/^\d{10,13}$/.test(v.replace(/\D/g,''))).transform(v=>v.replace(/\D/g,'')),email:z.union([z.email(),z.literal('')]).optional().default('')});
const serviceSchema=z.object({name:z.string().trim().min(2).max(80),description:z.string().trim().max(300),price:z.coerce.number().min(0).max(10000),duration:z.coerce.number().int().min(15).max(240),active:z.coerce.number().int().min(0).max(1).default(1)});
const barberSchema=z.object({name:z.string().trim().min(2).max(80),specialty:z.string().max(150),photo:z.union([z.url().refine(v=>v.startsWith('https://')),z.literal('')]).default(''),rating:z.coerce.number().min(0).max(5).default(5),active:z.coerce.number().int().min(0).max(1).default(1)});
function fail(message,status=400){throw Object.assign(new Error(message),{status});}

export function createApp({databasePath=process.env.DATABASE_PATH||'./data/barbearia.sqlite',adminPassword=process.env.ADMIN_PASSWORD,adminEmail=process.env.ADMIN_EMAIL}={}){
 if(databasePath!==':memory:')mkdirSync(path.dirname(databasePath),{recursive:true});
 const db=new DatabaseSync(databasePath);db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY,name TEXT,description TEXT,price REAL,duration INTEGER,active INTEGER DEFAULT 1);
 CREATE TABLE IF NOT EXISTS barbers(id INTEGER PRIMARY KEY,name TEXT,specialty TEXT,photo TEXT,rating REAL,active INTEGER DEFAULT 1);
 CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY,service_id INTEGER REFERENCES services(id),barber_id INTEGER REFERENCES barbers(id),date TEXT,start INTEGER,end INTEGER,name TEXT,phone TEXT,email TEXT,status TEXT,price REAL,service_name TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS appointment_slot ON appointments(barber_id,date,start,end);
 CREATE TABLE IF NOT EXISTS blocks(id INTEGER PRIMARY KEY,barber_id INTEGER REFERENCES barbers(id),date TEXT,start INTEGER,end INTEGER,reason TEXT);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER);
 CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY,name TEXT NOT NULL,phone TEXT UNIQUE NOT NULL,email TEXT NOT NULL DEFAULT '');
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 `);
 const one=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 if(!one('SELECT id FROM admins LIMIT 1')){if(!adminEmail||!adminPassword||adminPassword.length<12){db.close();throw new Error('Configure ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) no .env antes de iniciar.');}z.email().parse(adminEmail);const salt=randomBytes(16).toString('hex');run('INSERT INTO admins(email,salt,hash) VALUES(?,?,?)',adminEmail,salt,scryptSync(adminPassword,salt,64).toString('hex'));}
 if(!all('PRAGMA table_info(appointments)').some(c=>c.name==='customer_id')) db.exec('ALTER TABLE appointments ADD COLUMN customer_id INTEGER REFERENCES customers(id)');
 db.exec("INSERT OR IGNORE INTO customers(name,phone,email) SELECT name,phone,COALESCE(email,'') FROM appointments ORDER BY id; UPDATE appointments SET customer_id=(SELECT id FROM customers WHERE phone=appointments.phone) WHERE customer_id IS NULL;");
 for(const [key,value] of Object.entries({name:process.env.SHOP_NAME||"DQB STUDIO",whatsapp:process.env.SHOP_WHATSAPP||'5511999999999',address:process.env.SHOP_ADDRESS||'Rua Dr. Luiz Losso Filho, 703, Curitiba - PR',hours:'Segunda a sábado, 09h às 19h'}))run('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)',key,value);
 const shop=()=>({...Object.fromEntries(all('SELECT key,value FROM settings').map(s=>[s.key,s.value])),today:today()});
 if(!one('SELECT id FROM services LIMIT 1')){for(const s of initialServices)run('INSERT INTO services(name,description,price,duration) VALUES(?,?,?,?)',s.name,s.description,s.price,s.duration);for(const b of [['Rafael Costa','Cortes clássicos e acabamento'],['Lucas Almeida','Degradê e barba']])run('INSERT INTO barbers(name,specialty,photo,rating) VALUES(?,?,?,?)',...b,'',4.9);}
 const app=express();app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'",'https:','data:'],'frame-src':['https://maps.google.com','https://www.google.com']}}}));app.use(express.json({limit:'20kb'}));
 app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:true,legacyHeaders:false}));
 const allowedOrigins=req=>[`${req.protocol}://${req.headers.host}`,...(process.env.NODE_ENV!=='production'?['http://localhost:5173','http://127.0.0.1:5173']:[])];
 app.use('/api',(req,res,next)=>{if(['POST','PUT','DELETE','PATCH'].includes(req.method)&&req.headers.origin&&!allowedOrigins(req).includes(req.headers.origin))return res.status(403).json({error:'Origem não permitida.'});next();});
 const auth=(req,res,next)=>{const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('session='))?.slice(8);if(!token||!one('SELECT token FROM sessions WHERE token=? AND expires>?',token,Date.now()))return res.status(401).json({error:'Entre no painel para continuar.'});req.token=token;next();};
 const cookie=(token,age)=>`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`;
 app.post('/api/login',rateLimit({windowMs:15*60000,limit:10}), (req,res)=>{const {email,password}=z.object({email:z.email(),password:z.string().max(200)}).parse(req.body);const admin=one('SELECT * FROM admins WHERE email=?',email);const hash=scryptSync(password,admin?.salt||'invalid',64);if(!admin||!timingSafeEqual(hash,Buffer.from(admin.hash,'hex')))fail('E-mail ou senha incorretos.',401);const token=randomBytes(32).toString('hex');run('DELETE FROM sessions WHERE expires<?',Date.now());run('INSERT INTO sessions VALUES(?,?)',token,Date.now()+8*3600000);res.setHeader('Set-Cookie',cookie(token,28800));res.json({ok:true});});
 app.post('/api/logout',auth,(req,res)=>{run('DELETE FROM sessions WHERE token=?',req.token);res.setHeader('Set-Cookie',cookie('',0));res.json({ok:true});});
 app.get('/api/catalog',(_req,res)=>res.json({services:all('SELECT * FROM services WHERE active=1'),barbers:all('SELECT * FROM barbers WHERE active=1'),shop:shop()}));
 function available(barberId,day,start,duration,exclude=0){const end=start+duration;if(day<today()||new Date(`${day}T12:00:00Z`).getUTCDay()===0||start<540||end>1140||start%15!==0)return false;if(new Date(`${day}T${clock(start)}:00-03:00`).getTime()<=Date.now())return false;return !one("SELECT id FROM appointments WHERE barber_id=? AND date=? AND status!='cancelado' AND id!=? AND start<? AND end>?",barberId,day,exclude,end,start)&&!one('SELECT id FROM blocks WHERE (barber_id=? OR barber_id IS NULL) AND date=? AND start<? AND end>?',barberId,day,end,start);}
 app.get('/api/availability',(req,res)=>{const q=z.object({service_id:id,barber_id:id,date}).parse(req.query);const s=one('SELECT * FROM services WHERE id=? AND active=1',q.service_id);if(!s||!one('SELECT id FROM barbers WHERE id=? AND active=1',q.barber_id))fail('Serviço ou barbeiro indisponível.');const slots=[];for(let m=540;m+s.duration<=1140;m+=15)if(available(q.barber_id,q.date,m,s.duration))slots.push(clock(m));res.json({slots});});
 function reserve(data,existingId,manual=false){
  const p=bookingSchema.parse(data);
  db.exec('BEGIN IMMEDIATE');
  try{
   const previous=existingId?one('SELECT * FROM appointments WHERE id=?',existingId):null;
   const s=one('SELECT * FROM services WHERE id=? AND active=1',p.service_id);
   if(!s||!one('SELECT id FROM barbers WHERE id=? AND active=1',p.barber_id))fail('Serviço ou barbeiro indisponível.');
   const unchanged=previous&&previous.service_id===p.service_id;
   const duration=unchanged?previous.end-previous.start:s.duration;
   const price=unchanged?previous.price:s.price;
   const serviceName=unchanged?previous.service_name:s.name;
   const start=minutes(p.time);
   if(!available(p.barber_id,p.date,start,duration,existingId))fail('Horário indisponível. Escolha outro horário.',409);
   run('INSERT INTO customers(name,phone,email) VALUES(?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name,email=excluded.email',p.name,p.phone,p.email);
   const customerId=one('SELECT id FROM customers WHERE phone=?',p.phone).id;
   let result;
   if(existingId){
    run('UPDATE appointments SET service_id=?,barber_id=?,date=?,start=?,end=?,name=?,phone=?,email=?,price=?,service_name=?,status=?,customer_id=? WHERE id=?',p.service_id,p.barber_id,p.date,start,start+duration,p.name,p.phone,p.email,price,serviceName,'confirmado',customerId,existingId);
    result=existingId;
   }else result=Number(run('INSERT INTO appointments(service_id,barber_id,date,start,end,name,phone,email,status,price,service_name,customer_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',p.service_id,p.barber_id,p.date,start,start+duration,p.name,p.phone,p.email,manual?'confirmado':'pendente',price,serviceName,customerId).lastInsertRowid);
   db.exec('COMMIT');
   return {...one('SELECT a.*,b.name barber_name FROM appointments a JOIN barbers b ON b.id=a.barber_id WHERE a.id=?',result),time:p.time};
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 app.post('/api/appointments',rateLimit({windowMs:60000,limit:10}),(req,res)=>res.status(201).json(reserve(req.body)));
 app.get('/api/calendar',(req,res)=>{
  const q=z.object({service_id:id,barber_id:id,month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)}).parse(req.query);
  const s=one('SELECT * FROM services WHERE id=? AND active=1',q.service_id);
  if(!s||!one('SELECT id FROM barbers WHERE id=? AND active=1',q.barber_id))fail('Serviço ou barbeiro indisponível.');
  const days=[];const count=new Date(Number(q.month.slice(0,4)),Number(q.month.slice(5)),0).getDate();
  for(let d=1;d<=count;d++){const day=q.month+'-'+String(d).padStart(2,'0');let free=false;for(let m=540;m+s.duration<=1140;m+=15){if(available(q.barber_id,day,m,s.duration)){free=true;break;}}days.push({date:day,available:free});}
  res.json({days});
 });
 app.use('/api/admin',auth);
 app.get('/api/admin/data',(req,res)=>{
  const q=z.object({from:date,to:date}).refine(v=>v.to>=v.from).parse(req.query);
  const currentDay=today();
  res.json({
   appointments:all('SELECT a.*,b.name barber_name FROM appointments a JOIN barbers b ON b.id=a.barber_id WHERE a.date BETWEEN ? AND ? ORDER BY a.date,a.start',q.from,q.to),
   services:all('SELECT * FROM services'),barbers:all('SELECT * FROM barbers'),
   blocks:all('SELECT x.*,b.name barber_name FROM blocks x LEFT JOIN barbers b ON b.id=x.barber_id WHERE x.date BETWEEN ? AND ? ORDER BY x.date,x.start',q.from,q.to),
   shop:shop(),
   dashboard:{today:one("SELECT COUNT(*) total FROM appointments WHERE date=? AND status!='cancelado'",currentDay).total,customers:one('SELECT COUNT(*) total FROM customers').total,revenue:one("SELECT COALESCE(SUM(price),0) total FROM appointments WHERE date BETWEEN ? AND ? AND status!='cancelado'",q.from,q.to).total,upcoming:all("SELECT a.*,b.name barber_name FROM appointments a JOIN barbers b ON b.id=a.barber_id WHERE (a.date>? OR (a.date=? AND a.start>?)) AND a.status IN ('pendente','confirmado') ORDER BY a.date,a.start LIMIT 6",currentDay,currentDay,minutes(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date())))}
  });
 });
 app.post('/api/admin/appointments',(req,res)=>res.status(201).json(reserve(req.body,undefined,true)));
 app.put('/api/admin/settings',(req,res)=>{
  const p=z.object({name:z.string().trim().min(2).max(80),whatsapp:z.string().regex(/^\d{12,13}$/),address:z.string().trim().min(5).max(200)}).parse(req.body);
  db.exec('BEGIN IMMEDIATE');try{for(const [key,value] of Object.entries(p))run('UPDATE settings SET value=? WHERE key=?',value,key);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  res.json(shop());
 });
 app.patch('/api/admin/appointments/:id',(req,res)=>{const key=id.parse(req.params.id);const current=one('SELECT * FROM appointments WHERE id=?',key);if(!current)fail('Agendamento não encontrado.',404);const {status}=z.object({status:z.enum(statuses)}).parse(req.body);db.exec('BEGIN IMMEDIATE');try{if(current.status==='cancelado'&&status!=='cancelado'&&!available(current.barber_id,current.date,current.start,current.end-current.start,key))fail('Horário ocupado ou passado. Reagende primeiro.',409);run('UPDATE appointments SET status=? WHERE id=?',status,key);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}res.json({ok:true});});
 app.put('/api/admin/appointments/:id',(req,res)=>{const key=id.parse(req.params.id);if(!one('SELECT id FROM appointments WHERE id=?',key))fail('Agendamento não encontrado.',404);res.json(reserve(req.body,key));});
 for(const [table,schema] of [['services',serviceSchema],['barbers',barberSchema]]){app.post(`/api/admin/${table}`,(req,res)=>{const p=schema.parse(req.body),keys=Object.keys(p);const result=run(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')})`,...Object.values(p));res.status(201).json({id:Number(result.lastInsertRowid)});});app.put(`/api/admin/${table}/:id`,(req,res)=>{const p=schema.parse(req.body);const result=run(`UPDATE ${table} SET ${Object.keys(p).map(k=>`${k}=?`).join(',')} WHERE id=?`,...Object.values(p),id.parse(req.params.id));if(!result.changes)fail('Registro não encontrado.',404);res.json({ok:true});});app.delete(`/api/admin/${table}/:id`,(req,res)=>{const key=id.parse(req.params.id);if(one(`SELECT id FROM appointments WHERE ${table==='services'?'service_id':'barber_id'}=? LIMIT 1`,key)||table==='barbers'&&one('SELECT id FROM blocks WHERE barber_id=? LIMIT 1',key)){run(`UPDATE ${table} SET active=0 WHERE id=?`,key);}else run(`DELETE FROM ${table} WHERE id=?`,key);res.json({ok:true});});}
 app.post('/api/admin/blocks',(req,res)=>{const p=z.object({barber_id:id.nullable(),date,start:time,end:time,reason:z.string().trim().min(2).max(150)}).parse(req.body);const start=minutes(p.start),end=minutes(p.end);if(end<=start)fail('O fim deve ser depois do início.');db.exec('BEGIN IMMEDIATE');try{if(one("SELECT id FROM appointments WHERE (? IS NULL OR barber_id=?) AND date=? AND status!='cancelado' AND start<? AND end>?",p.barber_id,p.barber_id,p.date,end,start))fail('Há agendamentos neste período. Cancele ou reagende antes de bloquear.',409);const r=run('INSERT INTO blocks(barber_id,date,start,end,reason) VALUES(?,?,?,?,?)',p.barber_id,p.date,start,end,p.reason);db.exec('COMMIT');res.status(201).json({id:Number(r.lastInsertRowid)});}catch(e){db.exec('ROLLBACK');throw e;}});
 app.delete('/api/admin/blocks/:id',(req,res)=>{run('DELETE FROM blocks WHERE id=?',id.parse(req.params.id));res.json({ok:true});});
 app.use('/api',(_req,res)=>res.status(404).json({error:'Rota não encontrada.'}));
 const dist=path.resolve('dist');if(existsSync(dist)){app.use(express.static(dist));app.get(['/', '/admin'],(_req,res)=>res.sendFile(path.join(dist,'index.html')));}
 app.use((err,_req,res,_next)=>{if(err instanceof z.ZodError)return res.status(400).json({error:'Dados inválidos. Confira os campos.',details:err.issues.map(i=>i.path.join('.'))});if(err.code==='ERR_SQLITE_ERROR')return res.status(400).json({error:'Não foi possível salvar. Confira os registros relacionados.'});res.status(err.status||500).json({error:err.status?err.message:'Erro interno. Tente novamente.'});});
 return {app,db};
}
