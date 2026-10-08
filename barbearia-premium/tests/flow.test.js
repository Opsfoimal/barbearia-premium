import {randomBytes} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp,today} from '../server/app.js';

test('fluxo integrado, segurança, duração, concorrência, folgas e CRUD',async()=>{
 const adminPassword=randomBytes(18).toString('base64url');const {app,db}=createApp({databasePath:':memory:',adminPassword,adminEmail:'admin@barbearia.local'});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;let cookie='';
 async function call(route,body,method,authorized=false){const r=await fetch(base+route,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json','X-Requested-With':'DQBStudio',...(authorized?{cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),headers:r.headers};}
 try{
 let d=new Date(today()+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+2);while(d.getUTCDay()===0)d.setUTCDate(d.getUTCDate()+1);const day=d.toISOString().slice(0,10);
 const customer={service_id:3,barber_id:1,date:day,time:'09:00',name:'Cliente de Teste',phone:'11999999999',email:'teste@example.com'};
 assert.equal((await call(`/admin/data?from=${day}&to=${day}`)).status,401);
 assert.equal((await call('/appointments',{...customer,name:'X'})).status,400);
 assert.equal((await call('/login',{email:'admin@barbearia.local',password:'errada'})).status,401);
 const login=await call('/login',{email:'admin@barbearia.local',password:adminPassword});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
 const hash=db.prepare('SELECT hash FROM admins').get().hash;assert.notEqual(hash,adminPassword);assert.equal(hash.length,128);
 const results=await Promise.all([call('/appointments',customer),call('/appointments',customer)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const reservation=results.find(r=>r.status===201).data;assert.equal(reservation.end-reservation.start,75);assert.equal(reservation.price,60);
 assert.equal((await call('/appointments',{...customer,time:'10:00'})).status,409);
 assert.equal((await call('/appointments',{...customer,barber_id:2})).status,201);
 let availability=await call(`/availability?service_id=1&barber_id=1&date=${day}`);assert(!availability.data.slots.includes('10:00'));assert(availability.data.slots.includes('10:15'));
 assert.equal((await call('/admin/blocks',{barber_id:1,date:day,start:'09:00',end:'19:00',reason:'Folga'},undefined,true)).status,409);
 assert.equal((await call('/admin/appointments/'+reservation.id,{status:'confirmado'},'PATCH',true)).status,200);
 assert.equal((await call('/admin/appointments/'+reservation.id,{...customer,time:'11:00'},'PUT',true)).status,200);
 assert.equal((await call('/admin/appointments/'+reservation.id,{status:'concluido'},'PATCH',true)).status,200);
 const afterFinish=await call(`/admin/data?from=${day}&to=${day}`,undefined,'GET',true);
 assert.equal(afterFinish.data.appointments.find(a=>a.id===reservation.id).status,'concluido');
 assert(!afterFinish.data.dashboard.upcoming.some(a=>a.id===reservation.id));
 assert.equal((await call('/admin/appointments/'+reservation.id,{status:'cancelado'},'PATCH',true)).status,200);
 const block=await call('/admin/blocks',{barber_id:1,date:day,start:'09:00',end:'19:00',reason:'Folga'},undefined,true);assert.equal(block.status,201);
 assert.equal((await call(`/availability?service_id=1&barber_id=1&date=${day}`)).data.slots.length,0);
 assert.equal((await call('/admin/appointments/'+reservation.id,{status:'confirmado'},'PATCH',true)).status,409);
 assert.equal((await call('/admin/blocks/'+block.data.id,undefined,'DELETE',true)).status,200);
 const service=await call('/admin/services',{name:'Teste',description:'Serviço',price:12.5,duration:15},undefined,true);assert.equal(service.status,201);
 assert.equal((await call('/admin/services/'+service.data.id,{name:'Alterado',description:'Serviço',price:20,duration:30,active:1},'PUT',true)).status,200);
 assert.equal((await call('/admin/services/'+service.data.id,undefined,'DELETE',true)).status,200);
 const barber=await call('/admin/barbers',{name:'Barbeiro Teste',specialty:'Clássico',photo:'',rating:5},undefined,true);assert.equal(barber.status,201);
 assert.equal((await call('/admin/barbers/'+barber.data.id,{name:'Atualizado',specialty:'Barba',photo:'',rating:4,active:1},'PUT',true)).status,200);
 assert.equal((await call('/admin/barbers/'+barber.data.id,undefined,'DELETE',true)).status,200);
 // Complete dashboard, manual reservations, calendar and preserved snapshots.
 assert.equal((await call('/appointments',{...customer,time:'16:00',phone:'----------'})).status,400);
 assert.equal((await call('/admin/appointments',{...customer,time:'16:00'})).status,401);
 const manual=await call('/admin/appointments',{...customer,service_id:1,time:'16:00',phone:'(11) 98888-7777'},undefined,true);
 assert.equal(manual.status,201);assert.equal(manual.data.status,'confirmado');assert.equal(manual.data.phone,'11988887777');assert(manual.data.customer_id);
 const competing=await Promise.all([call('/appointments',{...customer,service_id:1,time:'17:00'}),call('/admin/appointments',{...customer,service_id:1,time:'17:00'},undefined,true)]);
 assert.deepEqual(competing.map(r=>r.status).sort(),[201,409]);
 const dashboard=await call('/admin/data?from='+day+'&to='+day,undefined,'GET',true);
 assert.equal(dashboard.status,200);assert.equal(dashboard.data.dashboard.customers,2);assert(dashboard.data.dashboard.revenue>0);assert(dashboard.data.dashboard.upcoming.length>0);
 const calendar=await call('/calendar?service_id=1&barber_id=1&month='+day.slice(0,7));
 assert.equal(calendar.status,200);assert(calendar.data.days.find(d=>d.date===day).available);
 let sunday=new Date(day+'T12:00:00Z');while(sunday.getUTCDay()!==0)sunday.setUTCDate(sunday.getUTCDate()+1);
 assert.equal((await call('/appointments',{...customer,date:sunday.toISOString().slice(0,10),time:'14:00'})).status,409);
 assert.equal((await call('/admin/services/1',{name:'Corte atualizado',description:'Teste',price:99,duration:60,active:1},'PUT',true)).status,200);
 const moved=await call('/admin/appointments/'+manual.data.id,{...customer,service_id:1,time:'14:00',phone:'11988887777'},'PUT',true);
 assert.equal(moved.status,200);assert.equal(moved.data.price,40);assert.equal(moved.data.end-moved.data.start,45);assert.equal(moved.data.service_name,'Corte');
 const settings=await call('/admin/settings',{name:'Barbearia Teste',whatsapp:'5541999999999',address:'Rua de Teste, 100'},'PUT',true);
 assert.equal(settings.status,200);assert.equal((await call('/catalog')).data.shop.name,'Barbearia Teste');
 assert.equal((await call('/admin/settings',{name:'X'},'PUT',true)).status,400);
 const foreign=await fetch(base+'/appointments',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.invalid'},body:JSON.stringify(customer)});assert.equal(foreign.status,403);
 assert.equal((await call('/admin/services/3',undefined,'DELETE',true)).status,200);assert.equal(db.prepare('SELECT active FROM services WHERE id=3').get().active,0);
 assert.equal((await call('/logout',{},undefined,true)).status,200);assert.equal((await call(`/admin/data?from=${day}&to=${day}`,undefined,'GET',true)).status,401);
 }finally{await new Promise(r=>server.close(r));db.close();}
});
