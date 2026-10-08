import React,{useEffect,useState} from 'react';
import Field from './Field';
import {api,money} from '../lib/api';

export default function AppointmentForm({data,today,initial,onSave,onClose,busy}){
 const [form,setForm]=useState(initial?{...initial,time:`${String(Math.floor(initial.start/60)).padStart(2,'0')}:${String(initial.start%60).padStart(2,'0')}`}:{service_id:'',barber_id:'',date:today,time:'',name:'',phone:'',email:''});
 const [slots,setSlots]=useState([]),[error,setError]=useState('');
 const update=(key,value)=>setForm(f=>({...f,[key]:value,...(['date','barber_id','service_id'].includes(key)?{time:''}:{})}));
 useEffect(()=>{
  const controller=new AbortController();setSlots([]);setError('');
  if(!initial&&form.service_id&&form.barber_id&&form.date)api(`/availability?service_id=${form.service_id}&barber_id=${form.barber_id}&date=${form.date}`,undefined,undefined,controller.signal).then(d=>setSlots(d.slots)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return ()=>controller.abort();
 },[form.service_id,form.barber_id,form.date,initial]);
 return <form className="editor" onSubmit={e=>{e.preventDefault();onSave(form);}}><h3>{initial?`Reagendar #${initial.id}`:'Novo agendamento manual'}</h3><div className="two">
  <label className="field">Serviço<select required value={form.service_id} onChange={e=>update('service_id',e.target.value)}><option value="">Selecione</option>{data.services.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name} · {money(s.price)}</option>)}</select></label>
  <label className="field">Barbeiro<select required value={form.barber_id} onChange={e=>update('barber_id',e.target.value)}><option value="">Selecione</option>{data.barbers.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
  <Field label="Data" type="date" required min={today} value={form.date} onChange={e=>update('date',e.target.value)}/>
  {initial?<Field label="Horário" type="time" required step="900" value={form.time} onChange={e=>update('time',e.target.value)}/>:<label className="field">Horário disponível<select required value={form.time} onChange={e=>update('time',e.target.value)}><option value="">Selecione</option>{slots.map(t=><option key={t}>{t}</option>)}</select></label>}
 </div><Field label="Nome completo" required minLength={2} maxLength={100} value={form.name} onChange={e=>update('name',e.target.value)}/><div className="two"><Field label="Telefone / WhatsApp" type="tel" required value={form.phone} onChange={e=>update('phone',e.target.value)}/><Field label="E-mail (opcional)" type="email" value={form.email} onChange={e=>update('email',e.target.value)}/></div>
 {error&&<p role="alert" className="error">{error}</p>}<p className="muted">A disponibilidade será conferida novamente ao salvar. Ao reagendar o mesmo serviço, o valor e a duração originais são preservados.</p><button className="button" disabled={busy}>{busy?'Salvando…':'Salvar agendamento'}</button><button type="button" onClick={onClose}>Fechar</button></form>;
}
