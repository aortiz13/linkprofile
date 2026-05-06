"use client";

import { WorkshopFooter } from "../components";

const WA_SVG = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16.001 4C9.374 4 4 9.373 4 16c0 2.115.554 4.182 1.604 5.997L4 28l6.169-1.59A11.945 11.945 0 0016.002 28C22.628 28 28 22.627 28 16S22.629 4 16.001 4zm0 21.818c-1.83 0-3.622-.49-5.187-1.42l-.371-.22-3.66.943.978-3.566-.241-.387a9.832 9.832 0 01-1.515-5.169c0-5.45 4.434-9.882 9.886-9.882 2.64 0 5.122 1.029 6.99 2.898a9.83 9.83 0 012.896 6.991c.001 5.45-4.433 9.812-9.776 9.812zm5.422-7.353c-.297-.149-1.762-.87-2.034-.969-.273-.099-.471-.149-.669.149-.198.297-.768.969-.941 1.167-.173.198-.347.224-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.762-1.654-2.06-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.241-.58-.486-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.793.371c-.273.298-1.041 1.018-1.041 2.481 0 1.464 1.066 2.878 1.215 3.076.149.198 2.099 3.205 5.083 4.494.71.306 1.265.49 1.697.628.713.227 1.362.195 1.875.118.572-.085 1.762-.72 2.011-1.415.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.569-.347z" fill="#fff"/>
  </svg>
);

const WA_SVG_FILL = (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" style={{ width: 20, height: 20 }}>
    <path d="M16.001 4C9.374 4 4 9.373 4 16c0 2.115.554 4.182 1.604 5.997L4 28l6.169-1.59A11.945 11.945 0 0016.002 28C22.628 28 28 22.627 28 16S22.629 4 16.001 4zm5.422 14.465c-.297-.149-1.762-.87-2.034-.969-.273-.099-.471-.149-.669.149-.198.297-.768.969-.941 1.167-.173.198-.347.224-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.762-1.654-2.06-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.241-.58-.486-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.793.371c-.273.298-1.041 1.018-1.041 2.481 0 1.464 1.066 2.878 1.215 3.076.149.198 2.099 3.205 5.083 4.494.71.306 1.265.49 1.697.628.713.227 1.362.195 1.875.118.572-.085 1.762-.72 2.011-1.415.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.569-.347z"/>
  </svg>
);

export default function BienvenidoClient() {
  return (
    <>
      <section className="wa-hero">
        <div className="container wa-hero__inner">
          <span className="wa-confirm-pill">
            <span className="wa-confirm-pill__check">✓</span>
            Tu lugar está reservado
          </span>
          <div className="wa-icon-stack">
            <span className="wa-icon-stack__halo" />
            <span className="wa-icon">{WA_SVG}</span>
          </div>
          <h1>¡Bienvenido <em>al equipo!</em></h1>
          <p className="wa-hero__sub">
            Tu pago se confirmó. <strong>Te esperamos en el grupo exclusivo de WhatsApp</strong> donde vamos a coordinar todo lo del workshop del 16 de mayo.
          </p>
          <a href="https://chat.whatsapp.com/BT74iHONO0yHzZ1XOTbi0n" target="_blank" rel="noopener" className="btn btn--whatsapp btn--lg">
            {WA_SVG_FILL}
            Unirme al grupo de WhatsApp
            <span className="btn-arrow">→</span>
          </a>
          <p className="wa-cta-meta">Hacé click ahora — el grupo cierra entradas 1 hora antes del workshop.</p>
        </div>
      </section>

      <section className="wa-steps">
        <div className="container">
          <div className="wa-steps__head">
            <span className="section__eyebrow">Cómo seguir</span>
            <h2 className="section__title">Próximos 3 pasos</h2>
          </div>
          <div className="wa-steps__list">
            {[
              { title: "Unite al grupo de WhatsApp", desc: "Es donde vamos a mandar el link del workshop, recordatorios, prompts pre-trabajo y el material extra." },
              { title: "Revisá tu email", desc: "Te llegó la confirmación de pago + acceso de respaldo. Si no lo ves, revisá spam." },
              { title: "Preparate para el sábado 16 de mayo", desc: "Computadora, cuenta de Claude (gratuita o Pro) y un caso real que quieras automatizar." },
            ].map((s, i) => (
              <div key={i} className="wa-step">
                <span className="wa-step__num">{i + 1}</span>
                <div>
                  <div className="wa-step__title">{s.title}</div>
                  <div className="wa-step__desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="section__eyebrow">Vista previa</span>
            <h2 className="section__title">Esto te espera adentro</h2>
            <p className="section__sub">Un grupo chico, 100 personas máximo, donde vamos a trabajar juntos antes, durante y después del workshop.</p>
          </div>
          <div className="wa-chat">
            <div className="wa-chat__header">
              <div className="wa-chat__avatar">BB</div>
              <div>
                <div className="wa-chat__name">Workshop · Domina Claude</div>
                <div className="wa-chat__meta">
                  <span className="wa-chat__meta-dot" />
                  <span>87 miembros · activos ahora</span>
                </div>
              </div>
            </div>
            <div className="wa-bubble">
              ¡Bienvenido! Soy Adrian, tu instructor. Vamos a empezar el sábado a las 15:00 (ARG).
              <span className="wa-bubble__time">14:32</span>
            </div>
            <div className="wa-bubble">
              <strong>Tarea pre-workshop:</strong> pensá una tarea repetitiva que hagas todas las semanas. Eso es lo que vamos a automatizar juntos.
              <span className="wa-bubble__time">14:32</span>
            </div>
            <div className="wa-bubble wa-bubble--out">
              Listo, ya estoy. ¿Qué necesito tener instalado?
              <span className="wa-bubble__time">14:35 ✓✓</span>
            </div>
            <div className="wa-bubble">
              Solo tu cuenta de Claude. Te mando el link al setup en 1 minuto.
              <span className="wa-bubble__time">14:36</span>
            </div>
          </div>
        </div>
      </section>

      <section className="wa-details" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div className="section__head" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="section__eyebrow">Tu reserva</span>
            <h2 className="section__title">Detalles del workshop</h2>
          </div>
          <div className="wa-detail-grid">
            {[
              { icon: "📅", label: "Fecha", value: "Sáb 16 May, 2026" },
              { icon: "⏱", label: "Modalidad", value: "100% EN VIVO" },
              { icon: "🎥", label: "Acceso", value: "Grabación incluida" },
            ].map((d) => (
              <div key={d.label} className="wa-detail">
                <div className="wa-detail__icon">{d.icon}</div>
                <div>
                  <div className="wa-detail__label">{d.label}</div>
                  <div className="wa-detail__value">{d.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wa-final">
        <div className="container">
          <h2>No dejes el grupo para después.</h2>
          <p>El primer mensaje del workshop sale por WhatsApp en las próximas horas. Sumate ahora para no perderte nada.</p>
          <a href="https://chat.whatsapp.com/BT74iHONO0yHzZ1XOTbi0n" target="_blank" rel="noopener" className="btn btn--whatsapp btn--lg">
            {WA_SVG_FILL}
            Entrar al grupo de WhatsApp
            <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      <WorkshopFooter extra="Workshop · 16 May 2026 · Confirmado" />
    </>
  );
}
