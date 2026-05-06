"use client";

import { WorkshopFooter, LeadMagnetForm } from "../components";

export default function B1Client() {
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <span className="eyebrow-line">
            <span className="eyebrow-line__dot" />
            PDF gratuito · Llega en 2 minutos a tu email
          </span>
          <h1>5 Prompts Pro para Claude que <em>el 99%</em> no conoce.</h1>
          <p className="hero__sub">Los mismos prompts que uso para automatizar tareas en minutos. <strong>Gratis.</strong></p>

          <ul className="magnet-bullets">
            <li>El prompt que convierte a Claude en un analista de datos sin saber Excel avanzado.</li>
            <li>El prompt que genera 30 ideas de contenido en 2 minutos, con calendario incluido.</li>
            <li>El prompt que crea sistemas automatizados paso a paso, como si tuvieras un programador.</li>
          </ul>

          <LeadMagnetForm
            cta="Quiero los prompts gratis"
            note="Sin spam. Solo valor. Te llega a tu WhatsApp en 2 minutos."
            redirectTo="/w/gracias"
          />

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", letterSpacing: "var(--tracking-wider)", textTransform: "uppercase" as const, fontWeight: 600, marginTop: 16 }}>
            +200 personas ya descargaron estos prompts esta semana
          </p>
        </div>
      </section>

      <WorkshopFooter extra="Recurso gratuito · Sin spam" />
    </>
  );
}
