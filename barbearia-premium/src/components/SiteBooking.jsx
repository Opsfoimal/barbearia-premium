import React, { useEffect, useState } from 'react';
import { api, money, nice } from '../lib/api';

export default function SiteBooking({ serviceName, active }) {
  const [catalog, setCatalog] = useState(null);
  const [form, setForm] = useState({ service_id: '', barber_id: '', date: '', time: '', name: '', phone: '', email: '' });
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setCatalog(null); setError(''); setDone(null);
    api('/catalog', undefined, undefined, controller.signal).then(data => {
      const selected = data.services.find(service => service.name === serviceName);
      setCatalog(data);
      setForm(previous => ({ ...previous, service_id: selected ? String(selected.id) : '', barber_id: '', date: data.shop.today, time: '' }));
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [active, serviceName, retry]);

  useEffect(() => {
    setSlots([]);
    if (!active || !catalog || !form.service_id || !form.barber_id || !form.date) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    api(`/availability?service_id=${form.service_id}&barber_id=${form.barber_id}&date=${form.date}`, undefined, undefined, controller.signal)
      .then(data => setSlots(data.slots))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, catalog, form.service_id, form.barber_id, form.date, retry]);

  function update(key, value) {
    setError('');
    setForm(previous => ({ ...previous, [key]: value, ...(['service_id', 'barber_id', 'date'].includes(key) ? { time: '' } : {}) }));
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { setDone(await api('/appointments', form)); }
    catch (err) { setError(err.message); setForm(previous => ({ ...previous, time: '' })); }
    finally { setBusy(false); }
  }
  if (!catalog) return <div className="site-booking-content"><h2 id="booking-title">Agende seu atendimento.</h2><p role={error ? 'alert' : 'status'}>{error || 'Carregando a agenda…'}</p>{error && <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>}</div>;
  if (done) return <div className="site-booking-content" role="status"><h2 id="booking-title">Agendamento realizado!</h2><p>Reserva #{done.id} · Aguardando confirmação da barbearia.</p><dl>{[['Cliente', done.name], ['Serviço', done.service_name], ['Profissional', done.barber_name], ['Data', nice(done.date)], ['Horário', done.time], ['Valor', money(done.price)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button type="button" className="button" onClick={() => setRetry(value => value + 1)}>Fazer outro agendamento</button></div>;
  const service = catalog.services.find(item => String(item.id) === form.service_id);
  return <form className="site-booking-content" onSubmit={submit}>
    <div className="eyebrow">AGENDA DQB STUDIO</div><h2 id="booking-title">Agende seu atendimento.</h2>
    <label className="field">Serviço<select required value={form.service_id} disabled={busy} onChange={event => update('service_id', event.target.value)}><option value="">Selecione</option>{catalog.services.map(item => <option key={item.id} value={item.id}>{item.name} · {money(item.price)}</option>)}</select></label>
    <div className="two"><label className="field">Profissional<select required value={form.barber_id} disabled={busy} onChange={event => update('barber_id', event.target.value)}><option value="">Selecione</option>{catalog.barbers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field">Data<input type="date" min={catalog.shop.today} required value={form.date} disabled={busy} onChange={event => update('date', event.target.value)} /></label></div>
    <p>Horários disponíveis</p><div className="slots">{slots.map(time => <button key={time} type="button" disabled={busy || loading} className={form.time === time ? 'selected' : ''} aria-pressed={form.time === time} onClick={() => update('time', time)}>{time}</button>)}</div>
    <p className="muted" role="status">{loading ? 'Consultando horários…' : !form.service_id || !form.barber_id ? 'Escolha o serviço e o profissional.' : !slots.length ? 'Nenhum horário disponível. Escolha outra data.' : 'Horários de São Paulo.'}</p>
    <label className="field">Nome completo<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} disabled={busy} onChange={event => update('name', event.target.value)} /></label>
    <label className="field">WhatsApp com DDD<input type="tel" required autoComplete="tel" pattern="[+0-9 ()-]{10,20}" value={form.phone} disabled={busy} onChange={event => update('phone', event.target.value)} /></label>
    {service && <p>{service.name} · {service.duration} min · <strong>{money(service.price)}</strong></p>}
    {error && <p className="error" role="alert">{error}</p>}
    <button type="submit" className="button full" disabled={busy || loading || !form.time}>{busy ? 'Reservando…' : 'Confirmar agendamento'}</button>
    <p className="muted">Seus dados serão usados para organizar sua reserva e entrar em contato.</p>
  </form>;
}
