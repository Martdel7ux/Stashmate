// Headless screenshot of the running Expo web app, authenticated via a real token.
const puppeteer = require('puppeteer-core');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP = 'http://localhost:8082/';
const API = 'http://localhost:5000';
const OUT = process.argv[2] || 'home.png';

(async () => {
  console.log('1. login');
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@savingsapp.dev', password: 'Password123!' }),
  });
  const auth = await res.json();
  const session = JSON.stringify({
    userId: auth.userId, email: auth.email,
    accessToken: auth.accessToken, refreshToken: auth.refreshToken,
  });

  console.log('2. launch');
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log('3. first load');
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 90000 });

  console.log('4. seed session + reload');
  await page.evaluate((s) => window.localStorage.setItem('stash.auth', s), session);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });

  console.log('5. settle');
  await new Promise((r) => setTimeout(r, 8000));

  await page.screenshot({ path: OUT });
  console.log('saved', OUT);
  await browser.close();
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
