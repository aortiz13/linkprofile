import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asesorías de IA Personalizadas — Adrian Ortiz",
  description:
    "Sesiones 1 a 1 donde aplicas IA directamente en tu trabajo, negocio o día a día. Aprende a usar Inteligencia Artificial como un profesional.",
  openGraph: {
    title: "Asesorías de IA Personalizadas — Adrian Ortiz",
    description:
      "Sesiones 1 a 1 donde aplicas IA directamente en tu trabajo, negocio o día a día.",
    type: "website",
  },
};

export default function AsesoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
