import InstagramIcon from './components/InstagramIcon';
import React, { useRef, useState } from 'react';
import { publicCatalog } from './lib/publicCatalog.js';
import './style.css';
import SiteBooking from './components/SiteBooking';

export default function PagesSite() {
  const { shop, services } = publicCatalog;
  const [serviceId, setServiceId] = useState(String(services[0].id));
  const bookingRef = useRef(null);
  const [bookingActive, setBookingActive] = useState(false);
  const selectedService = services.find(service => String(service.id) === serviceId);
  function chooseService(id) {
    setServiceId(String(id));
    bookingRef.current?.showModal();
    setBookingActive(true);
  }

  const whatsapp = (message) =>
    `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;

  const money = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  return (
    <div className="public-site">
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
          <a className="hero-instagram" href="https://www.instagram.com/vineebarber/" target="_blank" rel="noopener noreferrer">
            <InstagramIcon /> Veja nossos trabalhos no Instagram
          </a>
          <p className="opening-hours">{shop.hours}</p>
        </div>

        <div className="hero-art hero-logo">
          <img src={`${import.meta.env.BASE_URL}images/SQB.STUDIO.jpeg`} alt="Logo DQB Studio" className="hero-logo-image" />
          <span>{shop.name}</span>
          <small>BARBEARIA E CUIDADO MASCULINO</small>
        </div>
      </section>

      <div className="studio-details" aria-label="Atendimento DQB Studio">
        <span><strong>Seu estilo, em primeiro lugar.</strong> Cortes, barba e cuidado pessoal.</span>
        <span><strong>Escolha seu atendimento.</strong> Consulte os serviços e valores abaixo.</span>
        <span><strong>Vamos marcar?</strong> Combine seu horário pelo WhatsApp.</span>
      </div>

      <section id="services">
        <div className="eyebrow">NOSSOS SERVIÇOS</div>
        <h2>Escolha seu atendimento.</h2>
        <div className="grid services">
          {services.map((service, index) => (
            <article key={service.id}>
              <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="card-bottom">
                <strong>{money(service.price)}</strong>
                <small>{service.duration} min aproximadamente</small>
              </div>
              <button
                className="link"
                type="button"
                onClick={() => chooseService(service.id)}
              >
                Agendar este serviço →
              </button>
            </article>
          ))}
        </div>
      </section>

      <dialog className="booking-dialog" ref={bookingRef} aria-labelledby="booking-title" onClose={() => setBookingActive(false)}>
      <button className="booking-close" type="button" aria-label="Fechar agendamento" onClick={() => bookingRef.current?.close()}>Fechar ×</button>
      <SiteBooking serviceName={selectedService.name} active={bookingActive} />
      </dialog>



      <section className="instagram-feature" aria-labelledby="instagram-heading">
        <div>
          <div className="eyebrow">DQB STUDIO NO INSTAGRAM</div>
          <h2 id="instagram-heading">Inspiração para seu próximo corte.</h2>
          <p>Acompanhe nossos trabalhos e encontre o estilo que combina com você.</p>
        </div>
      </section>

      <section id="contact" className="location">
        <div>
          <div className="eyebrow">ENCONTRE A DQB STUDIO</div>
          <h2>Venha nos visitar.</h2>
          <p>{shop.address}</p>
          <p>{shop.hours}</p>
          <a className="button directions-button" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer">
            Como chegar ↗
          </a>
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
          <a className="button instagram-button" href="https://www.instagram.com/martins_lh041/" target="_blank" rel="noopener noreferrer">
            <InstagramIcon/> Instagram · @martins_lh041 ↗
          </a>
          <a className="button instagram-button" href="https://www.instagram.com/kr_barber777/" target="_blank" rel="noopener noreferrer">
            <InstagramIcon/> Instagram · @kr_barber777 ↗
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
        <a href="https://www.instagram.com/vineebarber/" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
      </footer>
      <a className="whatsapp-floating" href={whatsapp('Olá! Gostaria de agendar um horário.')} target="_blank" rel="noopener noreferrer" aria-label="Agendar pelo WhatsApp, abre em nova aba">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.3A8.5 8.5 0 1 1 20 11.5Z" />
          <path d="M8 7.5c-.7 2.8 2.8 6.3 5.6 7 .8.2 1.8-1.2 1.8-1.2l-2-1.2-.8.8c-1.4-.6-2.4-1.6-3-3l.8-.8-1.2-2S8.2 7 8 7.5Z" />
        </svg>
        <span>Agendar horário</span>
      </a>
    </div>
  );
}
