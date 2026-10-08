import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Customer from './components/Customer';
import Admin from './components/Admin';
import {api} from './lib/api';
import './style.css';

function App(){
 const [catalog,setCatalog]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api('/catalog').then(setCatalog).catch(e=>setError(e.message));},[]);
 if(!catalog)return <main><h1>D’Quebrada Cortes</h1><p role="alert">{error||'Preparando sua experiência…'}</p></main>;
 return <><header><a className="brand" href="/"><img src="/images/logo.svg" alt=""/><span>{catalog.shop.name}<small>BARBEARIA · ESTILO & CUIDADO</small></span></a><nav><a href="/#services">Serviços</a><a href="/#team">Equipe</a><a href="/admin">Área administrativa</a></nav><a className="button small" href="/#booking">Agendar horário</a></header>{location.pathname==='/admin'?<Admin catalog={catalog} onCatalogChange={setCatalog}/>:<Customer catalog={catalog}/>}<footer><span>{catalog.shop.name} · Cuidado em cada detalhe.</span><span>Projeto demonstrativo · avaliações ilustrativas</span></footer></>;
}
createRoot(document.getElementById('root')).render(<App/>);
