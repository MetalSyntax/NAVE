import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

const publicRoutes = ['manuals', 'terms', 'privacy', 'dashboard', 'logs', 'routes', 'maintenance', 'vehicle', 'settings'];

function prerender() {
  if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error(`[Prerender] Error: No se encontró index.html en ${INDEX_HTML_PATH}. Ejecuta el build primero.`);
    return;
  }

  const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  publicRoutes.forEach(route => {
    const routeDir = path.join(DIST_DIR, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    const routeHtmlPath = path.join(routeDir, 'index.html');
    
    // Para una SPA, copiamos el index.html base en cada subcarpeta de ruta.
    // Esto asegura que al servir la URL /manuals directamente, el servidor sirva
    // este index.html y React Router maneje la ruta cliente en lugar de dar error 404.
    fs.writeFileSync(routeHtmlPath, indexContent, 'utf8');
    console.log(`[Prerender] Ruta SPA generada: ${routeHtmlPath}`);
  });

  console.log('✅ Prerendering de rutas completado con éxito.');
}

prerender();
