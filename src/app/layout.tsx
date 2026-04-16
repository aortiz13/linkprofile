import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Adrian Ortiz — LinkProfile",
    template: "%s | LinkProfile",
  },
  description:
    "Full Stack Developer & Creator. Encuentra todos mis links, redes y contacto en un solo lugar.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Adrian Ortiz — LinkProfile",
    description:
      "Full Stack Developer & Creator. Encuentra todos mis links, redes y contacto en un solo lugar.",
    type: "website",
    locale: "es_CL",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian Ortiz — LinkProfile",
    description:
      "Full Stack Developer & Creator. Encuentra todos mis links, redes y contacto en un solo lugar.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
