"use client";

import { WorkshopHeader, WorkshopFooter, VideoShell, LeadMagnetForm } from "../components";

export default function B2Client() {
  return (
    <>
      <WorkshopHeader pill="Tutorial gratuito" />

      <section className="hero">
        <div className="container hero__inner">
          <span className="eyebrow-line">
            <span className="eyebrow-line__dot" />
            Tutorial gratuito · 10 minutos · Acceso inmediato
          </span>
          <h1>Cómo configurar Claude como <em>un profesional</em> en 10 minutos.</h1>
          <p className="hero__sub">Tutorial gratuito paso a paso. Incluye 2 prompts avanzados listos para copiar.</p>

          <VideoShell caption1="Preview · 0:30" caption2="Tutorial completo · 10 min" style={{ margin: "28px 0" }} />

          <ul className="magnet-bullets">
            <li>Configurá Projects y Custom Instructions para que Claude te entienda sin repetir contexto.</li>
            <li>Aprendé la técnica de &quot;prompt encadenado&quot; que triplica la calidad de respuestas.</li>
            <li>Llevate 2 prompts pro listos para copiar y usar.</li>
          </ul>

          <LeadMagnetForm
            cta="Ver el tutorial gratis"
            note="Te mando el link del tutorial directo a tu WhatsApp."
            redirectTo="/w/gracias"
          />
        </div>
      </section>

      <WorkshopFooter extra="Tutorial gratuito · Sin spam" />
    </>
  );
}
