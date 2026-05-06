import type { Metadata } from "next";
import B1Client from "./B1Client";
import FunnelViewTracker from "../FunnelViewTracker";

export const metadata: Metadata = {
  title: "5 Prompts Pro para Claude · Gratis · Brandboost AI",
  description: "Los mismos 5 prompts que uso para automatizar tareas en minutos. Gratis. Llega a tu WhatsApp en 2 minutos.",
};

export default function B1Page() {
  return (
    <>
      <FunnelViewTracker funnelSlug="b" variantKey="1" />
      <B1Client />
    </>
  );
}
