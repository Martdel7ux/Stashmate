const puppeteer = require('puppeteer-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP = 'http://localhost:8082/';
const API = 'http://localhost:5000';

(async () => {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@savingsapp.dev', password: 'Password123!' }),
  });
  const a = await res.json();
  const session = JSON.stringify({ userId: a.userId, email: a.email, accessToken: a.accessToken, refreshToken: a.refreshToken });

  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, protocolTimeout: 120000, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.evaluate((s) => window.localStorage.setItem('stash.auth', s), session);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 8000));

  const data = await page.evaluate(() => {
    const vh = window.innerHeight;
    const find = (txt) => [...document.querySelectorAll('div,span')].find((e) => e.textContent.trim() === txt);
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; };
    const ng = find('New goal');
    const goals = find('Goals');
    return { vh, newGoal: box(ng), goalsTab: box(goals) };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
