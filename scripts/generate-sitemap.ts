import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const BASE_URL = 'https://tu-dominio.com';

const routes = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: 'manuals', priority: '0.8', changefreq: 'weekly' },
  { path: 'terms', priority: '0.3', changefreq: 'monthly' },
  { path: 'privacy', priority: '0.3', changefreq: 'monthly' },
];

function generateSitemap() {
  const urlsXml = routes.map(route => {
    const fullUrl = route.path ? `${BASE_URL}/${route.path}` : BASE_URL;
    return `  <url>
    <loc>${fullUrl}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="es" href="${fullUrl}?lng=es" />
    <xhtml:link rel="alternate" hreflang="en" href="${fullUrl}?lng=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${fullUrl}" />
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`[Sitemap] Generado con éxito en: ${SITEMAP_PATH}`);
}

generateSitemap();
