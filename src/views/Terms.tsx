import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface TermsScreenProps {
  setActiveTab: (tab: string) => void;
}

export function TermsScreen({ setActiveTab }: TermsScreenProps) {
  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <Helmet><title>Términos y Condiciones | Apex Velocity</title></Helmet>

      {/* Back */}
      <button
        onClick={() => setActiveTab('settings')}
        className="flex items-center gap-2 text-primary font-headline font-bold text-sm uppercase tracking-wider mb-6 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Ajustes
      </button>

      <header className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary-container rounded-2xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-on-primary-container" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight">Términos y Condiciones</h1>
          <p className="text-[10px] text-surface-variant uppercase tracking-widest font-bold">Última actualización: Junio 2026</p>
        </div>
      </header>

      <div className="space-y-6 max-w-3xl">
        {[
          {
            title: '1. Aceptación',
            body: 'Al utilizar Apex Velocity aceptas estos términos. Si no estás de acuerdo, por favor deja de usar la aplicación. Estos términos pueden actualizarse en cualquier momento; el uso continuado implica aceptación de los cambios.',
          },
          {
            title: '2. Descripción del Servicio',
            body: 'Apex Velocity es una aplicación personal de control y telemetría vehicular. Permite registrar datos de mantenimiento, consumo de combustible, historial de servicios e información del vehículo. La aplicación opera completamente de forma local en tu dispositivo.',
          },
          {
            title: '3. Almacenamiento de Datos',
            body: 'Todos los datos que introduces —incluyendo información del vehículo, imágenes, registros de bitácora y configuraciones— se almacenan exclusivamente en tu dispositivo mediante IndexedDB. No se transmite ningún dato a servidores externos ni a terceros.',
          },
          {
            title: '4. Responsabilidad del Usuario',
            body: 'Eres responsable de mantener copias de seguridad de tus datos. Al limpiar los datos del navegador o desinstalar la aplicación, toda la información se perderá de forma permanente. La aplicación no garantiza la disponibilidad continua de los datos almacenados.',
          },
          {
            title: '4.1. Derechos sobre tus Datos',
            body: 'Tienes el derecho de exportar todos tus datos en cualquier momento desde Ajustes → Datos y Privacidad → "Exportar". Los datos se descargan en formato JSON. También puedes solicitar la eliminación completa de tus datos usando el botón "Borrar todo" en la misma sección.',
          },
          {
            title: '5. Uso Aceptable',
            body: 'Esta aplicación es de uso personal. No está permitido usar la aplicación para actividades ilegales, fraudulentas o que perjudiquen a terceros. El uso indebido puede resultar en la restricción del acceso.',
          },
          {
            title: '6. Limitación de Responsabilidad',
            body: 'Apex Velocity se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos responsables de pérdidas de datos, decisiones basadas en la información mostrada, o daños derivados del uso de la aplicación.',
          },
          {
            title: '7. Propiedad Intelectual',
            body: 'El código fuente, diseño y marca de Apex Velocity están protegidos. No está permitida la reproducción, distribución o modificación sin autorización previa por escrito.',
          },
          {
            title: '8. Notificaciones',
            body: 'La función de notificaciones utiliza la API de Notificaciones del navegador. Al activarlas, consientes recibir alertas locales sobre el estado de mantenimiento de tu vehículo. Puedes desactivarlas en cualquier momento desde la configuración de tu navegador.',
          },
          {
            title: '9. Contacto',
            body: 'Para preguntas sobre estos términos, puedes contactarnos a través del correo electrónico configurado en los ajustes de la aplicación.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="bg-surface-low rounded-2xl p-6 shadow-elevation-1">
            <h2 className="font-headline font-black text-base uppercase tracking-tight text-primary mb-3">{title}</h2>
            <p className="text-sm text-on-surface font-body leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
