import type { Metadata } from "next";
import "./workshop.css";

export const metadata: Metadata = {
  title: {
    default: "Workshop · Domina Claude a Nivel Profesional",
    template: "%s | Brandboost AI",
  },
  description:
    "Workshop EN VIVO. Pasa de prompts básicos a sistemas automatizados con Claude.",
};

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
