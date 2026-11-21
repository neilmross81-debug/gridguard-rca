import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const file of ['index.html', 'privacy.html', 'terms.html']) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(www, file));
  }
}

// Configure the Capacitor mobile build as TotalRCA (general use + RevenueCat Pro)
const wwwIndex = path.join(www, 'index.html');
if (fs.existsSync(wwwIndex)) {
  let html = fs.readFileSync(wwwIndex, 'utf8');
  html = html
    .replace('<html lang="en-GB" data-brand="rwe">', '<html lang="en-GB" data-brand="totalrca">')
    .replace('<title>RWE-RCA — Root Cause Analysis &amp; CAPA Platform</title>', '<title>TotalRCA — Industrial Root Cause Analysis</title>')
    .replace('<meta name="theme-color" content="#1D4276">', '<meta name="theme-color" content="#F3F2F1">')
    .replace('aria-label="RWE-RCA home"', 'aria-label="TotalRCA home"')
    .replace('<span class="brand-name">RWE-RCA</span>', '<span class="brand-name">TotalRCA</span>')
    .replace('<span class="brand-sub">Generation &amp; Renewables</span>', '<span class="brand-sub">HV &amp; Renewable Operations</span>')
    .replace('<button class="sync-pill" id="proBtn" style="display:none"', '<button class="sync-pill" id="proBtn"')
    .replace('<script src="assets/native-bridge.js', '<script>window.APP_FLAVOR="totalrca";</script>\n<script src="assets/native-bridge.js');
  fs.writeFileSync(wwwIndex, html, 'utf8');
}

fs.cpSync(path.join(root, 'assets'), path.join(www, 'assets'), { recursive: true });
console.log('Built www/ for Capacitor (TotalRCA).');
