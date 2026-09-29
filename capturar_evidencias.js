const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const evidenciasDir = path.resolve(__dirname, 'evidencias');
if (!fs.existsSync(evidenciasDir)) {
  fs.mkdirSync(evidenciasDir, { recursive: true });
}

const targets = [
  {
    name: '01_ramas_github.png',
    url: 'https://github.com/JavicSoftCode-01/optimizador_de_cortes/branches',
    waitFor: 'body'
  },
  {
    name: '02_pull_request.png',
    url: 'https://github.com/JavicSoftCode-01/optimizador_de_cortes/pull/1',
    waitFor: 'body'
  },
  {
    name: '03_github_actions_ci.png',
    url: 'https://github.com/JavicSoftCode-01/optimizador_de_cortes/actions/runs/36605210279',
    waitFor: 'body'
  },
  {
    name: '04_github_release.png',
    url: 'https://github.com/JavicSoftCode-01/optimizador_de_cortes/releases/tag/v1.0.0',
    waitFor: 'body'
  }
];

async function capture() {
  console.log('Iniciando Puppeteer con Brave Browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  for (const t of targets) {
    const outPath = path.join(evidenciasDir, t.name);
    console.log(`Navegando a: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Small delay to ensure all client rendering and badges are visible
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captura guardada en: ${outPath} (${fs.statSync(outPath).size} bytes)`);
  }

  await browser.close();
  console.log('Todas las capturas se completaron exitosamente.');
}

capture().catch(err => {
  console.error('Error durante la captura:', err);
  process.exit(1);
});
