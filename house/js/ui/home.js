// The home screen: shows when the game opens and from the ☰ button. Carry on with today, pick who's
// playing, see the missions (coming soon), start over, or go back to Game Zone. The game is paused while
// it's open (nothing moves, no surprises turn up, timers don't run).
import { S } from '../state.js';
import { FAMILY } from '../characters/family.js';

export function createHome({ board, clock, days }) {
  const $ = id => document.getElementById(id);
  const el = { box: $('home'), sub: $('homeSub'), play: $('homePlay'), menu: $('menuBtn'), restartYes: $('gameRestartYes') };

  function render() {
    const jobs = board.jobs.filter(j => !j.event), done = jobs.filter(board.finished).length;
    const who = (FAMILY[days.character] || FAMILY.dad).label;
    const fresh = days.day === 1 && done === 0;
    el.play.textContent = S.dayOver ? `On to day ${days.day + 1}` : fresh ? 'Start day 1' : `Carry on with day ${days.day}`;
    el.sub.textContent = `Day ${days.day} · playing as ${who} · ${done} of ${jobs.length} jobs done`;
  }

  function open() {
    render();
    S.menuOpen = true;
    el.box.hidden = false;
    el.play.focus();
  }

  function close() {
    S.menuOpen = false;
    el.box.hidden = true;
    clock.oldTime = (globalThis.performance || Date).now();   // the time spent here doesn't count in the game
  }

  el.play.addEventListener('click', close);
  el.menu.addEventListener('click', open);
  el.restartYes.addEventListener('click', () => setTimeout(close));   // starting over goes straight to day 1
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !S.sorting) { e.preventDefault(); S.menuOpen ? close() : open(); }
  });

  return { open, close, render, get isOpen() { return S.menuOpen; } };
}
