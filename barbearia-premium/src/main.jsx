import InstagramIcon from './components/InstagramIcon';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Customer from './components/Customer';
import Admin from './components/Admin';
import PagesSite from './PagesSite.jsx';
import { api } from './lib/api';
import './style.css';

const isGitHubPages =
  import.meta.env.VITE_GITHUB_PAGES === 'true';

function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/catalog')
      .then(setCatalog)
      .catch((err) => setError(err.message));
  }, []);

  if (!catalog) {
    return (
      <main>
        <h1>DQB STUDIO</h1>
        <p role="alert">
          {error || 'Preparando sua experiência…'}
        </p>
      </main>
    );
  }

  return (
    <>
      <header>
        <a className="brand" href="/">
          <img src="/images/SQB.STUDIO.jpeg" alt="" />
          <span>
            {catalog.shop.name}
            <small>BARBEARIA · ESTILO & CUIDADO</small>
          </span>
        </a>

        <nav>
          <a href="/#services">Serviços</a>
          <a href="/#team">Equipe</a>
          <a href="/admin">Área administrativa</a>
          <a href="https://www.instagram.com/vineebarber/" target="_blank" rel="noopener noreferrer"><InstagramIcon/> Instagram ↗</a>
        </nav>

        <a className="button small" href="/#booking">
          Agendar horário
        </a>
      </header>

      {location.pathname === '/admin' ? (
        <Admin
          catalog={catalog}
          onCatalogChange={setCatalog}
        />
      ) : (
        <Customer catalog={catalog} />
      )}

      <footer>
        <span>
          {catalog.shop.name} · Cuidado em cada detalhe.
        </span>
        <span>
          Projeto demonstrativo · avaliações ilustrativas
        </span>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  isGitHubPages ? <PagesSite /> : <App />
);
