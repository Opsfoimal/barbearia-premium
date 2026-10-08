export async function api(url,body,method,signal){
 const base=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
 const response=await fetch(base+'/api'+url,{credentials:'same-origin',cache:'no-store',method:method||(body?'POST':'GET'),signal,headers:{'X-Requested-With':'DQBStudio',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 if(!response.headers.get('content-type')?.includes('application/json')) throw new Error('A agenda online ainda não está conectada. Entre em contato com a barbearia.');
 const data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.error||'Não foi possível continuar.'),{status:response.status});
 return data;
}
export const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const hour=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
export const nice=value=>value.split('-').reverse().join('/');
export const addDays=(day,count)=>{const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+count);return date.toISOString().slice(0,10);};
export const statusLabel=value=>({pendente:'Agendado',confirmado:'Confirmado',concluido:'Concluído',cancelado:'Cancelado'}[value]||value);
export const whatsapp=phone=>{const digits=phone.replace(/\D/g,'');return digits.length<=11?'55'+digits:digits;};
