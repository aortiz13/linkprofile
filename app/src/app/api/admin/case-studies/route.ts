import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Case studies data sourced from aortiz13/web-Brandboost/data/caseStudies.ts
// To update: copy new entries from the Brandboost repo
const CASE_STUDIES = [
  {
    id: "innovacirco",
    client: "INNOVACIRCO",
    title: "Como INNOVACIRCO aumentó sus oportunidades de negocio gracias a Brandboost AI",
    industry: "Entertainment",
    excerpt: "Compañía de acrobacia y espectáculos artísticos Suizo-Argentina.",
    image: "https://www.innovacirco.com/img/bg-show-tigrou.jpg?auto=format&fit=crop&q=80&w=1000",
    logo: "https://www.innovacirco.com/img/logo-innovacirco.png",
  },
  {
    id: "hospital-san-jose",
    client: "Gastroenterología San José",
    title: "Optimización de consultas médicas con transcripción potenciada con IA",
    industry: "Healthcare",
    excerpt: "Diagnóstico, tratamiento y prevención de enfermedades digestivas.",
    image: "https://www.hospitalessanjose.com/images/ind-quir-1.webp?auto=format&fit=crop&q=80&w=1000",
    logo: "https://www.hospitalessanjose.com/images/hospital-san-jose-white.webp",
  },
  {
    id: "templo-del-masaje",
    client: "Templo del Masaje",
    title: "Cómo Templo del Masaje transformó su operativa con IA",
    industry: "Wellness & Beauty",
    excerpt: "Centro de bienestar con 5 sucursales en Madrid.",
    image: "https://templodelmasaje.com/wp-content/uploads/2018/05/templo-del-masaje-arturo-soria.jpg?auto=format&fit=crop&q=80&w=1000",
    logo: "https://templodelmasaje.com/wp-content/uploads/2019/12/logo-tdm.png",
  },
  {
    id: "mi-hogar",
    client: "Mi Hogar",
    title: "Cómo Mi Hogar redujo un 60% las tareas administrativas gracias a procesos optimizados con IA",
    industry: "Real Estate",
    excerpt: "Administración y auditoría de edificios y condominios en Chile.",
    image: "https://cdnx.jumpseller.com/ad-toma-aerea-banco-de-im/image/7833870/Captura_de_Pantalla_2020-02-27_a_la_s__20.11.26.jpg?1582845338&fit=crop&q=80&w=1000",
    logo: "https://mi-hogar.org/wp-content/uploads/2023/05/LOGO-MI-HOGAR-2025.png",
  },
  {
    id: "Nobel",
    client: "Clínicas Nobel",
    title: "Clínicas Nobel redujo un 40% sus tareas administrativas y mejoró su atención al cliente",
    industry: "Healthcare",
    excerpt: "Línea de clínicas Dentales y de Salud en España",
    image: "https://clinicadentalnobel.es/wp-content/uploads/2023/02/pexels-cedric-fauntleroy-4269494-1200x800.jpg?auto=format&fit=crop&q=80&w=1000",
    logo: "https://clinicadentalnobel.es/wp-content/uploads/2023/01/Color-logo-negro-1400x665.png",
  },
  {
    id: "comidas-bracamonte",
    client: "Comidas Bracamonte",
    title: "Cómo Comidas Bracamonte automatizó la gestión de menús semanales con IA",
    industry: "Restaurantes",
    excerpt: "Servicio de suscripción de comida casera a domicilio en España.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000",
    logo: "https://res.cloudinary.com/dhzmkxbek/image/upload/v1764019185/logo_comidas_bracamonte_ktothv.webp",
  },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ studies: CASE_STUDIES });
}
