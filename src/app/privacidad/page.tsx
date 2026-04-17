import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad y protección de datos personales de Adrian Ortiz / Brandboost.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            Adrian Ortiz
          </a>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Política de Privacidad</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
          Política de Privacidad
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Última actualización: 16 de abril de 2026
        </p>

        <div className="space-y-10 text-[15px] leading-relaxed">
          <Section title="1. Responsable del Tratamiento de Datos">
            <p>
              El responsable del tratamiento de los datos personales recogidos a través de este sitio web es:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li><strong className="text-white">Nombre:</strong> Adrian Ortiz</li>
              <li><strong className="text-white">Marca:</strong> Brandboost</li>
              <li><strong className="text-white">Sitio web:</strong> adrian-ortiz.com</li>
              <li><strong className="text-white">Correo de contacto:</strong> hola@adrian-ortiz.com</li>
            </ul>
          </Section>

          <Section title="2. Datos que Recopilamos">
            <p>Recopilamos los siguientes tipos de información:</p>

            <h4 className="text-white font-semibold mt-4 mb-2">2.1. Datos proporcionados voluntariamente</h4>
            <p>Cuando completas un formulario de contacto o un lead magnet, nos proporcionas:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de WhatsApp / teléfono</li>
              <li>Cualquier mensaje o consulta adicional que incluyas</li>
            </ul>

            <h4 className="text-white font-semibold mt-4 mb-2">2.2. Datos recopilados automáticamente</h4>
            <p>
              Al visitar nuestro sitio web, recopilamos información técnica de forma automática
              con fines analíticos y de mejora del servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Dirección IP (utilizada para determinar el país de origen)</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Sistema operativo</li>
              <li>Páginas visitadas y enlaces en los que haces clic</li>
              <li>Fuente de referencia (cómo llegaste al sitio)</li>
              <li>Fecha y hora de la visita</li>
              <li>País de origen (derivado de la dirección IP)</li>
            </ul>
          </Section>

          <Section title="3. Finalidad del Tratamiento">
            <p>Los datos personales recopilados se utilizan exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-white">Responder a tus consultas:</strong> procesar y
                responder a los mensajes que envías a través de nuestros formularios de contacto.
              </li>
              <li>
                <strong className="text-white">Entregar recursos descargables:</strong> enviar el
                contenido solicitado (guías, PDFs, documentos) a cambio de tu información de
                contacto a través de nuestros lead magnets.
              </li>
              <li>
                <strong className="text-white">Comunicaciones comerciales:</strong> enviarte
                información relacionada con nuestros servicios, siempre que hayas dado tu
                consentimiento previo. Podrás darte de baja en cualquier momento.
              </li>
              <li>
                <strong className="text-white">Análisis y mejoras:</strong> comprender cómo los
                usuarios interactúan con nuestro sitio web para mejorar la experiencia, el
                contenido y los servicios ofrecidos.
              </li>
              <li>
                <strong className="text-white">Seguridad:</strong> prevenir fraude, acceso no
                autorizado y otras actividades maliciosas.
              </li>
            </ul>
          </Section>

          <Section title="4. Base Legal del Tratamiento">
            <p>El tratamiento de tus datos se fundamenta en las siguientes bases legales:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong className="text-white">Consentimiento explícito (Art. 6.1.a RGPD):</strong>{" "}
                al completar un formulario y aceptar esta política de privacidad, otorgas tu
                consentimiento libre, informado, específico e inequívoco para el tratamiento de
                tus datos.
              </li>
              <li>
                <strong className="text-white">Interés legítimo (Art. 6.1.f RGPD):</strong>{" "}
                para el análisis estadístico anónimo del uso del sitio web y la mejora de
                nuestros servicios.
              </li>
              <li>
                <strong className="text-white">Ejecución de un contrato (Art. 6.1.b RGPD):</strong>{" "}
                cuando el tratamiento sea necesario para la prestación de servicios contratados.
              </li>
            </ul>
          </Section>

          <Section title="5. Conservación de los Datos">
            <p>
              Tus datos personales se conservarán durante el tiempo necesario para cumplir con la
              finalidad para la que fueron recogidos:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-white">Datos de contacto y leads:</strong> se conservan
                durante un máximo de 24 meses desde su recopilación, salvo que exista una
                relación comercial activa o una obligación legal que requiera su conservación
                por un período superior.
              </li>
              <li>
                <strong className="text-white">Datos analíticos:</strong> se conservan de forma
                agregada y anonimizada, sin límite temporal definido, dado que no permiten la
                identificación personal.
              </li>
            </ul>
            <p className="mt-3">
              Una vez transcurridos los plazos mencionados, los datos serán suprimidos o
              anonimizados de forma irreversible.
            </p>
          </Section>

          <Section title="6. Tus Derechos">
            <p>
              De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la legislación
              aplicable, tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong className="text-white">Acceso:</strong> solicitar una copia de los datos
                personales que tenemos sobre ti.
              </li>
              <li>
                <strong className="text-white">Rectificación:</strong> solicitar la corrección de
                datos inexactos o incompletos.
              </li>
              <li>
                <strong className="text-white">Supresión:</strong> solicitar la eliminación de tus
                datos personales cuando ya no sean necesarios.
              </li>
              <li>
                <strong className="text-white">Limitación:</strong> solicitar la restricción del
                tratamiento de tus datos en determinadas circunstancias.
              </li>
              <li>
                <strong className="text-white">Portabilidad:</strong> recibir tus datos en un
                formato estructurado y de uso común, o solicitar su transferencia a otro
                responsable.
              </li>
              <li>
                <strong className="text-white">Oposición:</strong> oponerte al tratamiento de tus
                datos por motivos legítimos.
              </li>
              <li>
                <strong className="text-white">Revocación del consentimiento:</strong> retirar tu
                consentimiento en cualquier momento sin que ello afecte a la licitud del
                tratamiento previo.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, puedes contactarnos en{" "}
              <a
                href="mailto:hola@adrian-ortiz.com"
                className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
              >
                hola@adrian-ortiz.com
              </a>
              . Responderemos a tu solicitud en un plazo máximo de 30 días.
            </p>
          </Section>

          <Section title="7. Seguridad de los Datos">
            <p>
              Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos
              personales contra el acceso no autorizado, la alteración, la divulgación o la
              destrucción accidental o ilícita. Entre estas medidas se incluyen:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Cifrado de datos en tránsito mediante protocolo HTTPS/TLS</li>
              <li>Almacenamiento seguro en bases de datos con acceso restringido</li>
              <li>Autenticación de doble factor para el acceso administrativo</li>
              <li>Copias de seguridad periódicas con cifrado</li>
              <li>Revisión y actualización continua de las medidas de seguridad</li>
            </ul>
          </Section>

          <Section title="8. Servicios de Terceros">
            <p>
              Para el correcto funcionamiento de nuestro sitio web y servicios, utilizamos los
              siguientes proveedores externos que pueden tener acceso a ciertos datos:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong className="text-white">Hosting y Infraestructura:</strong> nuestro sitio
                web está alojado en servidores seguros. Los proveedores de hosting pueden
                registrar datos técnicos de acceso (IP, fecha/hora) como parte de sus registros
                de sistema.
              </li>
              <li>
                <strong className="text-white">Base de Datos:</strong> utilizamos servicios de base de
                datos gestionados para almacenar la información de forma segura y cifrada.
              </li>
              <li>
                <strong className="text-white">Servicios de Geolocalización:</strong> utilizamos
                la dirección IP para determinar el país de origen del visitante de forma
                aproximada. No se almacena la dirección IP completa de forma permanente.
              </li>
            </ul>
            <p className="mt-3">
              No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines
              comerciales o publicitarios.
            </p>
          </Section>

          <Section title="9. Cookies y Tecnologías de Seguimiento">
            <p>
              Nuestro sitio web puede utilizar cookies técnicas y funcionales estrictamente
              necesarias para su correcto funcionamiento. No utilizamos cookies de terceros con
              fines publicitarios.
            </p>
            <p className="mt-3">
              Los datos analíticos se recopilan a través de nuestro propio sistema de seguimiento
              interno, sin recurrir a servicios de análisis de terceros como Google Analytics.
              Esto nos permite mantener el control total sobre los datos y minimizar la
              exposición a terceros.
            </p>
          </Section>

          <Section title="10. Transferencias Internacionales">
            <p>
              Los datos recopilados pueden ser almacenados y procesados en servidores ubicados
              fuera de tu país de residencia. En caso de transferencias internacionales de datos,
              nos aseguramos de que se apliquen las garantías adecuadas conforme a la normativa
              vigente, incluyendo cláusulas contractuales tipo aprobadas por la Comisión Europea
              o decisiones de adecuación.
            </p>
          </Section>

          <Section title="11. Menores de Edad">
            <p>
              Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos
              conscientemente información personal de menores de dicha edad. Si eres padre o
              tutor y crees que tu hijo nos ha proporcionado datos personales, por favor
              contáctanos para que podamos tomar las medidas necesarias.
            </p>
          </Section>

          <Section title="12. Modificaciones de esta Política">
            <p>
              Nos reservamos el derecho de actualizar esta política de privacidad en cualquier
              momento para reflejar cambios en nuestras prácticas, tecnologías o requisitos
              legales. La fecha de última actualización se indica en la parte superior de este
              documento.
            </p>
            <p className="mt-3">
              Te recomendamos revisar esta página periódicamente. Los cambios serán efectivos
              desde su publicación en este sitio web.
            </p>
          </Section>

          <Section title="13. Contacto">
            <p>
              Si tienes preguntas, inquietudes o deseas ejercer cualquiera de tus derechos en
              relación con el tratamiento de tus datos personales, puedes contactarnos a través
              de:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>
                <strong className="text-white">Correo electrónico:</strong>{" "}
                <a
                  href="mailto:hola@adrian-ortiz.com"
                  className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
                >
                  hola@adrian-ortiz.com
                </a>
              </li>
              <li>
                <strong className="text-white">Sitio web:</strong>{" "}
                <a
                  href="https://adrian-ortiz.com"
                  className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
                >
                  adrian-ortiz.com
                </a>
              </li>
            </ul>
          </Section>

          <Section title="14. Autoridad de Control">
            <p>
              Si consideras que el tratamiento de tus datos personales no se ajusta a la normativa
              vigente, tienes derecho a presentar una reclamación ante la autoridad de protección
              de datos competente de tu país de residencia. En España, la autoridad competente es
              la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>
              .
            </p>
          </Section>

          {/* Divider */}
          <div className="border-t border-white/5 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              Al utilizar este sitio web y proporcionar tus datos a través de nuestros
              formularios, aceptas los términos descritos en esta Política de Privacidad.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} Adrian Ortiz — Brandboost</span>
          <a href="/" className="text-cyan-500 hover:text-cyan-400 transition-colors">
            ← Volver al inicio
          </a>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-3 tracking-tight">{title}</h2>
      <div className="text-gray-400">{children}</div>
    </section>
  );
}
