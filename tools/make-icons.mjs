// Draws the Home Screen icons:  npm run icons
// One flat symbol per game on that game's background colour, written to <game>/icons/ as
// apple-touch-icon.png (180), icon-192.png and icon-512.png. The PNGs are committed, so this only needs
// running after changing a symbol here. Bump the game's CACHE_NAME in sw.js when you do.
//
// Symbols are drawn on a 512 square. Android can crop an icon to a circle, so everything stays inside the
// safe zone: a circle of radius 204 round the middle (256, 256). iOS needs a square with no transparency.
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const ROOT = new URL('..', import.meta.url).pathname;
const SIZES = [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]];

const ICONS = {
  // the hub: a game controller
  '.': { bg: '#141c2e', art: `
    <path d="M166 170h180c50 0 80 44 90 100 8 46-6 78-36 78-24 0-40-18-58-40h-172c-18 22-34 40-58 40-30 0-44-32-36-78 10-56 40-100 90-100z" fill="#eef3fb" transform="translate(256 256) scale(.86) translate(-256 -256)"/>
    <path d="M176 222h32v30h30v32h-30v30h-32v-30h-30v-32h30z" fill="#141c2e"/>
    <circle cx="326" cy="236" r="19" fill="#e84a5f"/><circle cx="366" cy="272" r="19" fill="#3b7fc4"/>
    <circle cx="288" cy="272" r="19" fill="#f2c81c"/><circle cx="326" cy="308" r="19" fill="#6aa84f"/>` },
  // a ship on the waves
  battleships: { bg: '#16202f', fit: 0.92, art: `
    <path d="M230 150h44v52h-44zM244 104h16v50h-16z" fill="#cfd8e3"/>
    <path d="M176 202h148v44h-148z" fill="#9fb0c8"/>
    <path d="M86 244h340l-44 86h-252z" fill="#eef3fb"/>
    <path d="M78 356c30-22 60-22 89 0s60 22 89 0 60-22 89 0 60 22 89 0" fill="none" stroke="#3b9ae0" stroke-width="22" stroke-linecap="round"/>` },
  // a blue board with red and yellow discs
  connect4: { bg: '#1f110a', art: `
    <rect x="96" y="116" width="320" height="280" rx="30" fill="#2f6fd6"/>
    ${[[156, 186, '#1f110a'], [256, 186, '#1f110a'], [356, 186, '#e84a5f'], [156, 256, '#1f110a'], [256, 256, '#f2c81c'], [356, 256, '#f2c81c'], [156, 326, '#e84a5f'], [256, 326, '#e84a5f'], [356, 326, '#f2c81c']]
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="35" fill="${c}"/>`).join('')}` },
  // a die showing five
  dice: { bg: '#2b2b2b', art: `
    <rect x="116" y="116" width="280" height="280" rx="48" fill="#f4f1ea"/>
    ${[[176, 176], [336, 176], [256, 256], [176, 336], [336, 336]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="31" fill="#d6453a"/>`).join('')}` },
  // the gallows and the figure
  hangman: { bg: '#170a0d', fit: 0.96, art: `
    <path d="M130 402h200M176 402V104h150v44" fill="none" stroke="#e2c690" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="326" cy="186" r="38" fill="none" stroke="#f4f1ea" stroke-width="22"/>
    <path d="M326 226v92M326 250l-46 42M326 250l46 42M326 318l-40 58M326 318l40 58" fill="none" stroke="#f4f1ea" stroke-width="22" stroke-linecap="round"/>` },
  // a house with a lit window
  house: { bg: '#16202f', art: `
    <path d="M256 92 432 246h-46v148H126V246H80z" fill="#eef3fb" transform="translate(256 256) scale(.92) translate(-256 -256)"/>
    <path d="M256 92 432 246H80z" fill="#d6453a" transform="translate(256 256) scale(.92) translate(-256 -256)"/>
    <rect x="164" y="268" width="76" height="72" rx="6" fill="#f2c81c"/>
    <rect x="284" y="268" width="64" height="124" rx="6" fill="#16202f" transform="translate(0 -12)"/>` },
  // a snake and an apple
  snake: { bg: '#0f1f18', fit: 0.96, art: `
    <path d="M118 376h214c34 0 56-24 56-54s-22-54-56-54H180c-34 0-56-24-56-54s22-54 56-54h66" fill="none" stroke="#5fc46a" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="262" cy="160" r="10" fill="#0f1f18"/>
    <circle cx="350" cy="166" r="34" fill="#e84a5f"/>
    <path d="M350 134c0-12 6-20 18-24" fill="none" stroke="#6aa84f" stroke-width="10" stroke-linecap="round"/>` },
  // a football
  soccer: { bg: '#061a10', art: `
    <clipPath id="ball"><circle cx="256" cy="256" r="172"/></clipPath>
    <circle cx="256" cy="256" r="172" fill="#f4f6f4"/>
    <g clip-path="url(#ball)">
      <path d="M256 188l65 47-25 76h-80l-25-76z" fill="#16181a"/>
      <path d="M256 188v-70M321 235l67-22M296 311l41 57M216 311l-41 57M191 235l-67-22" stroke="#16181a" stroke-width="14"/>
      <path d="M212 76l44 42 44-42zM372 136l16 77 66-8zM434 340l-97 28 8 76zM78 340l97 28-8 76zM140 136l-16 77-66-8z" fill="#16181a"/>
    </g>` },
  // a whole pitch from above, with the ball on the centre spot
  soccer5v5: { bg: '#061a10', fit: 0.96, art: `
    <rect x="136" y="84" width="240" height="344" rx="10" fill="#3f9a4f"/>
    <path d="M152 100h208v312H152zM152 256h208M204 100v48h104v-48M204 412v-48h104v48" fill="none" stroke="#eaf5ec" stroke-width="10"/>
    <circle cx="256" cy="256" r="52" fill="none" stroke="#eaf5ec" stroke-width="10"/>
    <circle cx="256" cy="256" r="28" fill="#f4f6f4"/><circle cx="256" cy="256" r="10" fill="#16181a"/>` },
  // two playing cards
  solitaire: { bg: '#0f3424', art: `
    <g transform="rotate(-12 256 256)"><rect x="128" y="116" width="184" height="264" rx="20" fill="#e6e3da"/>
      <g transform="translate(176 196) scale(.5) rotate(180) translate(-302 -262)"><path d="M302 332c-62-48-84-74-84-106 0-40 56-50 84-12 28-38 84-28 84 12 0 32-22 58-84 106zM302 240l34-76h-68z" fill="#1c2522"/></g></g>
    <g transform="rotate(10 256 256)"><rect x="210" y="130" width="184" height="264" rx="20" fill="#fbf9f3"/>
      <path d="M302 332c-62-48-84-74-84-106 0-40 56-50 84-12 28-38 84-28 84 12 0 32-22 58-84 106z" fill="#d6453a" transform="translate(302 262) scale(.8) translate(-302 -262)"/></g>` },
  // noughts and crosses
  tictactoe: { bg: '#1f1608', art: `
    <path d="M204 112v288M308 112v288M112 204h288M112 308h288" stroke="#e2c690" stroke-width="22" stroke-linecap="round"/>
    <path d="M124 124l56 56M180 124l-56 56M332 332l56 56M388 332l-56 56" stroke="#e84a5f" stroke-width="26" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="30" fill="none" stroke="#5fb7d6" stroke-width="24"/>
    <circle cx="360" cy="152" r="30" fill="none" stroke="#5fb7d6" stroke-width="24"/>` },
  // a fan of coloured cards
  uno: { bg: '#12081f', fit: 0.9, art: `
    ${[[-33, '#3b7fc4'], [-11, '#6aa84f'], [11, '#f2c81c'], [33, '#e84a5f']].map(([a, c]) => `<g transform="rotate(${a} 256 420)">
      <rect x="182" y="130" width="148" height="226" rx="20" fill="${c}" stroke="#fbf9f3" stroke-width="9"/></g>`).join('')}
    <g transform="rotate(33 256 420)"><ellipse cx="256" cy="243" rx="50" ry="74" fill="#fbf9f3" transform="rotate(24 256 243)"/></g>` },
  // a word game's coloured tiles
  wordle: { bg: '#150d1f', art: `
    ${[['#6aa84f', '#3a3a44', '#d9b82c'], ['#3a3a44', '#d9b82c', '#3a3a44'], ['#6aa84f', '#6aa84f', '#6aa84f']]
    .flatMap((row, r) => row.map((c, i) => `<rect x="${116 + i * 98}" y="${116 + r * 98}" width="84" height="84" rx="10" fill="${c}"/>`)).join('')}` },
  // letters with a word ringed
  wordsearch: { bg: '#0a161f', art: `
    <rect x="96" y="214" width="320" height="84" rx="42" fill="#f2c81c"/>
    <g font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="72" text-anchor="middle">
      ${[['H', 'K', 'Q'], ['F', 'U', 'N'], ['R', 'A', 'L']].flatMap((row, r) => row.map((l, i) => `<text x="${156 + i * 100}" y="${176 + r * 106}" fill="${r === 1 ? '#0a161f' : '#eef3fb'}">${l}</text>`)).join('')}
    </g>` },
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [dir, { bg, art, fit = 1 }] of Object.entries(ICONS)) {
  mkdirSync(`${ROOT}${dir}/icons`, { recursive: true });
  for (const [file, size] of SIZES) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!doctype html><body style="margin:0;background:${bg}"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" style="display:block"><g transform="translate(256 256) scale(${fit}) translate(-256 -256)">${art}</g></svg>`);
    await page.screenshot({ path: `${ROOT}${dir}/icons/${file}`, omitBackground: false });
  }
}
await browser.close();
console.log(`${Object.keys(ICONS).length} icon sets written`);
