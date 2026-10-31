const { test, expect } = require('@playwright/test');

// Saving a page to a phone's Home Screen: iOS reads the apple-touch-icon link, Android the manifest's icons.
const PAGES = ['', 'battleships', 'connect4', 'dice', 'hangman', 'house', 'snake', 'soccer', 'soccer5v5', 'solitaire', 'tictactoe', 'uno', 'wordle', 'wordsearch'];

/** Fetch an icon: a real PNG of this exact size, the width and height being in the file's header. */
async function checkPng(request, url, size) {
  const res = await request.get(url);
  expect(res.status(), url).toBe(200);
  expect(res.headers()['content-type'], url).toMatch(/^image\/png/);
  const png = await res.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)], url).toEqual([size, size]);
}

for (const dir of PAGES) {
  const base = dir ? `/${dir}/` : '/';
  test(`Home Screen icons: ${dir || 'the hub'}`, async ({ request }) => {
    const html = await (await request.get(base)).text();
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain('<meta name="apple-mobile-web-app-title"');
    expect(head).toContain('<meta name="theme-color"');
    const touch = /<link rel="apple-touch-icon" href="([^"]+)">/.exec(head);
    expect(touch).not.toBeNull();
    await checkPng(request, base + touch[1], 180);

    const link = /<link rel="manifest" href="([^"]+)">/.exec(head);
    expect(link).not.toBeNull();
    const manifest = await (await request.get(base + link[1])).json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map(i => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some(i => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) await checkPng(request, base + icon.src, parseInt(icon.sizes, 10));
  });

  // the hub has no service worker
  if (dir) test(`Home Screen icons work offline: ${dir}`, async ({ request }) => {
    const sw = await (await request.get(`${base}sw.js`)).text();
    for (const file of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) expect(sw).toContain(`'./icons/${file}'`);
  });
}
