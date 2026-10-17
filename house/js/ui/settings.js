// The "Rooms, jobs, and sharing" card from the home screen: who sleeps where, switch groups of jobs on or off
// (settings.js), whether the family server keeps them the same on every device (settingsync.js), and share a
// link that copies the family's names, looks, birthdays and these settings to another phone or tablet. Also
// the card that asks first when such a link is opened here.
import { S } from '../state.js';
import { DEFAULT_NAMES, NAMES, nameOf, showNames } from '../names.js';
import { kidIn } from '../pack/kidrooms.js';
import { JOB_GROUPS, applyShare, linkCode, readShareCode, shareCode } from '../settings.js';

export function createSettingsCard(ctx) {
  const { players, settings, days, hud } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('settings'), list: $('settingsJobs'), rooms: $('settingsRooms'), swap: $('swapRooms'), done: $('settingsDone'), open: $('settingsBtn'), share: $('shareBtn'), sync: $('syncStatus'), link: $('shareLink'), status: $('shareStatus'),
               ask: $('shareImport'), askList: $('shareImportList'), yes: $('shareYes'), no: $('shareNo') };
  let changed = false, pending = null;

  function render() {
    // who sleeps where
    const first = kidIn('first'), attic = kidIn('attic');
    el.rooms.textContent = `${nameOf(first)} sleeps in the room on the first floor, ${nameOf(attic)} in the attic room.`;
    el.swap.textContent = `Swap: ${nameOf(attic)} downstairs, ${nameOf(first)} in the attic`;
    // the family server keeps them the same on every device with the game token
    const sync = ctx.settingsSync;
    if (el.sync) {
      const st = sync && sync.connected && sync.status;
      el.sync.textContent = !sync || !sync.connected
        ? 'With the game token (in the names, looks and birthdays card), these settings and the names and looks stay the same on every phone and tablet.'
        : st ? `Family server: ${st.message} (${new Date(st.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
        : 'Family server: keeping these the same on every device with the game token.';
      el.sync.classList.toggle('bad', !!(st && !st.ok));
    }
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
    if (!days.replanIfUntouched({ force: true })) days.rebuild();   // the jobs as they are now (names, rooms)
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
    if (pending.swapRooms !== settings.roomsSwapped()) lines.push(pending.swapRooms ? `${NAMES.girl} and ${NAMES.boy} swap rooms` : `${NAMES.girl} and ${NAMES.boy} back in their usual rooms`);
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
  el.swap.addEventListener('click', () => { settings.setRoomsSwapped(!settings.roomsSwapped()); changed = true; render(); });
  el.yes.addEventListener('click', () => answer(true));
  el.no.addEventListener('click', () => answer(false));
  globalThis.addEventListener('keydown', e => {
    if (!S.settings || e.key !== 'Escape') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!el.ask.hidden) answer(false); else close();
  }, true);

  /** Settings came from the family server: the same as a change made here. */
  function refresh() { afterChange(); if (!el.box.hidden) render(); }

  return { open, close, render, refresh, checkLink, answer, linkUrl, get isOpen() { return !el.box.hidden; } };
}
