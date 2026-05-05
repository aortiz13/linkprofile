import type { Metadata } from "next";
import B2Client from "./B2Client";

export const metadata: Metadata = {
  title: "Configurá Claude como un profesional en 10 minutos · Gratis",
  description: "Tutorial gratuito paso a paso. Incluye 2 prompts avanzados listos para copiar y usar.",
};

export default function B2Page() {
  return <B2Client />;
}
