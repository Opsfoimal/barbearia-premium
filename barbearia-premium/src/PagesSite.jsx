import InstagramIcon from './components/InstagramIcon';
import React from 'react';
import { publicCatalog } from './lib/publicCatalog.js';
import './style.css';

export default function PagesSite() {
  const { shop, services, barbers } = publicCatalog;

  const whatsapp = (message) =>
    `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;

  const money = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  return (
    <>
      <header>
        <a className="brand" href="#">
          <img
            src={`${import.meta.env.BASE_URL}images/SQB.STUDIO.jpeg`}
            alt="Logo da barbearia"
          />
          <span>{shop.name}</span>
        </a>
        <nav>
          <a href="#services">Serviços</a>
          <a href="#team">Equipe</a>
          <a href="#contact">Contato</a>
          <a href="https://www.instagram.com/vineebarber/" target="_blank" rel="noopener noreferrer"><InstagramIcon/> Instagram ↗</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">ESTILO E CUIDADO</div>
          <h1>
            Seu estilo.
            <br />
            Nossa <em>assinatura.</em>
          </h1>
          <p>
            Cortes, barba e tratamentos para renovar seu visual.
            Agende seu atendimento diretamente pelo WhatsApp.
          </p>
          <a
            className="button"
            href={whatsapp('Olá! Gostaria de agendar um horário.')}
            target="_blank"
            rel="noreferrer"
          >
            Agendar pelo WhatsApp ↗
          </a>
          <p>{shop.hours}</p>
        </div>

        <div className="hero-art hero-logo">
          <img src={`${import.meta.env.BASE_URL}images/SQB.STUDIO.jpeg`} alt="Logo DQB Studio" className="hero-logo-image" />
          <span>{shop.name}</span>
          <small>BARBEARIA E CUIDADO MASCULINO</small>
        </div>
      </section>

      <section id="services">
        <div className="eyebrow">NOSSOS SERVIÇOS</div>
        <h2>Escolha seu atendimento.</h2>
        <div className="grid services">
          {services.map((service) => (
            <article key={service.id}>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="card-bottom">
                <strong>{money(service.price)}</strong>
                <small>{service.duration} min aproximadamente</small>
              </div>
              <a
                className="link"
                href={whatsapp(
                  `Olá! Gostaria de agendar ${service.name}, por ${money(service.price)}. Quais horários estão disponíveis?`
                )}
                target="_blank"
                rel="noreferrer"
              >
                Agendar este serviço ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="team">
        <div className="eyebrow">NOSSA EQUIPE</div>
        <h2>Conheça os profissionais.</h2>
        <div className="grid team">
          {barbers.map((barber) => (
            <article key={barber.id}>
              <div className="portrait">
                <img
                  src={`${import.meta.env.BASE_URL}images/barber.svg`}
                  alt={`Ilustração de ${barber.name}`}
                />
              </div>
              <div>
                <h3>{barber.name}</h3>
                <p>{barber.specialty}</p>
                <a
                  className="link"
                  href={whatsapp(
                    `Olá! Gostaria de agendar com ${barber.name}.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Agendar com este profissional ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="location">
        <div>
          <h2>Venha nos visitar.</h2>
          <p>{shop.address}</p>
          <p>{shop.hours}</p>
          <a
            className="button"
            href={whatsapp('Olá! Gostaria de mais informações.')}
            target="_blank"
            rel="noreferrer"
          >
            Falar pelo WhatsApp ↗
          </a>
          <a className="button instagram-button" href="https://www.instagram.com/vineebarber/" target="_blank" rel="noopener noreferrer">
            <InstagramIcon/> Instagram · @vineebarber ↗
          </a>
          <p>
            Horários e agendamentos são confirmados pelo WhatsApp.
          </p>
        </div>
        <iframe
          title="Localização da barbearia"
          loading="lazy"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.address)}&output=embed`}
        />
      </section>

      <footer>
        <span>{shop.name} · Cuidado em cada detalhe.</span>
      </footer>
    </>
  );
}
