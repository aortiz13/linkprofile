"use client";

import { WorkshopHeader, WorkshopFooter, VideoShell } from "../components";
import StripeCTA from "../StripeCTA";

export default function GraciasClient() {
  return (
    <>
      <WorkshopHeader pill="Confirmado" />

      {/* Confirmación */}
      <section className="confirm-banner">
        <div className="confirm-banner__check">✓</div>
        <h1>¡Listo! Tu recurso está en camino</h1>
        <p>Revisá tu Whatsapp en los próximos 5 minutos.</p>
      </section>

      <div className="transition-text">— Pero antes de irte, quiero mostrarte algo —</div>

      {/* Video oferta */}
      <section className="section">
        <div className="container">
          <div className="section__head" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="section__eyebrow">Oferta especial · Solo en esta página</span>
            <h2 className="section__title">Los prompts son la punta del iceberg.</h2>
            <p className="section__sub">Lo que cambia tu vida con IA no son los prompts. Es saber <strong>cómo pensar</strong> con IA.</p>
          </div>

          <VideoShell caption1="Mirá esto · 2:15" caption2="Workshop · 16 May" style={{ marginBottom: 32 }} />

          <div className="price-block">
            <span className="price-block__eyebrow">WORKSHOP EN VIVO · SOLO $17 USD</span>
            <h2 className="price-block__title">Domina Claude a Nivel Profesional</h2>

            <div style={{ display: "grid", gap: 12, maxWidth: 520, margin: "0 auto 32px", textAlign: "left" }}>
              {[
                "Configurá Claude como un asistente profesional personalizado.",
                "Automatizá las tareas que hoy te roban horas.",
                "Construí tu primer sistema o agente, en vivo.",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", color: "var(--gray-400)", fontSize: 15 }}>
                  <span style={{ color: "var(--accent-400)", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div className="price-tag">
              <span className="price-tag__old">$97 USD</span>
              <span className="price-tag__new"><span className="price-tag__currency">USD</span>17</span>
            </div>
            <p className="price-block__note">Precio de lanzamiento. Solo disponible en esta página.</p>

            <StripeCTA className="btn btn--accent btn--lg">
              Quiero mi lugar — $17 USD
              <span className="btn-arrow">→</span>
            </StripeCTA>

            <ul className="price-block__details">
              <li>Sábado 16 mayo, 2026</li>
              <li>100% EN VIVO · grabación incluida</li>
              <li>Grupo de WhatsApp exclusivo</li>
            </ul>
          </div>

          <p style={{ textAlign: "center", marginTop: 32, fontSize: 14, color: "var(--text-muted)" }}>
            Quedan <strong style={{ color: "var(--text-primary)" }}>33 lugares</strong> de 100.
          </p>
        </div>
      </section>

      <WorkshopFooter />
    </>
  );
}
