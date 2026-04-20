"use client";

import { useEffect, useRef } from "react";

const STRIPE_LINKS = {
  intensiva: "https://buy.stripe.com/dRm5kC25gdtg0AIefn1Fe33",
  profesional: "https://buy.stripe.com/7sY7sKeS2exk4QYefn1Fe31",
  mensual: "https://buy.stripe.com/9B6eVcdNY0Gudnu9Z71Fe30",
};

const AVATAR_URL =
  "https://res.cloudinary.com/dhzmkxbek/image/upload/v1764023274/Disen%CC%83o_sin_ti%CC%81tulo_7_guvgsu.png";

export default function AsesoriaPersonalizada() {
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* ── Reset for this page ──────────────────── */
        .asesoria-page *,
        .asesoria-page *::before,
        .asesoria-page *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .asesoria-page {
          --white: #ffffff;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gray-900: #111827;
          --gray-950: #030712;
          --cyan-50: #ecfeff;
          --cyan-100: #cffafe;
          --cyan-400: #22d3ee;
          --cyan-500: #06b6d4;
          --cyan-600: #0891b2;
          --cyan-700: #0e7490;
          --cyan-900: #164e63;
          --black: #000000;
          --radius: 12px;
          --radius-sm: 8px;
          --radius-xs: 6px;

          font-family: "Inter", system-ui, -apple-system, sans-serif;
          background: var(--white);
          color: var(--gray-900);
          line-height: 1.6;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── Container ───────────────────────── */
        .asesoria-page .ap-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .asesoria-page .ap-container-narrow {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 24px;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-container,
          .asesoria-page .ap-container-narrow {
            padding: 0 20px;
          }
        }

        /* ── Section ──────────────────────── */
        .asesoria-page .ap-section {
          padding: 96px 0;
          position: relative;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-section {
            padding: 64px 0;
          }
        }

        /* ── Divider ──────────────────────── */
        .asesoria-page .ap-divider {
          width: 100%;
          height: 1px;
          background: var(--gray-200);
        }

        /* ── Typography ───────────────────── */
        .asesoria-page .ap-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--cyan-600);
          margin-bottom: 12px;
          display: block;
        }
        .asesoria-page h1 {
          font-size: clamp(2.4rem, 5.5vw, 4rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--gray-900);
        }
        .asesoria-page h2 {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.12;
          color: var(--gray-900);
        }
        .asesoria-page .text-accent {
          color: var(--cyan-600);
        }

        /* ── Buttons ──────────────────────── */
        .asesoria-page .ap-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 32px;
          border-radius: var(--radius-sm);
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          min-height: 48px;
        }
        .asesoria-page .ap-btn-primary {
          background: var(--black);
          color: var(--white);
        }
        .asesoria-page .ap-btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }
        .asesoria-page .ap-btn-secondary {
          background: var(--white);
          color: var(--gray-900);
          border: 1px solid var(--gray-200);
        }
        .asesoria-page .ap-btn-secondary:hover {
          border-color: var(--gray-400);
          background: var(--gray-50);
        }
        .asesoria-page .ap-btn-accent {
          background: var(--cyan-600);
          color: var(--white);
        }
        .asesoria-page .ap-btn-accent:hover {
          background: var(--cyan-700);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(6, 182, 212, 0.2);
        }
        .asesoria-page .ap-btn-white {
          background: var(--white);
          color: var(--gray-900);
          font-weight: 700;
        }
        .asesoria-page .ap-btn-white:hover {
          background: var(--gray-100);
        }
        .asesoria-page .ap-btn-outline-white {
          background: transparent;
          color: var(--white);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .asesoria-page .ap-btn-outline-white:hover {
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }
        .asesoria-page .ap-btn-sm {
          padding: 12px 24px;
          font-size: 14px;
        }

        @media (hover: none) {
          .asesoria-page .ap-btn-primary:active {
            transform: scale(0.97);
          }
          .asesoria-page .ap-btn-accent:active {
            transform: scale(0.97);
          }
        }

        /* ── Card ──────────────────────────── */
        .asesoria-page .ap-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          transition: all 0.25s ease;
        }
        .asesoria-page .ap-card:hover {
          border-color: var(--gray-300);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        @media (hover: none) {
          .asesoria-page .ap-card:hover {
            transform: none;
            box-shadow: none;
          }
        }

        /* ══ HERO ══ */
        .asesoria-page .ap-hero {
          min-height: 100vh;
          padding: 120px 0 80px;
          display: flex;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          background: var(--white);
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-hero {
            padding: 100px 0 60px;
            min-height: auto;
          }
        }
        .asesoria-page .ap-hero::before {
          content: "";
          position: absolute;
          top: -30%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 900px;
          background: radial-gradient(
            circle,
            rgba(6, 182, 212, 0.06) 0%,
            transparent 60%
          );
          pointer-events: none;
        }
        .asesoria-page .ap-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: var(--cyan-50);
          border: 1px solid var(--cyan-100);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--cyan-700);
          margin-bottom: 32px;
        }
        .asesoria-page .ap-hero h1 {
          margin-bottom: 24px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }
        .asesoria-page .ap-hero-sub {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--gray-500);
          max-width: 520px;
          margin: 0 auto 36px;
          line-height: 1.7;
          font-weight: 400;
        }
        .asesoria-page .ap-hero-bullets {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 440px;
          margin: 0 auto 44px;
          text-align: left;
          list-style: none;
        }
        .asesoria-page .ap-hero-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 15px;
          color: var(--gray-600);
        }
        .asesoria-page .ap-hero-bullets li::before {
          content: "✦";
          color: var(--cyan-500);
          font-size: 11px;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .asesoria-page .ap-hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .asesoria-page .ap-hero-ctas {
            flex-direction: column;
            align-items: stretch;
            padding: 0 16px;
            gap: 12px;
          }
          .asesoria-page .ap-hero-bullets li {
            font-size: 14px;
          }
        }
        .asesoria-page .ap-social-proof {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          font-size: 13px;
          color: var(--gray-400);
        }
        .asesoria-page .ap-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: ap-pulse 2s infinite;
        }
        @keyframes ap-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        /* ══ PROBLEM ══ */
        .asesoria-page .ap-problem {
          background: var(--gray-50);
        }
        .asesoria-page .ap-problem-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-problem-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .asesoria-page .ap-problem-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .asesoria-page .ap-problem-list li {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 15px;
          color: var(--gray-600);
          line-height: 1.5;
        }
        .asesoria-page .ap-problem-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fef2f2;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
          margin-top: 2px;
          color: #ef4444;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-problem-list li {
            font-size: 14px;
          }
        }

        /* ══ PROMISE ══ */
        .asesoria-page .ap-promise-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 28px;
        }
        .asesoria-page .ap-promise-list li {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 15px;
          color: var(--gray-600);
          padding: 14px 18px;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .asesoria-page .ap-promise-list li:hover {
          border-color: var(--cyan-500);
          box-shadow: 0 2px 12px rgba(6, 182, 212, 0.08);
        }
        .asesoria-page .ap-check {
          color: var(--cyan-600);
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-promise-list li {
            font-size: 14px;
            padding: 12px 16px;
          }
        }

        /* ══ INCLUDES ══ */
        .asesoria-page .ap-includes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 36px;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-includes-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        .asesoria-page .ap-include-card {
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-include-card {
            padding: 20px 18px;
          }
        }
        .asesoria-page .ap-include-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--cyan-50);
          border: 1px solid var(--cyan-100);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .asesoria-page .ap-include-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 4px;
        }
        .asesoria-page .ap-include-desc {
          font-size: 13px;
          color: var(--gray-500);
          line-height: 1.5;
        }

        /* ══ PRICING ══ */
        .asesoria-page .ap-pricing {
          background: var(--gray-50);
        }
        .asesoria-page .ap-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 48px;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .asesoria-page .ap-pricing-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
            gap: 24px;
          }
          .asesoria-page .ap-plan-featured {
            order: -1;
          }
        }
        .asesoria-page .ap-plan {
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: var(--white);
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-plan {
            padding: 28px 22px;
          }
        }
        .asesoria-page .ap-plan-featured {
          border-color: var(--cyan-500);
          box-shadow: 0 8px 40px rgba(6, 182, 212, 0.1);
        }
        .asesoria-page .ap-plan-featured::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--cyan-500), var(--cyan-400));
        }
        .asesoria-page .ap-plan-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          background: var(--cyan-600);
          color: var(--white);
        }
        .asesoria-page .ap-plan-name {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cyan-600);
          margin-bottom: 8px;
        }
        .asesoria-page .ap-plan-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .asesoria-page .ap-plan-subtitle {
          font-size: 14px;
          color: var(--gray-500);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .asesoria-page .ap-plan-price {
          margin-bottom: 4px;
        }
        .asesoria-page .ap-plan-amount {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--gray-900);
        }
        .asesoria-page .ap-plan-currency {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-400);
          margin-right: 4px;
        }
        .asesoria-page .ap-plan-period {
          font-size: 14px;
          color: var(--gray-400);
          font-weight: 500;
        }
        .asesoria-page .ap-plan-note {
          font-size: 13px;
          color: var(--gray-500);
          margin-bottom: 4px;
        }
        .asesoria-page .ap-plan-anchor {
          font-size: 13px;
          color: var(--cyan-600);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .asesoria-page .ap-plan-reinforcement {
          font-size: 12px;
          color: var(--gray-400);
          font-style: italic;
          margin-bottom: 20px;
        }
        .asesoria-page .ap-plan-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 20px 0;
        }
        .asesoria-page .ap-plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
          flex: 1;
        }
        .asesoria-page .ap-plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13.5px;
          color: var(--gray-600);
          line-height: 1.45;
        }
        .asesoria-page .ap-plan-result {
          background: var(--cyan-50);
          border: 1px solid var(--cyan-100);
          border-radius: var(--radius-xs);
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--cyan-700);
          line-height: 1.5;
        }
        .asesoria-page .ap-plan-result strong {
          color: var(--cyan-600);
          font-weight: 700;
        }
        .asesoria-page .ap-plan-ideal {
          font-size: 12px;
          color: var(--gray-400);
          text-align: center;
          margin-top: 12px;
          font-style: italic;
        }
        .asesoria-page .ap-plan-cta {
          width: 100%;
          margin-top: auto;
        }

        /* ══ DIFF ══ */
        .asesoria-page .ap-diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 36px;
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-diff-grid {
            grid-template-columns: 1fr;
          }
        }
        .asesoria-page .ap-diff-card {
          padding: 32px 24px;
          text-align: center;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-diff-card {
            padding: 24px 20px;
          }
        }
        .asesoria-page .ap-diff-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .asesoria-page .ap-diff-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 8px;
        }
        .asesoria-page .ap-diff-desc {
          font-size: 13px;
          color: var(--gray-500);
          line-height: 1.6;
        }

        /* ══ RESULTS ══ */
        .asesoria-page .ap-results-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 36px;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-results-grid {
            grid-template-columns: 1fr;
          }
        }
        .asesoria-page .ap-result-card {
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .asesoria-page .ap-result-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .asesoria-page .ap-result-text {
          font-size: 14px;
          color: var(--gray-500);
          line-height: 1.5;
        }
        .asesoria-page .ap-result-text strong {
          color: var(--gray-900);
          font-weight: 600;
        }

        /* ══ ABOUT ══ */
        .asesoria-page .ap-about {
          background: var(--gray-50);
        }
        .asesoria-page .ap-about-grid {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-about-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 32px;
          }
        }
        .asesoria-page .ap-about-photo img {
          width: 200px;
          height: 200px;
          border-radius: var(--radius);
          object-fit: cover;
          border: 3px solid var(--white);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-about-photo {
            margin: 0 auto;
          }
          .asesoria-page .ap-about-photo img {
            width: 160px;
            height: 160px;
          }
        }
        .asesoria-page .ap-about-text {
          font-size: 15px;
          color: var(--gray-500);
          line-height: 1.7;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-about-text {
            font-size: 14px;
            text-align: left;
          }
        }
        .asesoria-page .ap-about-text strong {
          color: var(--gray-900);
          font-weight: 600;
        }
        .asesoria-page .ap-about-bullets {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-about-bullets {
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .asesoria-page .ap-about-bullets {
            flex-direction: column;
            align-items: stretch;
          }
          .asesoria-page .ap-about-bullets li {
            justify-content: center;
          }
        }
        .asesoria-page .ap-about-bullets li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700);
        }

        /* ══ FAQ ══ */
        .asesoria-page .ap-faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 36px;
        }
        .asesoria-page .ap-faq-item {
          padding: 24px;
        }
        .asesoria-page .ap-faq-q {
          font-size: 15px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .asesoria-page .ap-faq-q::before {
          content: "?";
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--cyan-50);
          border: 1px solid var(--cyan-100);
          color: var(--cyan-600);
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .asesoria-page .ap-faq-a {
          font-size: 14px;
          color: var(--gray-500);
          line-height: 1.6;
          padding-left: 36px;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-faq-item {
            padding: 20px 18px;
          }
          .asesoria-page .ap-faq-q {
            font-size: 14px;
          }
          .asesoria-page .ap-faq-a {
            font-size: 13px;
            padding-left: 34px;
          }
        }

        /* ══ WHATSAPP ══ */
        .asesoria-page .ap-whatsapp {
          background: var(--white);
        }
        .asesoria-page .ap-whatsapp-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius);
          padding: 48px 40px;
          text-align: center;
          max-width: 560px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-whatsapp-box {
            padding: 36px 24px;
          }
        }
        .asesoria-page .ap-whatsapp-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
        }
        .asesoria-page .ap-whatsapp-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .asesoria-page .ap-whatsapp-desc {
          font-size: 15px;
          color: var(--gray-500);
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .asesoria-page .ap-btn-whatsapp {
          background: #22c55e;
          color: var(--white);
        }
        .asesoria-page .ap-btn-whatsapp:hover {
          background: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25);
        }

        /* ══ CTA FINAL ══ */
        .asesoria-page .ap-cta-final {
          text-align: center;
          padding: 100px 0;
          overflow: hidden;
          background: var(--gray-950);
          color: var(--white);
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-cta-final {
            padding: 64px 0;
          }
        }
        .asesoria-page .ap-cta-final h2 {
          color: var(--white);
          margin-bottom: 12px;
        }
        .asesoria-page .ap-cta-final .ap-cta-sub {
          font-size: 16px;
          color: var(--gray-400);
          margin-bottom: 40px;
        }
        .asesoria-page .ap-cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .asesoria-page .ap-cta-buttons {
            flex-direction: column;
            align-items: stretch;
            padding: 0 16px;
            gap: 12px;
          }
        }

        /* ══ POST PURCHASE ══ */
        .asesoria-page .ap-steps-row {
          display: flex;
          gap: 20px;
          margin-top: 36px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .asesoria-page .ap-step {
          flex: 1;
          min-width: 200px;
          max-width: 280px;
          text-align: center;
          padding: 28px 20px;
        }
        .asesoria-page .ap-step-number {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gray-900);
          color: var(--white);
          font-size: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .asesoria-page .ap-step-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 6px;
        }
        .asesoria-page .ap-step-desc {
          font-size: 13px;
          color: var(--gray-500);
          line-height: 1.5;
        }
        @media (max-width: 640px) {
          .asesoria-page .ap-step {
            min-width: 100%;
          }
          .asesoria-page .ap-steps-row {
            flex-direction: column;
            gap: 12px;
          }
        }

        /* ══ Footer ══ */
        .asesoria-page .ap-footer {
          padding: 32px 0;
          text-align: center;
          font-size: 13px;
          color: var(--gray-400);
          border-top: 1px solid var(--gray-200);
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-footer {
            padding-bottom: 90px;
          }
        }

        /* ══ Reveal ══ */
        .asesoria-page .ap-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .asesoria-page .ap-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ══ Sticky CTA mobile ══ */
        .asesoria-page .ap-sticky-cta {
          display: none;
        }
        @media (max-width: 768px) {
          .asesoria-page .ap-sticky-cta {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 14px 20px;
            padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid var(--gray-200);
            z-index: 100;
            gap: 10px;
            justify-content: center;
            box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
          }
          .asesoria-page .ap-sticky-cta .ap-btn {
            flex: 1;
            padding: 14px 16px;
            font-size: 14px;
            min-height: 50px;
          }
        }
      `}</style>

      <div className="asesoria-page">
        {/* ════ HERO ════ */}
        <section className="ap-hero" id="hero">
          <div className="ap-container">
            <div className="ap-hero-badge">⚡ Sesiones personalizadas 1 a 1</div>
            <h1>
              Aprende a usar
              <br />
              <span className="text-accent">Inteligencia Artificial</span>
              <br />
              <span style={{ fontWeight: 400, fontSize: "0.55em", color: "var(--gray-400)", letterSpacing: "-0.01em" }}>
                como un profesional (no como un principiante)
              </span>
            </h1>
            <p className="ap-hero-sub">
              Sesiones 1 a 1 donde aplicas IA directamente en tu trabajo, negocio o día a día.
            </p>
            <ul className="ap-hero-bullets">
              <li>Domina las últimas herramientas de IA de una forma avanzada</li>
              <li>Aumenta tu productividad y calidad de respuesta</li>
              <li>Aplica IA a tu contexto real desde la primera sesión</li>
            </ul>
            <div className="ap-hero-ctas">
              <a href="#planes" className="ap-btn ap-btn-primary">Empezar ahora →</a>
              <a href="#planes" className="ap-btn ap-btn-secondary">Ver planes</a>
            </div>
            <div className="ap-social-proof">
              <span className="ap-dot" />
              <span>Profesionales y empresas ya entrenan con IA</span>
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ PROBLEMA ════ */}
        <section className="ap-section ap-problem ap-reveal" ref={addRevealRef} id="problema">
          <div className="ap-container">
            <div className="ap-problem-grid">
              <div>
                <span className="ap-label">🚨 EL PROBLEMA</span>
                <h2>Usar IA &quot;por encima&quot; <span className="text-accent">no te da ventaja</span></h2>
                <p style={{ color: "var(--gray-500)", marginTop: 16, fontSize: 15, lineHeight: 1.7 }}>
                  Hoy casi todos usan IA… pero pocos saben usarla bien.
                </p>
              </div>
              <ul className="ap-problem-list">
                <li><span className="ap-problem-icon">✕</span> Escribes prompts básicos y los resultados son mediocres</li>
                <li><span className="ap-problem-icon">✕</span> Pierdes tiempo probando herramientas sin saber cómo integrarlas</li>
                <li><span className="ap-problem-icon">✕</span> No sabes cómo aplicar IA a tu trabajo real</li>
                <li><span className="ap-problem-icon">✕</span> Sientes que podrías hacer mucho más, pero no sabes cómo</li>
                <li><span className="ap-problem-icon">✕</span> Crees que ChatGPT es el santo grial <span style={{ color: "var(--cyan-600)", fontSize: 13, fontWeight: 600 }}>(Spoiler: no lo es)</span></li>
              </ul>
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ PROMESA ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef}>
          <div className="ap-container-narrow">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">⚡ LA PROMESA</span>
              <h2>En pocas sesiones, cambias cómo <span className="text-accent">piensas y trabajas</span> con IA</h2>
              <p style={{ color: "var(--gray-500)", marginTop: 14, fontSize: 15 }}>
                Esto no es teoría. Es entrenamiento aplicado. Vas a aprender a:
              </p>
            </div>
            <ul className="ap-promise-list">
              <li><span className="ap-check">✓</span> Pensar en prompts como un profesional</li>
              <li><span className="ap-check">✓</span> Estructurar tareas complejas con IA</li>
              <li><span className="ap-check">✓</span> Usar IA para escribir, analizar, vender o crear</li>
              <li><span className="ap-check">✓</span> Obtener resultados consistentes (no respuestas aleatorias)</li>
            </ul>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ QUÉ INCLUYE ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef} id="sesiones" style={{ background: "var(--gray-50)" }}>
          <div className="ap-container">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">🧠 QUÉ INCLUYE</span>
              <h2>Qué trabajamos en las <span className="text-accent">sesiones</span></h2>
            </div>
            <div className="ap-includes-grid">
              {[
                { icon: "🎯", title: "Ingeniería de prompts", desc: "Nivel práctico, no académico. Aprende a construir prompts que generan resultados profesionales." },
                { icon: "🛠️", title: "Herramientas avanzadas", desc: "Uso avanzado de herramientas de IA específicas para tu caso y tu industria." },
                { icon: "💼", title: "Aplicación directa", desc: "Todo se aplica directamente a tu negocio o trabajo. Sin teoría sin contexto." },
                { icon: "⚡", title: "Sistemas mentales", desc: "Frameworks para trabajar más rápido y tomar mejores decisiones con IA." },
                { icon: "📋", title: "Casos reales", desc: "Casos reales adaptados a tu contexto. Nada genérico, todo personalizado." },
                { icon: "🎥", title: "Grabaciones", desc: "Cada sesión queda grabada para que puedas repetir y mejorar a tu ritmo." },
              ].map((item, i) => (
                <div key={i} className="ap-include-card ap-card">
                  <div className="ap-include-icon">{item.icon}</div>
                  <div>
                    <div className="ap-include-title">{item.title}</div>
                    <div className="ap-include-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ PLANES ════ */}
        <section className="ap-section ap-pricing ap-reveal" ref={addRevealRef} id="planes">
          <div className="ap-container">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">💰 PLANES</span>
              <h2>Elegí el plan que mejor se adapte <span className="text-accent">a tu momento</span></h2>
            </div>

            <div className="ap-pricing-grid">
              {/* PLAN 1 */}
              <div className="ap-plan ap-card">
                <div className="ap-plan-name">Plan 1</div>
                <div className="ap-plan-title">Sesión Intensiva</div>
                <div className="ap-plan-subtitle">Entiende cómo usar IA correctamente en 2 horas</div>
                <div className="ap-plan-price">
                  <span className="ap-plan-currency">USD</span>
                  <span className="ap-plan-amount">147</span>
                </div>
                <div className="ap-plan-note">Pago único</div>
                <div className="ap-plan-divider" />
                <ul className="ap-plan-features">
                  <li><span className="ap-check">✓</span> 1 sesión 1 a 1 (2 horas)</li>
                  <li><span className="ap-check">✓</span> Diagnóstico de cómo estás usando IA hoy</li>
                  <li><span className="ap-check">✓</span> Corrección de errores clave</li>
                  <li><span className="ap-check">✓</span> Framework claro para usar IA mejor</li>
                </ul>
                <div className="ap-plan-result"><strong>Resultado:</strong> Pasas de usar IA &quot;a ojo&quot; a usarla con intención.</div>
                <a href={STRIPE_LINKS.intensiva} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-secondary ap-btn-sm ap-plan-cta">Empezar ahora →</a>
                <p className="ap-plan-ideal">Ideal para entender exactamente cómo usar IA en tu caso</p>
              </div>

              {/* PLAN 2 FEATURED */}
              <div className="ap-plan ap-card ap-plan-featured">
                <div className="ap-plan-badge">⭐ Más elegido</div>
                <div className="ap-plan-name">Plan 2</div>
                <div className="ap-plan-title">Pack Profesional</div>
                <div className="ap-plan-subtitle">Domina la IA en tu día a día</div>
                <div className="ap-plan-price">
                  <span className="ap-plan-currency">USD</span>
                  <span className="ap-plan-amount">400</span>
                </div>
                <div className="ap-plan-note">Pago único</div>
                <div className="ap-plan-anchor">Equivalente a USD 50 por sesión</div>
                <div className="ap-plan-reinforcement">(Menos de lo que cuesta una hora de consultoría tradicional)</div>
                <div className="ap-plan-divider" />
                <ul className="ap-plan-features">
                  <li><span className="ap-check">✓</span> 8 sesiones personalizadas de 1 hora</li>
                  <li><span className="ap-check">✓</span> Eligues cuando quieres tenerlas</li>
                  <li><span className="ap-check">✓</span> Entrenamiento progresivo</li>
                  <li><span className="ap-check">✓</span> Ejercicios aplicados a tu caso</li>
                  <li><span className="ap-check">✓</span> Optimización de prompts y workflows</li>
                  <li><span className="ap-check">✓</span> Soporte por WhatsApp y llamadas</li>
                </ul>
                <div className="ap-plan-result"><strong>Resultado:</strong> Integras IA en tu forma de trabajar y producir.</div>
                <a href={STRIPE_LINKS.profesional} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-primary ap-btn-sm ap-plan-cta">Comprar pack →</a>
              </div>

              {/* PLAN 3 */}
              <div className="ap-plan ap-card">
                <div className="ap-plan-name">Plan 3</div>
                <div className="ap-plan-title">Plan Mensual</div>
                <div className="ap-plan-subtitle">Evoluciona constantemente con IA</div>
                <div className="ap-plan-price">
                  <span className="ap-plan-currency">USD</span>
                  <span className="ap-plan-amount">150</span>
                  <span className="ap-plan-period">/ mes</span>
                </div>
                <div className="ap-plan-note">2 sesiones mensuales + soporte continuo</div>
                <div className="ap-plan-reinforcement">Cancela cuando quieras</div>
                <div className="ap-plan-divider" />
                <ul className="ap-plan-features">
                  <li><span className="ap-check">✓</span> 2 sesiones al mes de 1 hora</li>
                  <li><span className="ap-check">✓</span> Actualización constante (nuevas herramientas y usos)</li>
                  <li><span className="ap-check">✓</span> Mejora continua de tu sistema de trabajo</li>
                  <li><span className="ap-check">✓</span> Resolución de casos reales en vivo</li>
                  <li><span className="ap-check">✓</span> Acompañamiento estratégico</li>
                </ul>
                <div className="ap-plan-result"><strong>Resultado:</strong> Te mantienes siempre un paso adelante usando IA.</div>
                <a href={STRIPE_LINKS.mensual} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-secondary ap-btn-sm ap-plan-cta">Suscribirme →</a>
              </div>
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ DIFERENCIAL ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef}>
          <div className="ap-container">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">⚔️ LA DIFERENCIA</span>
              <h2>No es un curso. <span className="text-accent">No es teoría.</span></h2>
              <p style={{ color: "var(--gray-500)", marginTop: 14, fontSize: 15, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
                La mayoría aprende IA viendo videos. El problema: <strong style={{ color: "var(--gray-900)" }}>no saben aplicarla.</strong>
              </p>
            </div>
            <div className="ap-diff-grid">
              {[
                { icon: "🎯", title: "Trabajas sobre tu realidad", desc: "Cada sesión se basa en tu caso real, tu industria, tus problemas concretos." },
                { icon: "⚡", title: "Corriges en tiempo real", desc: "Feedback instantáneo. Sin esperar correcciones ni buscar respuestas en foros." },
                { icon: "🔧", title: "Aprendes haciendo", desc: "No hay presentaciones. Abrimos herramientas, escribimos prompts y resolvemos." },
              ].map((item, i) => (
                <div key={i} className="ap-diff-card ap-card">
                  <div className="ap-diff-icon">{item.icon}</div>
                  <div className="ap-diff-title">{item.title}</div>
                  <div className="ap-diff-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ RESULTADOS ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef} style={{ background: "var(--gray-50)" }}>
          <div className="ap-container-narrow">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">📊 RESULTADOS</span>
              <h2>Lo que cambia cuando <span className="text-accent">usas IA bien</span></h2>
            </div>
            <div className="ap-results-grid">
              {[
                { icon: "🚀", text: "<strong>Produces más</strong> en menos tiempo" },
                { icon: "🧠", text: "<strong>Tomas mejores decisiones</strong> basadas en datos e insights" },
                { icon: "✨", text: "<strong>Generas contenido</strong> y análisis de mayor calidad" },
                { icon: "📈", text: "<strong>Te vuelves más valioso</strong> profesionalmente" },
              ].map((item, i) => (
                <div key={i} className="ap-result-card ap-card">
                  <div className="ap-result-icon">{item.icon}</div>
                  <div className="ap-result-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ QUIÉN SOY ════ */}
        <section className="ap-section ap-about ap-reveal" ref={addRevealRef} id="sobre-mi">
          <div className="ap-container">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="ap-label">👤 QUIÉN ESTÁ DETRÁS</span>
              <h2>Quién está detrás de <span className="text-accent">estas sesiones</span></h2>
            </div>
            <div className="ap-about-grid">
              <div className="ap-about-photo">
                <img src={AVATAR_URL} alt="Adrian Ortiz" />
              </div>
              <div>
                <p className="ap-about-text">
                  Soy un nerd de la IA con experiencia siendo frente de <strong>Operaciones y dueño en varias empresas</strong> cuando la IA todavía no era lo que es hoy. En esos roles entendí que el mayor problema de las personas es que no saben cómo tener el mismo o mejor resultado en menos tiempo.
                </p>
                <p className="ap-about-text" style={{ marginTop: 16 }}>
                  Hace más de un año me obsesioné con la Inteligencia Artificial y me paso <strong>12 horas por día</strong> dedicado a eso. Trabajo directamente con empresas y profesionales implementando IA en su día a día.
                </p>
                <p className="ap-about-text" style={{ marginTop: 16 }}>
                  No desde la teoría, sino desde la práctica: <strong>aplicando IA para mejorar productividad, toma de decisiones y calidad de trabajo.</strong>
                </p>
                <p className="ap-about-text" style={{ marginTop: 16 }}>
                  Estas sesiones nacen de ver el mismo problema una y otra vez: personas usando IA… pero sin realmente aprovecharla. Por eso el enfoque es simple:{" "}
                  <span style={{ color: "var(--cyan-600)", fontWeight: 600 }}>
                    trabajar contigo, en tu caso real, hasta que sepas usar IA como una herramienta profesional.
                  </span>
                </p>
                <ul className="ap-about-bullets">
                  <li>✦ Experiencia aplicando IA en contextos reales</li>
                  <li>⚡ Enfoque práctico (no académico)</li>
                  <li>🤝 Trabajo 1 a 1 personalizado</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* ════ FAQ ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef} id="faq">
          <div className="ap-container-narrow">
            <div style={{ textAlign: "center" }}>
              <span className="ap-label">❓ PREGUNTAS FRECUENTES</span>
              <h2>Resolvemos tus <span className="text-accent">dudas</span></h2>
            </div>
            <div className="ap-faq-list">
              {[
                { q: "¿Esto es para principiantes?", a: 'Esto es para <strong style="color:var(--gray-900)">todos los niveles de conocimiento</strong>. Adaptamos la sesión a donde estás hoy.' },
                { q: "¿Y si ya uso IA?", a: 'Entonces más aún: <strong style="color:var(--cyan-600)">optimizamos cómo la usas</strong>. Hay una diferencia enorme entre usar IA y usar IA bien.' },
                { q: "¿Aplica a cualquier industria?", a: 'Sí. La IA es transversal. <strong style="color:var(--gray-900)">Adaptamos todo a tu caso</strong>, sin importar el rubro.' },
                { q: "¿Cómo accedo después de pagar?", a: 'Te llegará un <strong style="color:var(--gray-900)">WhatsApp para coordinar la primera sesión</strong>. Simple y directo.' },
              ].map((item, i) => (
                <div key={i} className="ap-faq-item ap-card">
                  <div className="ap-faq-q">{item.q}</div>
                  <div className="ap-faq-a" dangerouslySetInnerHTML={{ __html: item.a }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ WHATSAPP ════ */}
        <section className="ap-section ap-whatsapp ap-reveal" ref={addRevealRef}>
          <div className="ap-container-narrow">
            <div className="ap-whatsapp-box">
              <div className="ap-whatsapp-icon">💬</div>
              <div className="ap-whatsapp-title">¿Tenés dudas? Hablemos</div>
              <div className="ap-whatsapp-desc">
                Si querés saber más antes de decidirte, escribime directo por WhatsApp. Sin compromiso.
              </div>
              <a
                href="https://wa.me/59892206700?text=Hola%20Adrian%2C%20quiero%20saber%20m%C3%A1s%20sobre%20las%20asesor%C3%ADas%20de%20IA"
                target="_blank"
                rel="noopener noreferrer"
                className="ap-btn ap-btn-whatsapp"
              >
                Contactar por WhatsApp →
              </a>
            </div>
          </div>
        </section>

        {/* ════ CTA FINAL ════ */}
        <section className="ap-cta-final ap-reveal" ref={addRevealRef}>
          <div className="ap-container-narrow">
            <span className="ap-label" style={{ color: "var(--cyan-400)" }}>🎯 EMPEZÁ AHORA</span>
            <h2>Si usas IA todos los días, <span style={{ color: "var(--cyan-400)" }}>deberías saber usarla bien</span></h2>
            <p className="ap-cta-sub">No es el futuro. Es una ventaja competitiva hoy.</p>
            <div className="ap-cta-buttons">
              <a href={STRIPE_LINKS.intensiva} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-white">Empezar ahora →</a>
              <a href={STRIPE_LINKS.profesional} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-accent">Comprar pack →</a>
              <a href={STRIPE_LINKS.mensual} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-outline-white">Suscribirme →</a>
            </div>
          </div>
        </section>

        {/* ════ POST-COMPRA ════ */}
        <section className="ap-section ap-reveal" ref={addRevealRef} id="post-compra">
          <div className="ap-container-narrow" style={{ textAlign: "center" }}>
            <span className="ap-label">🧠 DESPUÉS DE COMPRAR</span>
            <h2 style={{ fontSize: "1.5rem" }}>¿Qué pasa cuando <span className="text-accent">comprás</span>?</h2>
            <div className="ap-steps-row">
              {[
                { n: "1", title: "Accedes al calendario", desc: "Recibís un link por WhatsApp para coordinar tus sesiones." },
                { n: "2", title: "Agendas tu sesión", desc: "Elegís el día y horario que mejor te funcione." },
                { n: "3", title: "Empezamos a trabajar", desc: "Directamente en tu caso real, desde el primer minuto." },
              ].map((s, i) => (
                <div key={i} className="ap-step ap-card">
                  <div className="ap-step-number">{s.n}</div>
                  <div className="ap-step-title">{s.title}</div>
                  <div className="ap-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ FOOTER ════ */}
        <footer className="ap-footer">
          <div className="ap-container-narrow">
            © 2025 Adrian Ortiz — Asesorías de IA personalizadas
          </div>
        </footer>

        {/* ════ STICKY CTA MOBILE ════ */}
        <div className="ap-sticky-cta">
          <a href={STRIPE_LINKS.profesional} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn-primary">
            Pack Profesional →
          </a>
          <a href="#planes" className="ap-btn ap-btn-secondary">Ver planes</a>
        </div>
      </div>
    </>
  );
}
