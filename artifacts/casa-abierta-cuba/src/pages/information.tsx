import { useEffect } from 'react';
import { ArrowRight, ArrowUpRight, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';

export type InformationPageKind = 'about' | 'privacy' | 'terms' | 'providers' | 'antifraud';

const pages: Record<Exclude<InformationPageKind, 'about'>, { title: string; intro: string; sections: Array<{ title: string; body: string[] }> }> = {
  privacy: {
    title: 'Política de privacidad',
    intro: 'Casa Abierta trata la información con cuidado, en cumplimiento de la Ley 149 de 2022 de Protección de Datos Personales de Cuba, y solo la utiliza para operar la plataforma y facilitar las solicitudes turísticas.',
    sections: [
      { title: 'Base legal', body: ['En cumplimiento con la Ley 149 de 2022 de Protección de Datos Personales de Cuba, informamos que los datos recolectados (nombre, email, teléfono) se utilizan exclusivamente para gestionar solicitudes y facilitar la conexión con los anfitriones.'] },
      { title: 'Retención de datos', body: ['Los datos se conservarán por el tiempo mínimo necesario para cumplir con la finalidad del servicio o hasta que el usuario solicite su eliminación.', 'No vendemos datos personales ni publicamos el correo o teléfono privado de viajeros. Los datos de contacto de los proveedores se guardan por separado y no se exponen en el catálogo público.'] },
      { title: 'Pagos', body: ['Los pagos con tarjeta se procesan a través de QvaPay bajo sus propias políticas de privacidad y seguridad (KYC/AML).'] },
      { title: 'Derechos del usuario', body: ['El usuario puede solicitar la modificación o eliminación de sus datos escribiendo a nuestro correo oficial.'] },
      { title: 'Seguridad e incidentes', body: ['Aplicamos permisos por rol y políticas de acceso a filas. No compartas contraseñas, documentos de identidad ni datos financieros en mensajes de solicitud. Si detectas una exposición o uso indebido, repórtalo desde Casa Abierta.', 'El servicio usa Supabase para autenticación y almacenamiento de datos. Las medidas de acceso dependen de políticas de seguridad y permisos de base de datos; consulta esta política antes de compartir información sensible.'] },
      { title: 'Propiedad intelectual', body: ['Casa Abierta Cuba es propiedad exclusiva de Yoanny Guillén Vargas (CEO y Creador), Técnico en Programación, Control y Supervisión de Operaciones Turísticas; Diseñador de Aplicaciones de Servicios. Todo el código fuente, diseño, marca, contenido y documentación son objeto de protección por derechos de autor.'] },
    ],
  },
  terms: {
    title: 'Términos y condiciones',
    intro: 'Casa Abierta es una plataforma intermediaria digital de conexión turística entre viajeros y proveedores locales. No es una agencia de viajes tradicional ni vende paquetes, transporte o alojamiento en nombre propio.',
    sections: [
      { title: 'Naturaleza del servicio', body: ['Casa Abierta Cuba es una plataforma tecnológica intermediaria que conecta a viajeros con proveedores locales (anfitriones). No somos una agencia de viajes tradicional ni operamos los servicios directamente.'] },
      { title: 'Responsabilidad del anfitrión', body: ['Cada anfitrión declara bajo juramento que cuenta con las licencias vigentes (Trabajo por Cuenta Propia, sanitarias, etc.) exigidas por la legislación cubana para operar. Casa Abierta no se hace responsable por incumplimientos legales de los anfitriones.'] },
      { title: 'Servicio Concierge', body: ['El servicio «Diseña tu Viaje a Medida» es una gestión de asistencia personalizada. La cotización final y los detalles se acuerdan directamente por WhatsApp, fuera de la plataforma.'] },
      { title: 'Pagos', body: ['El registro es gratuito. Los servicios de pago opcionales (Plan Premium) se procesan a través de QvaPay. La plataforma no se hace responsable de los acuerdos de pago directo entre viajeros y anfitriones por el servicio base.'] },
      { title: 'Conducta prohibida', body: ['Se prohíben la suplantación de identidad, la publicación de negocios o credenciales falsas, el fraude, el acoso, la discriminación, el spam, el uso de la plataforma para actividades ilícitas y cualquier intento de acceder a datos ajenos.', 'No publiques información personal de terceros sin autorización. Respeta las leyes aplicables y las normas de seguridad de las comunidades anfitrionas.'] },
      { title: 'Moderación y medidas', body: ['Casa Abierta puede verificar proveedores, solicitar aclaraciones, ocultar o eliminar publicaciones falsas, suspender o bloquear cuentas infractoras y conservar registros asociados a investigaciones de seguridad. Las decisiones pueden revisarse mediante el canal de contacto.', 'La plataforma podrá evolucionar para ofrecer reservas, colaboraciones o comisiones; los servicios de pago actuales son opcionales (por ejemplo, destacar un negocio con Premium) y no garantizan una reserva.'] },
      { title: 'Alcance', body: ['El contenido de los proveedores lo aportan sus titulares y se revisa antes de publicarse. La revisión no sustituye licencias, permisos, seguros ni garantías comerciales que puedan ser requeridos para prestar cada servicio. Antes de contratar, confirma directamente la disponibilidad, el precio y las condiciones del servicio.', 'Estos términos describen el funcionamiento de la Plataforma en vivo (Versión 1.0) y deben revisarse para adecuarlos a las jurisdicciones y autorizaciones conforme avance la operación comercial internacional.'] },
      { title: 'Propiedad intelectual', body: ['Casa Abierta Cuba es propiedad exclusiva de Yoanny Guillén Vargas (CEO y Creador), Técnico en Programación, Control y Supervisión de Operaciones Turísticas; Diseñador de Aplicaciones de Servicios. Código, diseño, marca, documentación y contenido están protegidos por derechos de autor.'] },
    ],
  },
  providers: {
    title: 'Normas para proveedores',
    intro: 'La confianza empieza con información clara. Cada propuesta queda pendiente hasta que el equipo de Casa Abierta la revise y apruebe.',
    sections: [
      { title: 'Información veraz', body: ['Utiliza tu identidad real y publica solo negocios, servicios, fotografías y experiencias que estés autorizado a ofrecer. No inventes licencias, reseñas, ubicaciones, disponibilidad ni certificaciones.', 'Describe de forma precisa el precio cuando corresponda, lo que incluye el servicio, requisitos, accesibilidad, idiomas y condiciones de cancelación. Mantén esos datos actualizados.'] },
      { title: 'Anfitriones y seguridad', body: ['La sección «Conoce a tu anfitrión» debe ser una presentación auténtica y respetuosa. No compartas documentos de identidad ni datos privados en la historia pública.', 'La etiqueta LGBT Friendly es una declaración de servicio basada en respeto e inclusión; no es una certificación de seguridad ni reemplaza la responsabilidad del proveedor de tratar a cada viajero sin discriminación.'] },
      { title: 'Revisión y estado', body: ['Casa Abierta puede pedir pruebas razonables, rechazar una propuesta incompleta, suspender un anuncio o eliminar contenido falso o fraudulento. Solo los negocios aprobados aparecen en el catálogo.', 'Los datos de contacto del proveedor se protegen y se usan para administrar la conexión; el contacto inicial no se publica como teléfono o correo abierto.'] },
      { title: 'Solicitudes y relación comercial', body: ['Responde a las solicitudes recibidas dentro de Casa Abierta y mantén un trato profesional. No uses los datos de viajeros para publicidad no solicitada.', 'Casa Abierta actúa como intermediario digital de conexión, no como agencia tradicional ni garante del servicio. El registro y la publicación son gratuitos; los servicios Premium u otros cobros son siempre opcionales y se procesan a través de plataformas de pago legales como QvaPay.'] },
    ],
  },
  antifraud: {
    title: 'Política antifraude',
    intro: 'Casa Abierta combina revisión humana, solicitudes registradas y reportes para ayudar a reducir el fraude y proteger a viajeros y proveedores.',
    sections: [
      { title: 'Señales que investigamos', body: ['Identidades falsas, negocios inexistentes, fotos ajenas, precios o disponibilidad engañosos, solicitudes de pago sospechosas, suplantación de la plataforma, acoso, discriminación y patrones de uso abusivo.', 'No envíes dinero ni documentos sensibles a través de una solicitud. Casa Abierta no cobra reservas a través de las solicitudes y no pide contraseñas o códigos de verificación; los únicos pagos opcionales de la plataforma (como Premium) se realizan a través de plataformas de pago legales como QvaPay.'] },
      { title: 'Qué hacer', body: ['Usa el botón de reporte en una publicación o escribe al equipo desde Contacto. Incluye el enlace o nombre del contenido y una explicación breve; evita adjuntar información sensible de otras personas.', 'El equipo puede revisar la actividad, pedir información, limitar visibilidad, suspender cuentas, bloquear usuarios infractores o eliminar contenido falso. No prometemos un resultado antes de revisar el caso.'] },
      { title: 'Límites', body: ['La verificación de Casa Abierta es una revisión de plataforma y no una garantía de seguridad, licencia, calidad o cumplimiento legal del servicio anunciado.', 'Las decisiones de moderación se documentan en el sistema. Los usuarios pueden solicitar una revisión mediante el canal de contacto oficial.'] },
    ],
  },
};

export function InformationPage({ kind }: { kind: InformationPageKind }) {
  useEffect(() => {
    const title = kind === 'about' ? 'Sobre Casa Abierta Cuba' : pages[kind].title;
    document.title = `${title} | Casa Abierta Cuba`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = kind === 'about'
      ? 'Conoce Casa Abierta Cuba, plataforma de conexión turística creada por Yoanny Guillén Vargas.'
      : pages[kind].intro;
  }, [kind]);

  if (kind === 'about') {
    return <article className="editorial-page page-shell">
      <div className="section-kicker">CASA ABIERTA · SOBRE EL PROYECTO</div>
      <h1>Una isla que se<br /><em>comparte.</em></h1>
      <p className="editorial-lead">Casa Abierta conecta viajeros con Cuba auténtica mediante tecnología, confianza y personas reales.</p>
      <div className="editorial-story">
        <section><div className="section-kicker">LA HISTORIA</div><h2>Una idea nacida de la hospitalidad.</h2><p>Casa Abierta nace para que quienes llegan a Cuba conozcan a las personas, proyectos y lugares que dan sentido a cada viaje. La tecnología facilita el encuentro; la confianza y la decisión humana siguen en el centro. También ofrecemos el servicio «Diseña tu Viaje a Medida», una gestión de asistencia personalizada cuya cotización final se acuerda por WhatsApp.</p><p>Somos una plataforma intermediaria digital de conexión turística. Plataforma en vivo (Versión 1.0): no actuamos como agencia tradicional ni vendemos paquetes; el registro es gratuito y ofrecemos servicios opcionales de pago (como la suscripción Premium) procesados de forma segura a través de QvaPay u otras plataformas de pago legales.</p></section>
        <aside className="creator-card"><span className="creator-seal">CA</span><div className="section-kicker">CREADA EN CUBA</div><h2>Casa Abierta Cuba fue creada por Yoanny Guillén Vargas</h2><p>Un proyecto para abrir nuevas puertas entre viajeros y anfitriones locales.</p><Link className="text-link" href="/contacto">Contactar al equipo <ArrowRight size={16} /></Link></aside>
      </div>
      <div className="editorial-pillars">
        <section><ShieldCheck /><div className="section-kicker">MISIÓN</div><h2>Conectar con confianza.</h2><p>Facilitar encuentros turísticos respetuosos mediante anfitriones revisados, solicitudes registradas y una experiencia clara para ambas partes.</p></section>
        <section><ArrowUpRight /><div className="section-kicker">VISIÓN</div><h2>Crecer desde lo local.</h2><p>Construir una red que pueda colaborar con agencias, operadores, alojamientos, creadores de experiencias y proyectos culturales, manteniendo la comunidad cubana en el centro.</p></section>
        <section><BadgeCheck /><div className="section-kicker">CONFIANZA</div><h2>Personas reales.</h2><p>Las propuestas pasan por revisión manual. La verificación es una medida de calidad de la plataforma, no una certificación oficial.</p></section>
      </div>
      <div className="editorial-cta"><div><div className="section-kicker">UN PRÓXIMO ENCUENTRO</div><h2>¿Quieres colaborar?</h2><p>Conversemos sobre oportunidades para viajeros y comunidades anfitrionas.</p></div><Link className="button-primary" href="/contacto">Escribir a Casa Abierta <ArrowRight size={17} /></Link></div>
    </article>;
  }

  const content = pages[kind];
  return <article className="editorial-page page-shell legal-page">
    <div className="section-kicker">CASA ABIERTA · CONFIANZA Y CUIDADO</div>
    <h1>{content.title}</h1>
    <p className="editorial-lead">{content.intro}</p>
    <div className="legal-sections">{content.sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
    <p className="legal-note">Documento informativo de la Plataforma en vivo (Versión 1.0). Casa Abierta revisa periódicamente estos textos con asesoría legal adecuada a sus actividades y jurisdicciones.</p>
    <Link className="text-link" href="/contacto">Contactar al equipo <ArrowRight size={16} /></Link>
  </article>;
}
