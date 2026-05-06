import type { Metadata } from "next";
import B2Client from "./B2Client";
import FunnelViewTracker from "../FunnelViewTracker";

export const metadata: Metadata = {
  title: "Configurá Claude como un profesional en 10 minutos · Gratis",
  description: "Tutorial gratuito paso a paso. Incluye 2 prompts avanzados listos para copiar y usar.",
};

export default function B2Page() {
  return (
    <>
      <FunnelViewTracker funnelSlug="b" variantKey="2" />
      <B2Client />
    </>
  );
}
