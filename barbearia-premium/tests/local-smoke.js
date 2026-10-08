import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const backend=`http://localhost:${process.env.PORT||3001}`;
const frontend='http://localhost:5173';
for(const base of [backend,frontend]){
 for(const route of ['/','/admin','/images/logo.svg','/images/barber.svg']){const response=await fetch(base+route);assert.equal(response.status,200,base+route);}
 const catalog=await (await fetch(base+'/api/catalog')).json();assert(catalog.services.length>0);assert(catalog.barbers.length>0);
 assert.equal((await fetch(base+'/api/admin/data?from='+catalog.shop.today+'&to='+catalog.shop.today)).status,401);
 const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'DQBStudio',Origin:base},body:JSON.stringify({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
 assert.equal(login.status,200,'Login com as credenciais locais');
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const dashboard=await fetch(base+'/api/admin/data?from='+catalog.shop.today+'&to='+catalog.shop.today,{headers:{cookie}});
 assert.equal(dashboard.status,200);const data=await dashboard.json();assert(data.dashboard);assert(data.shop.name);
 const logout=await fetch(base+'/api/logout',{method:'POST',headers:{cookie,Origin:base,'X-Requested-With':'DQBStudio'}});assert.equal(logout.status,200);
 console.log(`OK: ${base} — site, painel, imagens, catálogo, login, dashboard e logout.`);
}
