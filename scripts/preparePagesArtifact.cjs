const { copyFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(process.cwd(), 'dist');
const indexPath = join(distDir, 'index.html');
const fallbackPath = join(distDir, '404.html');

if (!existsSync(indexPath)) {
  process.stderr.write(
    'dist/index.html is missing. Run the Vite build first.\n'
  );
  process.exit(1);
}

copyFileSync(indexPath, fallbackPath);
process.stdout.write('Prepared GitHub Pages fallback: dist/404.html\n');
