"use client";

import { WorkshopHeader, WorkshopFooter, VideoShell, PriceBlock, StickyCta, FaqItem } from "../components";

export default function A2Client() {
  return (
    <>
      <WorkshopHeader pill="Workshop · 16 May" />

      <section className="hero">
        <div className="container hero__inner">
          <span className="eyebrow-line">
            <span className="eyebrow-line__dot" />
            Workshop 100% EN VIVO · Sábado 16 May · 10am ARG · USD $17
          </span>
          <h1>¿Pagás Claude Pro y solo usás <em>el 1%</em>?</h1>
          <p className="hero__sub">En vivo te muestro el otro 99%.</p>

          <VideoShell caption1="Mirá el video · 2:30" caption2="16 MAY · USD $17" style={{ margin: "32px 0 28px" }} />

          <ul className="quick-bullets">
            <li>Configurá Claude como un profesional, no como un chatbot genérico.</li>
            <li>Automatizá tareas que hoy te toman horas.</li>
            <li>Construí tu primer sistema automatizado en vivo.</li>
          </ul>

          <div className="cta-block" style={{ marginBottom: 16 }}>
            <a href="#reservar" className="btn btn--primary btn--lg">
              Reservar mi lugar — $17 USD
              <span className="btn-arrow">→</span>
            </a>
            <span className="cta-meta">
              <span>100 cupos</span>
              <span className="cta-meta__dot" />
              <span>Grabación + WhatsApp incluidos</span>
            </span>
          </div>
        </div>
      </section>

      {/* MINI FAQ */}
      <section className="section section--gray" id="faq">
        <div className="container">
          <div className="section__head" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="section__eyebrow">Antes de reservar</span>
            <h2 className="section__title">Lo esencial</h2>
          </div>
          <div className="faq-list">
            <FaqItem question="¿Se graba?" answer="Sí. Recibís la grabación dentro de las 24 hs siguientes." open />
            <FaqItem question="¿Necesito saber programar?" answer="No. Solo una cuenta de Claude (free o Pro) y tu computadora." />
            <FaqItem question="¿Hay reembolsos?" answer='Por la naturaleza del producto <strong>no se ofrecen reembolsos</strong>. Escribinos antes de comprar si tenés dudas.' />
          </div>
        </div>
      </section>

      {/* PRICE */}
      <section className="section" id="reservar">
        <div className="container">
          <PriceBlock
            eyebrow="Precio de lanzamiento"
            title="Una sesión EN VIVO. Un solo objetivo: que Claude trabaje por vos."
            note="Menos que un mes de Claude Pro. Después del workshop, ese plan te rinde 10 veces más."
            ctaHref="#reservar"
            ctaText="Quiero mi lugar — $17 USD"
            details={["Sábado 16 de mayo, 2026 · 10am ARG", "100% EN VIVO · grabación incluida", "Grupo de WhatsApp"]}
          />
        </div>
      </section>

      <WorkshopFooter />
      <StickyCta />
    </>
  );
}
