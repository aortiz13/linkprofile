import type { Metadata } from "next";
import A1Client from "./A1Client";

export const metadata: Metadata = {
  title: "Domina Claude a Nivel Profesional · Workshop $17 USD",
  description: "Workshop EN VIVO. Pasa de prompts básicos a sistemas automatizados con Claude. Sábado 16 de mayo · 10am ARG · USD $17.",
};

export default function A1Page() {
  return <A1Client />;
}
