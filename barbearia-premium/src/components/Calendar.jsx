import React,{useEffect,useState} from 'react';
import {api,nice} from '../lib/api';

export default function Calendar({serviceId,barberId,value,today,onChange}){
 const [month,setMonth]=useState((value||today).slice(0,7)),[days,setDays]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value))setMonth(value.slice(0,7));
 },[value]);
 useEffect(()=>{
  const controller=new AbortController();setDays([]);setError('');setLoading(false);
  if(serviceId&&barberId){setLoading(true);api(`/calendar?service_id=${serviceId}&barber_id=${barberId}&month=${month}`,undefined,undefined,controller.signal).then(data=>setDays(data.days)).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});}
  return ()=>controller.abort();
 },[serviceId,barberId,month]);
 const shift=n=>{const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);setMonth(d.toISOString().slice(0,7));};
 const offset=new Date(month+'-01T12:00:00Z').getUTCDay();
 const title=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));
 return <div className="calendar" aria-label="Calendário de disponibilidade">
  <div className="calendar-head"><button type="button" aria-label="Mês anterior" disabled={month<=today.slice(0,7)} onClick={()=>shift(-1)}>‹</button><strong>{title}</strong><button type="button" aria-label="Próximo mês" onClick={()=>shift(1)}>›</button></div>
  <div className="calendar-grid">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><span className="weekday" key={d}>{d}</span>)}
   {Array.from({length:offset},(_,i)=><span key={'empty'+i}/>)}
   {days.map(day=><button key={day.date} type="button" disabled={!day.available||loading} aria-label={`${nice(day.date)}${day.available?' disponível':' indisponível'}`} aria-pressed={value===day.date} className={value===day.date?'selected':''} onClick={()=>onChange(day.date)}>{Number(day.date.slice(8))}{day.available&&<i/>}</button>)}
  </div>
  <p className="muted" role="status">{error||(!serviceId||!barberId?'Selecione serviço e profissional para ver os dias disponíveis.':loading?'Consultando calendário…':'• Dias com ponto dourado têm horários disponíveis.')}</p>
 </div>;
}
