"use client";

import Image from "next/image";
import { WorkshopHeader, WorkshopFooter, PriceBlock, Countdown, StickyCta, FaqItem } from "../components";

export default function A1Client() {
  return (
    <>
      <WorkshopHeader pill="Workshop · 16 May" />

      {/* HERO */}
      <section className="hero">
        <div className="container hero__inner">
          <span className="eyebrow-line">
            <span className="eyebrow-line__dot" />
            Sábado 16 May · 100% EN VIVO · USD $17
          </span>
          <h1>Tenes Claude y solo usás <em>el 1%</em> de su potencial.</h1>
          <p className="hero__sub">
            Sesión <strong>100% en vivo</strong> donde vas a pasar de prompts básicos a sistemas automatizados que trabajan por vos mientras dormís.
          </p>
          <p className="hero__support">
            El 95% de los usuarios de Claude lo usan como un buscador caro. Escriben un prompt, copian la respuesta, y repiten. Eso no es usar IA — <strong>eso es googlear con más pasos.</strong>
          </p>
          <p className="hero__support" style={{ marginBottom: 40 }}>
            Este workshop te muestra <strong>el otro 99%</strong>.
          </p>
          <div className="cta-block">
            <a href="https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38" className="btn btn--primary btn--lg">
              Quiero mi lugar — $17 USD
              <span className="btn-arrow">→</span>
            </a>
            <span className="cta-meta">
              <span>100 cupos limitados</span>
              <span className="cta-meta__dot" />
              <span>Acceso inmediato a WhatsApp</span>
            </span>
          </div>
        </div>
      </section>

      {/* BAND */}
      <div className="band" aria-hidden="true">
        <div className="band__track">
          <span>Configuración Pro</span><span>Automatización en vivo</span><span>Tu primer agente</span><span>Caso real + Q&A</span><span>Grabación incluida</span>
          <span>Configuración Pro</span><span>Automatización en vivo</span><span>Tu primer agente</span><span>Caso real + Q&A</span><span>Grabación incluida</span>
        </div>
      </div>

      {/* DOLOR */}
      <section className="section section--gray" id="dolor">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">El problema</span>
            <h2 className="section__title">¿Te suena familiar?</h2>
            <p className="section__sub">Estos son los mensajes que recibimos todos los días. Si te identificás con alguno, este workshop es para vos.</p>
          </div>
          <ul className="pain-list">
            {[
              "Tenés Claude Pro pero sentís que solo aprovechás el 1%.",
              "Te quedás sin tokens antes de fin de mes y no sabés por qué.",
              "Pasás horas haciendo reportes, contenido o tareas que podrías automatizar.",
              "No sabés la diferencia entre Projects, Custom Instructions, Claude Code o Artifacts.",
              "Probaste ChatGPT, Gemini, Perplexity… y seguís sin un sistema que funcione.",
              "Querés automatizar tu negocio pero no sabés por dónde empezar.",
            ].map((t, i) => (
              <li key={i} className="pain-item">
                <span className="pain-item__icon">{String(i + 1).padStart(2, "0")}</span>
                <span className="pain-item__text">{t}</span>
              </li>
            ))}
          </ul>
          <p className="pain-close">No es tu culpa. Nadie te enseñó a usar Claude como profesional. <strong>Hasta ahora.</strong></p>
        </div>
      </section>

      {/* AUTOR */}
      <section className="section">
        <div className="container">
          <div className="author-block">
            <div className="author-block__photo author-block__photo--img">
              <Image src="https://res.cloudinary.com/dhzmkxbek/image/upload/v1764023274/Disen%CC%83o_sin_ti%CC%81tulo_7_guvgsu.png" alt="Tu instructor" width={120} height={120} />
            </div>
            <div>
              <span className="author-block__name">Tu instructor</span>
              <h2 className="author-block__title">Quién soy y por qué debería importarte</h2>
              <p className="author-block__body">
                Soy un <strong>nerd de la IA</strong> con experiencia como dueño y frente de Operaciones de varias empresas — desde antes de que &quot;IA&quot; fuera una casilla en todo pitch deck. En esos roles entendí algo que hoy se repite: el mayor problema de las personas no es la falta de herramientas, es <strong>no saber cómo obtener el mismo (o mejor) resultado en menos tiempo.</strong>
              </p>
              <p className="author-block__body">
                Hace más de un año me obsesioné con la Inteligencia Artificial y paso <strong>12 horas al día</strong> dedicado a eso. Trabajo con empresas y profesionales implementando IA en su día a día — no desde la teoría, sino desde la práctica.
              </p>
              <p className="author-block__body">
                Estas sesiones nacen de ver el mismo problema una y otra vez: personas usando IA, pero sin aprovecharla. Por eso el enfoque es simple.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="section section--dark" id="resultados">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Resultados</span>
            <h2 className="section__title">Después de esta sesión en vivo vas a poder:</h2>
          </div>
          <ul className="outcome-list">
            {[
              "Configurar Claude como un asistente profesional personalizado, no genérico.",
              "Crear prompts que generan resultados al primer intento, sin 10 iteraciones.",
              "Automatizar tareas repetitivas: reportes, contenido, emails, análisis.",
              "Construir tu primer sistema o agente que trabaja sin tu supervisión.",
              "Optimizar tu consumo de tokens para que Pro te rinda el triple.",
              "Saber exactamente qué herramienta usar para cada tarea (Projects, Artifacts, Code).",
            ].map((t, i) => (
              <li key={i} className="outcome-item">
                <span className="outcome-item__check">✓</span>
                <span className="outcome-item__text">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TEMARIO */}
      <section className="section section--gray" id="temario">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Temario</span>
            <h2 className="section__title">Qué vamos a cubrir en vivo</h2>
            <p className="section__sub">4 módulos prácticos. 100% en vivo. Cero teoría innecesaria. Salís con algo funcionando.</p>
          </div>
          <div className="module-list">
            {[
              { num: "M01", title: "Configuración Profesional de Claude", desc: "Cómo configurar Projects, Custom Instructions y tu entorno para que Claude te entienda desde el primer mensaje. Vas a dejar de repetirle contexto cada vez." },
              { num: "M02", title: "Automatización de Tareas Reales", desc: null, list: ["Si sos emprendedor: automatizar captación de clientes y contenido.", "Si sos empleado: automatizar reportes y análisis.", "Si sos estudiante: automatizar investigación y proyectos."] },
              { num: "M03", title: "De Prompt a Sistema", desc: "Vas a construir en vivo tu primer flujo automatizado. No teoría — vas a salir del workshop con algo funcionando." },
              { num: "M04", title: "Caso Real + Q&A", desc: "Demostración en tiempo real resolviendo problemas de los asistentes. Traé tu caso y lo resolvemos juntos." },
            ].map((m) => (
              <article key={m.num} className="module-card">
                <div className="module-card__head">
                  <span className="module-card__num">{m.num}</span>
                  <span className="module-card__time">EN VIVO</span>
                </div>
                <h3 className="module-card__title">{m.title}</h3>
                {m.desc && <p className="module-card__desc">{m.desc}</p>}
                {m.list && <ul className="module-card__list">{m.list.map((l, i) => <li key={i}>{l}</li>)}</ul>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AVATARES */}
      <section className="section" id="paraquien">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Para quién es</span>
            <h2 className="section__title">3 perfiles, un mismo workshop</h2>
            <p className="section__sub">Cada módulo se adapta a tu contexto. Estos son los 3 perfiles que ya están dentro:</p>
          </div>
          <div className="avatars">
            {[
              { icon: "E", role: "Avatar 01", title: "El Emprendedor Solopreneur", desc: "Querés facturar más y automatizar tu negocio, pero estás solo y no sabés por dónde empezar con IA." },
              { icon: "O", role: "Avatar 02", title: "El Empleado Optimizador", desc: "Usás Claude para reportes del trabajo, pero querés automatizar todo y ganar 10 horas a la semana." },
              { icon: "M", role: "Avatar 03", title: "El Estudiante Maker", desc: "Estás usando Claude para tu proyecto de la universidad y querés terminarlo 10x más rápido." },
            ].map((a) => (
              <article key={a.icon} className="avatar-card">
                <div className="avatar-card__icon">{a.icon}</div>
                <span className="avatar-card__role">{a.role}</span>
                <h3 className="avatar-card__title">{a.title}</h3>
                <p className="avatar-card__desc">{a.desc}</p>
              </article>
            ))}
          </div>
          <div className="forwhom-grid" style={{ marginTop: 48 }}>
            <div className="forwhom-col forwhom-col--yes">
              <div className="forwhom-col__head"><span className="forwhom-col__head-icon">✓</span> Es para vos si</div>
              <ul className="forwhom-list">
                <li>Usás Claude o ChatGPT y sentís que podrías sacarle más.</li>
                <li>Sos emprendedor, freelancer o empleado que quiere automatizar.</li>
                <li>Estás dispuesto a sumarte a una sesión en vivo para cambiar cómo trabajás.</li>
                <li>Querés resultados concretos, no teoría.</li>
              </ul>
            </div>
            <div className="forwhom-col forwhom-col--no">
              <div className="forwhom-col__head"><span className="forwhom-col__head-icon">×</span> NO es para vos si</div>
              <ul className="forwhom-list">
                <li>Ya dominás Claude Code, APIs y agentes avanzados.</li>
                <li>Buscás un curso de 40 horas con certificado.</li>
                <li>No tenés cuenta de Claude (ni vas a crearla).</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="section section--gray">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Voces reales</span>
            <h2 className="section__title">Lo que escuchamos todos los días</h2>
            <p className="section__sub">Mensajes textuales de leads en LATAM. El workshop es la respuesta a estas frases.</p>
          </div>
          <div className="testimonial-grid">
            {[
              { quote: '"Siento que solo lo estoy aprovechando un 1%."', initials: "JF", name: "Javier F.", meta: "Emprendedor · Argentina" },
              { quote: '"Quiero automatizar todo pero no sé por dónde empezar."', initials: "GP", name: "Gabriel P.", meta: "Solopreneur · Argentina" },
              { quote: '"Ojalá poder automatizar lo máximo mis reportes."', initials: "PN", name: "Pamela N.", meta: "Control de Gestión · Chile" },
            ].map((t) => (
              <article key={t.initials} className="testimonial">
                <p className="testimonial__quote">{t.quote}</p>
                <div className="testimonial__author">
                  <span className="testimonial__avatar">{t.initials}</span>
                  <div>
                    <div className="testimonial__name">{t.name}</div>
                    <div className="testimonial__meta">{t.meta}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIO */}
      <section className="section" id="reservar">
        <div className="container">
          <PriceBlock
            eyebrow="Precio de lanzamiento"
            title="Una sesión en vivo que va a cambiar cómo trabajás con IA. Para siempre."
            note="$17 es menos de lo que pagás por un mes de Claude Pro. La diferencia es que después de este workshop, ese plan te va a rendir 10 veces más."
            ctaHref="https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38"
            ctaText="Reservar mi lugar — $17 USD"
            details={["Sábado 16 de mayo, 2026 · 10am ARG", "100% EN VIVO · grabación incluida", "Grupo de WhatsApp exclusivo", "Acceso inmediato post-pago"]}
          />
        </div>
      </section>

      {/* URGENCIA */}
      <section className="section section--dark" id="urgencia">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section__head" style={{ margin: "0 auto 32px" }}>
            <span className="section__eyebrow">Cuenta regresiva</span>
            <h2 className="section__title">Empieza el sábado 16 de mayo</h2>
          </div>
          <Countdown target="2026-05-16T15:00:00-03:00" />
          <div className="urgency-bar">
            <div className="urgency-bar__count"><strong>67</strong> de 100 lugares ocupados</div>
            <div className="urgency-bar__progress"><div className="urgency-bar__progress-fill" style={{ width: "67%" }} /></div>
          </div>
          <div style={{ marginTop: 40 }}>
            <a href="https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38" className="btn btn--accent btn--lg">
              Quiero mi lugar — $17 USD
              <span className="btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* HORARIOS */}
      <section className="section section--gray" id="horarios">
        <div className="container">
          <div className="section__head" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <span className="section__eyebrow">Horarios por país</span>
            <h2 className="section__title">El sábado 16 de mayo, en tu zona horaria</h2>
            <p className="section__sub">Workshop EN VIVO. Conectate desde donde estés.</p>
          </div>
          <ul className="tz-grid">
            {[
              { flag: "🇦🇷", country: "Argentina", time: "10:00 hs", featured: true },
              { flag: "🇺🇾", country: "Uruguay · Paraguay", time: "10:00 hs" },
              { flag: "🇨🇱", country: "Chile", time: "09:00 hs" },
              { flag: "🇧🇷", country: "Brasil (BRT)", time: "10:00 hs" },
              { flag: "🇨🇴", country: "Colombia · Perú · Ecuador", time: "08:00 hs" },
              { flag: "🇲🇽", country: "México (CDMX)", time: "07:00 hs" },
              { flag: "🇺🇸", country: "USA (ET / Miami · NY)", time: "09:00 hs" },
              { flag: "🇪🇸", country: "España", time: "15:00 hs" },
            ].map((tz) => (
              <li key={tz.country} className={`tz-item${tz.featured ? " tz-item--featured" : ""}`}>
                <span className="tz-item__flag">{tz.flag}</span>
                <div>
                  <div className="tz-item__country">{tz.country}</div>
                  <div className="tz-item__time">{tz.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section__head" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <span className="section__eyebrow">Preguntas frecuentes</span>
            <h2 className="section__title">Lo que querés saber antes de reservar</h2>
          </div>
          <div className="faq-list">
            <FaqItem question="¿Se graba el workshop?" answer="Sí. Todos los asistentes reciben la grabación dentro de las 24 horas posteriores al workshop." open />
            <FaqItem question="¿Qué necesito para participar?" answer="Una cuenta de Claude (gratuita o Pro) y una computadora. No necesitás saber programar." />
            <FaqItem question="¿Qué política de reembolso tienen?" answer='Por la naturaleza del producto (acceso inmediato al grupo, materiales y sesión en vivo) <strong>no se ofrecen reembolsos</strong>. Si tenés dudas antes de comprar, escribinos y las resolvemos.' />
            <FaqItem question="¿Sirve si uso ChatGPT y no Claude?" answer="Sí. Los principios aplican a cualquier IA, pero vamos a trabajar principalmente con Claude porque es la herramienta más potente del mercado hoy." />
            <FaqItem question="¿Cómo accedo después de pagar?" answer="Inmediatamente después del pago recibís el link al grupo de WhatsApp y el acceso al workshop por email." />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section section--gray">
        <div className="container" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <h2 className="section__title" style={{ marginBottom: 24 }}>Decidí en menos de 1 minuto.</h2>
          <p className="section__sub" style={{ marginBottom: 32 }}>El sábado 16 de mayo, a esta misma hora, vas a estar usando Claude como un profesional o vas a seguir tirando tokens. Vos elegís.</p>
          <a href="https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38" className="btn btn--primary btn--lg">
            Quiero mi lugar — $17 USD
            <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      <WorkshopFooter />
      <StickyCta />
    </>
  );
}
