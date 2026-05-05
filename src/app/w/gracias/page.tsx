import type { Metadata } from "next";
import GraciasClient from "./GraciasClient";

export const metadata: Metadata = {
  title: "Listo · Revisá tu WhatsApp · Brandboost AI",
  description: "Tu recurso está en camino. Pero antes de irte, mirá esto.",
};

export default function GraciasPage() {
  return <GraciasClient />;
}
