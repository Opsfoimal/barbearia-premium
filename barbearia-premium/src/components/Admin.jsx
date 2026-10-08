import React,{useEffect,useRef,useState} from 'react';
import Field from './Field';
import AppointmentForm from './AppointmentForm';
import Management from './Management';
import {api,addDays,hour,money,nice,statusLabel,whatsapp} from '../lib/api';

export default function Admin({catalog,onCatalogChange}){
 const [logged,setLogged]=useState(false),[checking,setChecking]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[day,setDay]=useState(catalog.shop.today),[view,setView]=useState('day'),[tab,setTab]=useState('agenda'),[data,setData]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[working,setWorking]=useState(false),[loading,setLoading]=useState(false),[editor,setEditor]=useState(null),[settings,setSettings]=useState(catalog.shop),[block,setBlock]=useState({barber_id:'',date:catalog.shop.today,start:'09:00',end:'19:00',reason:'Folga'});
 const [showFinished,setShowFinished]=useState(false);
 const request=useRef(0);
 const to=view==='week'?addDays(day,6):day;
 async function load({silent=false}={}){
  const version=++request.current;if(!silent)setLoading(true);
  try{const result=await api(`/admin/data?from=${day}&to=${to}`);if(version===request.current){setData(result);setLogged(true);if(!silent)setSettings(result.shop);}}
  catch(e){if(version===request.current){if(e.status===401){setLogged(false);setData(null);}else setError(e.message);}}
  finally{if(version===request.current&&!silent){setLoading(false);setChecking(false);}}
 }
 useEffect(()=>{load();return ()=>{request.current++;};},[day,view]);
 useEffect(()=>{
  if(!logged||tab!=='agenda'||working||loading)return;
  let pending=false;
  const refresh=async()=>{
   if(document.visibilityState==='hidden'||pending)return;
   pending=true;
   try{await load({silent:true});}finally{pending=false;}
  };
  const timer=setInterval(refresh,15000);
  document.addEventListener('visibilitychange',refresh);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[logged,tab,working,loading,day,view]);
 async function act(fn,reload=true){setError('');setMessage('');setWorking(true);try{await fn();if(reload){await load();onCatalogChange(await api('/catalog'));}setMessage('Alteração salva.');}catch(e){setError(e.message);if(e.status===401){setLogged(false);setData(null);}}finally{setWorking(false);}}
 if(checking)return <main><p role="status">Verificando sessão…</p></main>;
 if(!logged)return <main className="login"><div className="eyebrow">GESTÃO DA BARBEARIA</div><h1>Bem-vindo<br/>de volta.</h1><p>Use o acesso administrativo configurado no arquivo .env.</p><form onSubmit={e=>{e.preventDefault();act(async()=>{await api('/login',{email,password});setPassword('');},true);}}><Field label="E-mail" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/><Field label="Senha" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p className="error" role="alert">{error}</p>}<button className="button full" disabled={working}>{working?'Entrando…':'Entrar no painel ↗'}</button></form></main>;
 const appointments=data?.appointments||[];
 const visibleAppointments=appointments.filter(a=>showFinished||a.status!=='concluido');
 return <main className="admin"><div className="section-head"><div><div className="eyebrow">PAINEL ADMINISTRATIVO</div><h1>Sua agenda, em ordem.</h1></div><button disabled={working} onClick={()=>act(async()=>{await api('/logout',{});request.current++;setLogged(false);setData(null);setEditor(null);},false)}>Sair</button></div>
 <div className="admin-tabs">{[['agenda','Agenda'],['blocks','Bloqueios e folgas'],['services','Serviços'],['barbers','Barbeiros'],['settings','Configurações']].map(([key,label])=><button key={key} className={tab===key?'selected':''} onClick={()=>{setTab(key);setEditor(null);}}>{label}</button>)}</div>
 <div className="toolbar"><Field label="Data inicial" type="date" required value={day} onChange={e=>{if(e.target.value)setDay(e.target.value);}}/><label className="field">Visualização<select value={view} onChange={e=>setView(e.target.value)}><option value="day">Diária</option><option value="week">Semanal (7 dias)</option></select></label><span>{nice(day)}{view==='week'?' — '+nice(to):''}</span><button disabled={loading} onClick={load}>Atualizar agenda</button></div>
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}{loading&&<p role="status">Atualizando agenda…</p>}
 {tab==='agenda'&&data&&<><div className="stats">{[['Agendamentos de hoje',data.dashboard.today],['Clientes cadastrados',data.dashboard.customers],['Reservas no período',appointments.length],['Faturamento estimado',money(data.dashboard.revenue)]].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><p className="muted">Faturamento do período selecionado, excluindo reservas canceladas. Clientes identificados pelo telefone.</p>
 <div className="section-head"><h2>Agenda {view==='week'?'semanal':'diária'}</h2><button className="button" onClick={()=>setEditor({kind:'new'})}>+ Agendamento manual</button></div>
 {editor&&<AppointmentForm key={editor.appointment?.id||'new'} data={data} today={catalog.shop.today} initial={editor.appointment} busy={working} onClose={()=>setEditor(null)} onSave={form=>act(async()=>{await api('/admin/appointments'+(editor.appointment?'/'+editor.appointment.id:''),form,editor.appointment?'PUT':'POST');setEditor(null);})}/>}
 <button type="button" aria-pressed={showFinished} onClick={()=>setShowFinished(value=>!value)}>{showFinished?'Ocultar finalizados':'Mostrar finalizados'}</button>
 {!visibleAppointments.length&&<p className="empty">Nenhum agendamento para exibir neste período.</p>}
 <div className="appointment-list">{visibleAppointments.map(a=><article key={a.id}><div><span className={'badge '+a.status}>{statusLabel(a.status)}</span><h3>{hour(a.start)} – {hour(a.end)} <small>· {nice(a.date)}</small></h3><strong>{a.name}</strong><p>{a.service_name} · {a.barber_name} · {money(a.price)}</p><a href={`https://wa.me/${whatsapp(a.phone)}`} target="_blank" rel="noreferrer">{a.phone}</a>{a.email&&<small>{a.email}</small>}</div><div className="actions">{[['confirmado','Confirmar'],['cancelado','Cancelar'],['concluido','Finalizado']].map(([status,label])=><button key={status} disabled={working||a.status===status||loading} onClick={()=>act(()=>api('/admin/appointments/'+a.id,{status},'PATCH'))}>{label}</button>)}<button disabled={working} onClick={()=>setEditor({kind:'reschedule',appointment:a})}>Reagendar</button></div></article>)}</div>
 <h2 className="upcoming-title">Próximos agendamentos</h2><div className="grid upcoming">{data.dashboard.upcoming.map(a=><article key={a.id}><span className={'badge '+a.status}>{statusLabel(a.status)}</span><h3>{nice(a.date)} · {hour(a.start)}</h3><strong>{a.name}</strong><p>{a.service_name} · {a.barber_name}</p><button className="button" disabled={working||loading} onClick={()=>act(()=>api('/admin/appointments/'+a.id,{status:'concluido'},'PATCH'))}>Finalizado</button></article>)}</div>{!data.dashboard.upcoming.length&&<p>Nenhum próximo agendamento.</p>}</>}
 {tab==='blocks'&&data&&<><form className="editor" onSubmit={e=>{e.preventDefault();act(()=>api('/admin/blocks',{...block,barber_id:block.barber_id||null}));}}><h3>Bloquear horário, dia ou folga</h3><div className="two"><label className="field">Profissional<select value={block.barber_id} onChange={e=>setBlock({...block,barber_id:e.target.value})}><option value="">Toda a barbearia</option>{data.barbers.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Field label="Dia" type="date" required value={block.date} onChange={e=>setBlock({...block,date:e.target.value})}/><Field label="Das" type="time" required value={block.start} onChange={e=>setBlock({...block,start:e.target.value})}/><Field label="Até" type="time" required value={block.end} onChange={e=>setBlock({...block,end:e.target.value})}/></div><Field label="Motivo" required minLength={2} maxLength={150} value={block.reason} onChange={e=>setBlock({...block,reason:e.target.value})}/><button className="button" disabled={working}>Salvar bloqueio</button><button type="button" onClick={()=>setBlock({...block,start:'09:00',end:'19:00'})}>Dia completo / folga</button><p className="muted">Reservas existentes precisam ser canceladas ou reagendadas antes de bloquear.</p></form>{data.blocks.map(b=><article className="block-row" key={b.id}><div><strong>{nice(b.date)} · {hour(b.start)}–{hour(b.end)}</strong><p>{b.barber_name||'Toda a barbearia'} · {b.reason}</p></div><button disabled={working} onClick={()=>act(()=>api('/admin/blocks/'+b.id,undefined,'DELETE'))}>Remover</button></article>)}</>}
 {['services','barbers'].includes(tab)&&data&&<Management key={tab} tab={tab} data={data} act={act} busy={working}/>}
 {tab==='settings'&&<form className="editor" onSubmit={e=>{e.preventDefault();act(()=>api('/admin/settings',settings,'PUT'));}}><h3>Dados da barbearia</h3><Field label="Nome" required minLength={2} maxLength={80} value={settings.name} onChange={e=>setSettings({...settings,name:e.target.value})}/><Field label="WhatsApp (DDI + DDD + número)" required pattern="[0-9]{12,13}" value={settings.whatsapp} onChange={e=>setSettings({...settings,whatsapp:e.target.value})}/><Field label="Endereço" required minLength={5} maxLength={200} value={settings.address} onChange={e=>setSettings({...settings,address:e.target.value})}/><p>Funcionamento: {settings.hours}</p><button className="button" disabled={working}>Salvar configurações</button></form>}
 </main>;
}
