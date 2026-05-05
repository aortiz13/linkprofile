import type { Metadata } from "next";
import BienvenidoClient from "./BienvenidoClient";

export const metadata: Metadata = {
  title: "¡Estás dentro! · Unite al WhatsApp · Brandboost AI",
  description: "Pago confirmado. Sumate al grupo exclusivo de WhatsApp del workshop.",
};

export default function BienvenidoPage() {
  return <BienvenidoClient />;
}
