// The avatar editor, from the home screen: how each of the four players looks (skin, hair style and colour,
// glasses, a beard for the grown-ups, top, trousers, shoes) with a turning preview, and their birthday. Their
// age follows from the birthday, and so whether P and Dude are children or teenagers. Saved on this device
// (players.js); the figures in the game change straight away.
import * as THREE from 'three';
import { S } from '../state.js';
import { makeCharacter } from '../characters/character.js';
import { HAIR, PALETTE, specFor } from '../characters/looks.js';
import { daysToBirthday, STAGE_NAMES } from '../players.js';

const NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };

export function createAvatar({ players, days, familyServer }) {
  const $ = id => document.getElementById(id);
  const el = { box: $('avatar'), controls: $('avatarControls'), preview: $('avatarPreview'), birthday: $('avatarBirthday'), age: $('avatarAge'),
               done: $('avatarDone'), reset: $('avatarReset'), open: $('looksBtn'),
               status: $('serverStatus'), token: $('serverToken'), connect: $('serverConnectBtn'), connectRow: $('serverConnect'), disconnect: $('serverDisconnect') };
  const tabs = [...document.querySelectorAll('.avatar-who [data-p]')];
  let key = 'dad', figure = null, spin = 0, raf = null;

  // --- the preview: its own little scene with a light from the front
  const renderer = new THREE.WebGLRenderer({ canvas: el.preview, antialias: true, alpha: true });
  if (renderer.setPixelRatio) renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 20);
  camera.position.set(0, 0.85, 3.1); camera.lookAt(0, 0.62, 0);
  const sun = new THREE.DirectionalLight('#fff4e0', 1.0); sun.position.set(1.5, 3, 3);
  scene.add(new THREE.HemisphereLight('#dfe9ff', '#3b2d22', 0.75), sun);

  function showFigure() {
    if (figure) scene.remove(figure.root);
    figure = makeCharacter(specFor(key, players.look(key), players.stage(key)));
    figure.root.rotation.y = spin;
    scene.add(figure.root);
  }

  function loop() {
    if (el.box.hidden) { raf = null; return; }
    spin += 0.012;
    if (figure) figure.root.rotation.y = Math.sin(spin) * 0.9;
    renderer.render(scene, camera);
    raf = globalThis.requestAnimationFrame(loop);
  }

  // --- the controls: one row each, swatches or chips; the chosen one is pressed
  function row(title, options, current, pick) {
    const r = document.createElement('div'); r.className = 'avatar-row';
    const h = document.createElement('h2'); h.textContent = title;
    const opts = document.createElement('div'); opts.className = 'avatar-opts';
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      if (o.color) { b.className = 'avatar-swatch'; b.style.background = o.color; b.setAttribute('aria-label', `${title}: ${o.name || o.color}`); }
      else { b.className = 'avatar-chip'; b.textContent = o.label; }
      b.setAttribute('aria-pressed', String(o.value === current));
      b.dataset.value = String(o.value);
      b.addEventListener('click', () => pick(o.value));
      opts.append(b);
    }
    r.append(h, opts);
    return r;
  }
  const swatches = list => list.map(c => ({ value: c, color: c }));
  const set = change => { players.setLook(key, change); render(); };

  function render() {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.p === key)));
    const look = players.look(key), bearded = (key === 'dad' || key === 'boy') && players.stage(key) === 'adult';   // Dad, and Dude from 18
    el.controls.replaceChildren(
      row('Skin', swatches(PALETTE.skin), look.skin, v => set({ skin: v })),
      row('Hair', Object.entries(HAIR).map(([value, h]) => ({ value, label: h.label })), look.hair, v => set({ hair: v })),
      row(look.hair === 'beanie' || look.hair === 'bald' ? 'Hair colour (beard and eyebrows)' : 'Hair colour', swatches(PALETTE.hair), look.hairColor, v => set({ hairColor: v })),
      row('Extras', [{ value: 'glasses', label: '👓 Glasses' }, ...(bearded ? [{ value: 'beard', label: '🧔 Beard' }] : [])], null, v => set({ [v]: !look[v] })),
      row('Top', [{ value: 'own', label: 'Their own' }, ...swatches(PALETTE.clothes)], look.top, v => set({ top: v })),
      row('Trousers', swatches(PALETTE.clothes), look.pants, v => set({ pants: v })),
      row('Shoes', swatches(PALETTE.shoes), look.shoes, v => set({ shoes: v })),
    );
    // the extras chips show as pressed when they're on
    el.controls.querySelectorAll('.avatar-chip').forEach(b => { if (b.dataset.value === 'glasses') b.setAttribute('aria-pressed', String(!!look.glasses)); if (b.dataset.value === 'beard') b.setAttribute('aria-pressed', String(!!look.beard)); });
    el.birthday.value = players.birthday(key) || '';
    const fromServer = !!(familyServer && familyServer.connected && familyServer.status && familyServer.status.ok);
    el.birthday.readOnly = fromServer;
    el.birthday.title = fromServer ? 'From the family server' : '';
    renderServer();
    el.birthday.max = new Date().toISOString().slice(0, 10);
    el.age.textContent = ageText();
    showFigure();
  }

  // the family server: a token typed in once on this device brings the real birthdays
  function renderServer() {
    if (!familyServer || !el.status) return;
    const on = familyServer.connected, st = familyServer.status;
    const when = st && st.at ? new Date(st.at).toLocaleString([], { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    el.status.textContent = !on ? 'Not connected: birthdays are typed in here.'
      : !st ? 'Connected, asking for the birthdays…'
      : st.ok ? `Connected · ${st.message} (${when})` : `${st.message} (${when})`;
    el.connectRow.hidden = on && !!st && st.ok;
    el.disconnect.hidden = !on;
  }

  function ageText() {
    const b = players.birthday(key), age = players.age(key), stage = STAGE_NAMES[players.stage(key)];
    if (age === null) return `No birthday yet · ${NAMES[key]} plays as a ${stage}`;
    const d = daysToBirthday(b);
    const next = d === 0 ? 'Happy birthday today! 🎂' : `birthday in ${d} day${d === 1 ? '' : 's'}`;
    return `${age} years old · a ${stage} · ${next}`;
  }

  function open(who = days.character) {
    key = who in NAMES ? who : 'dad';
    S.avatar = true; el.box.hidden = false;
    render();
    const tab = tabs.find(t => t.dataset.p === key);
    if (tab && tab.focus) tab.focus();
    if (!raf && globalThis.requestAnimationFrame) raf = globalThis.requestAnimationFrame(loop);
  }

  function close() {
    S.avatar = false; el.box.hidden = true;
    if (el.open && el.open.focus) el.open.focus();
  }

  tabs.forEach(t => t.addEventListener('click', () => { key = t.dataset.p; render(); }));
  if (familyServer && el.connect) {
    el.connect.addEventListener('click', async () => {
      if (!el.token.value.trim()) return;
      el.status.textContent = 'Connecting…';
      await familyServer.connect(el.token.value);
      el.token.value = '';
      render();
      if (days.replanIfUntouched) days.replanIfUntouched();
    });
    el.disconnect.addEventListener('click', () => { familyServer.disconnect(); render(); });
  }
  el.birthday.addEventListener('change', () => { players.setBirthday(key, el.birthday.value); render(); });
  el.reset.addEventListener('click', () => { players.resetLook(key); render(); });
  el.done.addEventListener('click', close);
  if (el.open) el.open.addEventListener('click', () => open());
  globalThis.addEventListener('keydown', e => {
    if (!S.avatar) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);

  return { open, close, render, get key() { return key; }, select(who) { key = who; render(); } };
}
