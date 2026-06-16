import React from 'react';
import { ArrowLeft, Shield, Database, Eye, Bell, Trash2, Download } from 'lucide-react';
import { SEO } from '../components/ui/SEO';

interface PrivacyScreenProps {
  setActiveTab: (tab: string) => void;
}

export function PrivacyScreen({ setActiveTab }: PrivacyScreenProps) {
  const sections = [
    {
      icon: Database,
      title: 'Almacenamiento Local',
      color: 'text-primary',
      bg: 'bg-primary/10',
      body: 'NAVE almacena TODA tu información —datos del vehículo, imágenes, bitácoras y configuraciones— exclusivamente en tu dispositivo usando IndexedDB. Ningún dato sale de tu navegador.',
    },
    {
      icon: Eye,
      title: 'Sin Rastreo',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      body: 'No utilizamos cookies de rastreo, análisis de comportamiento, publicidad dirigida ni herramientas de monitoreo de terceros. No sabemos quién usa la aplicación ni cómo la usa.',
    },
    {
      icon: Shield,
      title: 'Sin Servidores',
      color: 'text-primary',
      bg: 'bg-primary/10',
      body: 'No existe un backend, base de datos en la nube ni servidor que reciba tus datos. La aplicación funciona completamente offline una vez cargada. No hay cuentas de usuario ni registros de actividad remotos.',
    },
    {
      icon: Bell,
      title: 'Notificaciones',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      body: 'Si activas las notificaciones, la aplicación utiliza la API de Notificaciones del navegador para enviarte alertas locales sobre mantenimiento. Estas notificaciones no se registran ni se envían a ningún servidor.',
    },
    {
      icon: Download,
      title: 'Exportar tus Datos',
      color: 'text-primary',
      bg: 'bg-primary/10',
      body: 'Puedes descargar una copia completa de todos tus datos en formato JSON desde Ajustes → Datos y Privacidad → "Exportar". El archivo incluye vehículos, bitácoras, mantenimientos y configuraciones.',
    },
    {
      icon: Trash2,
      title: 'Control Total de tus Datos',
      color: 'text-error',
      bg: 'bg-error/10',
      body: 'Puedes eliminar todos tus datos permanentemente desde Ajustes → Datos y Privacidad → "Borrar todo". Esta acción es irreversible y no se puede deshacer. Considera exportar antes de borrar.',
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <SEO titleKey="privacy_title" descKey="privacy_desc" />

      <button
        onClick={() => setActiveTab('settings')}
        className="flex items-center gap-2 text-primary font-headline font-bold text-sm uppercase tracking-wider mb-6 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Ajustes
      </button>

      <header className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-on-secondary-container" />
        </div>
        <div>
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight">Política de Privacidad</h1>
          <p className="text-[10px] text-surface-variant uppercase tracking-widest font-bold">Última actualización: Junio 2026</p>
        </div>
      </header>

      {/* Hero commitment */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-6 flex items-start gap-4">
        <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-headline font-black text-base uppercase text-primary mb-1">Compromiso de privacidad</p>
          <p className="text-sm text-on-surface font-body leading-relaxed">
            NAVE fue diseñada con privacidad desde el primer día. <strong>Cero datos enviados</strong>, <strong>cero rastreo</strong>, <strong>cero servidores</strong>. Tu información de mantenimiento vehicular es únicamente tuya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {sections.map(({ icon: Icon, title, color, bg, body }) => (
          <div key={title} className="bg-surface-low rounded-2xl p-6 shadow-elevation-1">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h2 className={`font-headline font-black text-sm uppercase tracking-tight ${color} mb-2`}>{title}</h2>
            <p className="text-sm text-on-surface font-body leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-surface-container rounded-2xl p-5 shadow-elevation-1 max-w-3xl">
        <p className="text-[10px] text-surface-variant uppercase tracking-widest font-bold text-center">
          NAVE · Todos los datos se almacenan localmente en tu dispositivo · Versión 1.0
        </p>
      </div>
    </div>
  );
}
