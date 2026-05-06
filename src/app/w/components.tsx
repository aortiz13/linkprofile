"use client";

import Image from "next/image";
import StripeCTA from "./StripeCTA";

/* ── Header ── */
export function WorkshopHeader({ pill }: { pill: string }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="/w/a1" className="brand">
          <Image src="/workshop/logo-brandboost-mark.png" alt="Brandboost AI" width={32} height={32} style={{ height: 28, width: "auto" }} />
          <span className="brand__text">BRANDBOOST.AI</span>
        </a>
        <span className="status-pill">
          <span className="status-pill__dot" />
          {pill}
        </span>
      </div>
    </header>
  );
}

/* ── Footer ── */
export function WorkshopFooter({ extra }: { extra?: string }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <div className="site-footer__brand">BRANDBOOST.AI</div>
            <p className="site-footer__tag">Enterprise AI Agency · Impulsando tu empresa con IA</p>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© 2026 Brandboost AI · Todos los derechos reservados</span>
          <span>{extra || "Workshop · 16 May 2026 · USD $17"}</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Country Phone Input ── */
const COUNTRIES = [
  { code: "+54", flag: "🇦🇷", label: "Argentina" },
  { code: "+591", flag: "🇧🇴", label: "Bolivia" },
  { code: "+55", flag: "🇧🇷", label: "Brasil" },
  { code: "+56", flag: "🇨🇱", label: "Chile" },
  { code: "+57", flag: "🇨🇴", label: "Colombia" },
  { code: "+506", flag: "🇨🇷", label: "Costa Rica" },
  { code: "+593", flag: "🇪🇨", label: "Ecuador" },
  { code: "+503", flag: "🇸🇻", label: "El Salvador" },
  { code: "+34", flag: "🇪🇸", label: "España" },
  { code: "+1", flag: "🇺🇸", label: "Estados Unidos" },
  { code: "+502", flag: "🇬🇹", label: "Guatemala" },
  { code: "+504", flag: "🇭🇳", label: "Honduras" },
  { code: "+52", flag: "🇲🇽", label: "México" },
  { code: "+505", flag: "🇳🇮", label: "Nicaragua" },
  { code: "+507", flag: "🇵🇦", label: "Panamá" },
  { code: "+595", flag: "🇵🇾", label: "Paraguay" },
  { code: "+51", flag: "🇵🇪", label: "Perú" },
  { code: "+1809", flag: "🇩🇴", label: "Rep. Dominicana" },
  { code: "+598", flag: "🇺🇾", label: "Uruguay" },
  { code: "+58", flag: "🇻🇪", label: "Venezuela" },
];

export function CountryPhoneInput() {
  return (
    <div className="phone-field">
      <div className="phone-field__country">
        <select aria-label="Prefijo de país" required defaultValue="+54">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>
      </div>
      <input type="tel" inputMode="numeric" pattern="[0-9\s]+" placeholder="Tu WhatsApp" required />
    </div>
  );
}

/* ── Lead Magnet Form ── */
export function LeadMagnetForm({ cta, note, redirectTo }: { cta: string; note: string; redirectTo: string }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = redirectTo;
  };

  return (
    <div className="magnet-card" id="form">
      <div className="ai-shell" style={{ marginBottom: 24 }}>
        <div className="ai-shell__inner">
          <form className="lead-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Tu nombre" required />
            <CountryPhoneInput />
            <button type="submit" className="btn btn--primary btn--lg">
              {cta}
              <span className="btn-arrow">→</span>
            </button>
            <p className="lead-form__note">{note}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Video Shell ── */
export function VideoShell({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "75% 0 0 0",
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        ...style,
      }}
    >
      <iframe
        src="https://player.vimeo.com/video/1189761638?badge=0&autopause=0&player_id=0&app_id=58479"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        title="Workshop · Domina Claude"
      />
    </div>
  );
}

/* ── Price Block ── */
export function PriceBlock({ eyebrow, title, note, ctaText, details }: {
  eyebrow: string; title: string; note: string; ctaText: string; details: string[];
}) {
  return (
    <div className="price-block">
      <span className="price-block__eyebrow">{eyebrow}</span>
      <h2 className="price-block__title">{title}</h2>
      <div className="price-tag">
        <span className="price-tag__old">$97 USD</span>
        <span className="price-tag__new"><span className="price-tag__currency">USD</span>17</span>
      </div>
      <p className="price-block__note">{note}</p>
      <StripeCTA className="btn btn--accent btn--lg">
        {ctaText}
        <span className="btn-arrow">→</span>
      </StripeCTA>
      <ul className="price-block__details">
        {details.map((d, i) => <li key={i}>{d}</li>)}
      </ul>
    </div>
  );
}

/* ── Countdown ── */
import { useState, useEffect } from "react";

export function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const t = new Date(target).getTime();
    const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
    const tick = () => {
      const diff = Math.max(0, t - Date.now());
      setTime({
        d: pad(Math.floor(diff / (1000 * 60 * 60 * 24))),
        h: pad(Math.floor((diff / (1000 * 60 * 60)) % 24)),
        m: pad(Math.floor((diff / (1000 * 60)) % 60)),
        s: pad(Math.floor((diff / 1000) % 60)),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="countdown" id="countdown">
      <div className="countdown__cell"><div className="countdown__num">{time.d}</div><div className="countdown__label">días</div></div>
      <div className="countdown__cell"><div className="countdown__num">{time.h}</div><div className="countdown__label">hs</div></div>
      <div className="countdown__cell"><div className="countdown__num">{time.m}</div><div className="countdown__label">min</div></div>
      <div className="countdown__cell"><div className="countdown__num">{time.s}</div><div className="countdown__label">seg</div></div>
    </div>
  );
}

/* ── Sticky CTA ── */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const bottomSeen = window.innerHeight + y > document.body.offsetHeight - 240;
      setVisible(y >= 320 && !bottomSeen);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className={`sticky-cta${visible ? "" : " sticky-cta--hidden"}`}>
      <div className="sticky-cta__price">
        <small>Workshop 16 May</small>
        <span>$17 USD · 100 cupos</span>
      </div>
      <StripeCTA className="sticky-cta__btn">Reservar →</StripeCTA>
    </div>
  );
}

/* ── FAQ ── */
export function FaqItem({ question, answer, open }: { question: string; answer: string; open?: boolean }) {
  return (
    <details className="faq-item" open={open}>
      <summary>{question}<span className="faq-item__chev">▾</span></summary>
      <div className="faq-item__body" dangerouslySetInnerHTML={{ __html: answer }} />
    </details>
  );
}
