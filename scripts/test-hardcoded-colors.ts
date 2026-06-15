import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');
const EXCLUDED_FILES = ['theme.json']; // Archivos donde sí se permiten colores

// Expresión regular para detectar colores hexadecimales (e.g. #FFF, #FFFFFF, #12345678)
const HEX_COLOR_REGEX = /#([a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{4}|[a-fA-F0-9]{3})\b/g;

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function testHardcodedColors() {
  console.log('🔍 Iniciando prueba de colores hardcodeados en /src...');
  const allFiles = getAllFiles(SRC_DIR);
  let hasErrors = false;

  allFiles.forEach((file) => {
    const fileName = path.basename(file);
    if (EXCLUDED_FILES.includes(fileName)) {
      return;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const matches = line.match(HEX_COLOR_REGEX);
      if (matches) {
        hasErrors = true;
        console.error(`\n❌ Se encontró color(es) hardcodeado(s) en: ${file.replace(SRC_DIR, 'src')}`);
        console.error(`   Línea ${index + 1}: ${line.trim()}`);
        console.error(`   Colores: ${matches.join(', ')}`);
      }
    });
  });

  if (hasErrors) {
    console.error('\n🚨 PRUEBA FALLIDA: Se detectaron colores hexadecimales hardcodeados.');
    console.error('   Por favor, utiliza las variables dinámicas (ej. var(--primary)) configuradas en theme.json.');
    process.exit(1);
  } else {
    console.log('\n✅ PRUEBA EXITOSA: No se encontraron colores hardcodeados. ¡La app está lista para escalar!');
    process.exit(0);
  }
}

testHardcodedColors();
