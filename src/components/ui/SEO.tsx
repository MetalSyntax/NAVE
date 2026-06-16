import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  titleKey: string;
  descKey: string;
  schema?: Record<string, any> | Record<string, any>[];
}

export function SEO({ titleKey, descKey, schema }: SEOProps) {
  const { t, i18n } = useTranslation('seo');

  const title = t(titleKey);
  const description = t(descKey);
  const currentLang = i18n.language || 'es';
  const alternateLang = currentLang.startsWith('es') ? 'en' : 'es';

  const baseDomain = 'https://tu-dominio.com';
  const path = window.location.pathname;
  const canonicalUrl = `${baseDomain}${path}`;
  const alternateUrl = `${baseDomain}/${alternateLang}${path}`;

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${baseDomain}/og-image.jpg`} />
      <meta property="og:locale" content={currentLang.startsWith('es') ? 'es_ES' : 'en_US'} />
      <meta property="og:locale:alternate" content={alternateLang.startsWith('es') ? 'es_ES' : 'en_US'} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang={currentLang.startsWith('es') ? 'es' : 'en'} href={canonicalUrl} />
      <link rel="alternate" hrefLang={alternateLang.startsWith('es') ? 'es' : 'en'} href={alternateUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
