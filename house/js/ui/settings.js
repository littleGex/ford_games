// The "Jobs, and sharing" card from the home screen: switch groups of jobs on or off (settings.js), and share a
// link that copies the family's names, looks, birthdays and these switches to another phone or tablet. Also
// the card that asks first when such a link is opened here.
import { S } from '../state.js';
import { DEFAULT_NAMES, NAMES, showNames } from '../names.js';
import { JOB_GROUPS, applyShare, linkCode, readShareCode, shareCode } from '../settings.js';

export function createSettingsCard(ctx) {
  const { players, settings, days, hud } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('settings'), list: $('settingsJobs'), done: $('settingsDone'), open: $('settingsBtn'), share: $('shareBtn'), link: $('shareLink'), status: $('shareStatus'),
               ask: $('shareImport'), askList: $('shareImportList'), yes: $('shareYes'), no: $('shareNo') };
  let changed = false, pending = null;

  function render() {
    el.list.replaceChildren(...JOB_GROUPS.map(g => {
      const li = document.createElement('li'), b = document.createElement('button'), on = settings.isOn(g.id);
      b.type = 'button'; b.className = 'settings-switch'; b.dataset.group = g.id;
      b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(on));
      const icon = document.createElement('span'), label = document.createElement('span'), state = document.createElement('span');
      icon.className = 'settings-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = g.icon;
      label.className = 'settings-label'; label.textContent = g.label;
      state.className = 'settings-state'; state.textContent = on ? 'On' : 'Off';
      b.append(icon, label, state);
      b.addEventListener('click', () => { settings.set(g.id, !settings.isOn(g.id)); changed = true; render(); });
      li.append(b);
      return li;
    }));
  }

  function linkUrl() {
    const l = globalThis.location;
    return `${l.origin}${l.pathname}#family=${shareCode(players, settings)}`;
  }

  async function share() {
    const url = linkUrl();
    el.link.value = url; el.link.hidden = false;
    try {
      if (navigator.share) { await navigator.share({ title: 'Ford House: our family settings', url }); el.status.textContent = 'Shared. Open the link on the other phone or tablet.'; return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); el.status.textContent = 'Link copied. Send it to yourself and open it on the other phone or tablet.'; }
    catch (e) { el.status.textContent = 'Copy the link below and open it on the other phone or tablet.'; if (el.link.select) el.link.select(); }
  }

  function open() {
    S.settings = true; el.box.hidden = false; changed = false;
    el.link.hidden = true; el.link.value = ''; el.status.textContent = '';
    render();
    const first = el.list.querySelector && el.list.querySelector('button');
    if (first && first.focus) first.focus();
  }

  function close() {
    if (el.box.hidden) return;
    S.settings = false; el.box.hidden = true;
    if (changed) { changed = false; afterChange(); }
    if (el.open && el.open.focus) el.open.focus();
  }

  /** Jobs were switched on or off, or settings came in a link: today is planned again if nothing's been done
   *  yet (otherwise it shows from tomorrow); the names show everywhere. */
  function afterChange() {
    showNames();
    if (!days.replanIfUntouched({ force: true })) days.retitle();
    if (ctx.home && ctx.home.isOpen) ctx.home.render();
  }

  // --- a link opened here: ask before using it
  function checkLink() {
    const code = linkCode();
    if (!code) return false;
    const l = globalThis.location;
    if (globalThis.history && history.replaceState) history.replaceState(null, '', l.pathname + l.search);   // the code doesn't stay in the address
    pending = readShareCode(code);
    if (!pending) { hud.toast("That link didn't have any family settings in it"); return false; }
    const lines = Object.entries(pending.players).map(([k, p]) => {
      const now = NAMES[k], next = p.name || DEFAULT_NAMES[k];
      return `${now === next ? now : `${now} → ${next}`}${p.birthday ? ', with a birthday' : ''}`;
    });
    const off = JOB_GROUPS.filter(g => pending.off.includes(g.id)).map(g => g.label);
    lines.push(off.length ? `Switched off: ${off.join(', ')}` : 'All jobs on');
    el.askList.replaceChildren(...lines.map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
    S.settings = true; el.ask.hidden = false;
    if (el.yes.focus) el.yes.focus();
    return true;
  }
  function answer(use) {
    if (use && pending) { applyShare(pending, players, settings); hud.toast('The family settings are on this device now'); afterChange(); }
    pending = null; el.ask.hidden = true; S.settings = false;
  }

  el.done.addEventListener('click', close);
  if (el.open) el.open.addEventListener('click', open);
  el.share.addEventListener('click', share);
  el.yes.addEventListener('click', () => answer(true));
  el.no.addEventListener('click', () => answer(false));
  globalThis.addEventListener('keydown', e => {
    if (!S.settings || e.key !== 'Escape') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!el.ask.hidden) answer(false); else close();
  }, true);

  return { open, close, render, checkLink, answer, linkUrl, get isOpen() { return !el.box.hidden; } };
}
