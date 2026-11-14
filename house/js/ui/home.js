// The home screen: shows when the game opens and from the ☰ button. Carry on with today, pick who's
// playing, start a mission (the school run), start over, or go back to Game Zone. The game is paused while
// it's open (nothing moves, no surprises turn up, timers don't run).
import { S } from '../state.js';
import { NAMES, nameOf, showNames } from '../names.js';
import { clockText, MISSIONS } from '../missions/missions.js';
import { DESIGNS } from '../systems/printing.js';
import { currentHolidays, today } from '../holidays.js';
import { dateKey } from '../elf.js';

export function createHome(ctx) {
  const { board, clock, days } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('home'), sub: $('homeSub'), play: $('homePlay'), menu: $('menuBtn'), restartYes: $('gameRestartYes') };

  /** The elf arrives: offered from 1 to 23 December (Christmas on) until he's come this Advent. */
  function elfOffered() {
    const d = today(), tags = ctx.settings ? ctx.settings.filterTags(currentHolidays()) : currentHolidays();
    return d.getMonth() === 11 && d.getDate() <= 23 && tags.includes('advent') && !!ctx.elfLog && !ctx.elfLog.hasArrived(dateKey(d));
  }

  /** The elf says goodbye: Christmas Eve, Christmas on, once he's come this Advent; a button for each child still to say it. */
  function goodbyeFor() {
    const d = today(), day = dateKey(d), tags = ctx.settings ? ctx.settings.filterTags(currentHolidays()) : currentHolidays();
    if (!ctx.elfLog || d.getMonth() !== 11 || d.getDate() !== 24 || !tags.includes('advent') || !ctx.elfLog.hasArrived(day)) return [];
    return ['girl', 'boy'].filter(who => !ctx.elfLog.saidGoodbye(who, day));
  }

  function render() {
    const elfCard = document.getElementById('missionElf');
    if (elfCard) elfCard.hidden = !elfOffered();
    showNames();   // the players' names on the buttons and mission cards
    const bye = document.getElementById('missionElfGoodbye');
    if (bye) {   // after showNames, which shows every child's button
      const kids = goodbyeFor();
      bye.hidden = !kids.length;
      bye.querySelectorAll('[data-kid]').forEach(b => { b.dataset.played = kids.includes(b.dataset.kid) ? '' : 'yes'; });
      showNames(bye);
    }
    // the best result for each mission, under its card
    document.querySelectorAll('.mission-best').forEach(b => {
      const id = b.dataset && b.dataset.best, who = ['girl', 'boy', 'dad', 'mum'].map(k => [k, NAMES[k]]);
      if (!id) return;
      const ids = id.split(' ');   // a card can show more than one mission (the office: Dad's and Mum's)
      const best = ctx.missions ? ids.flatMap(i => who.map(([k, name]) => [name, ctx.missions.best(i, k)])).filter(([, r]) => r) : [];
      b.textContent = best.map(([name, r]) => r.made
        ? `Made so far: ${r.made.map(d => (DESIGNS.find(x => x.id === d) || { name: d }).name).join(', ')}`   // 3D printing
        : `${name} ${'★'.repeat(r.stars)} ${clockText(r.minutes)}`).join(' · ');
    });
    if (S.mission && !S.mission.done) {
      el.play.textContent = `Back to ${S.mission.id === 'schoolRun' ? 'the school run' : MISSIONS[S.mission.id].title.replace(/^./, c => c.toLowerCase())}`;
      el.sub.textContent = 'On a mission · today\'s jobs are waiting';
      return;
    }
    const jobs = board.jobs.filter(j => !j.event), done = jobs.filter(board.finished).length;
    const who = nameOf(days.character);
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
  // the missions' play buttons ("P" / "Dude")
  document.querySelectorAll('[data-mission]').forEach(b => b.addEventListener('click', () => ctx.missions.start(b.dataset.mission, b.dataset.kid)));
  el.menu.addEventListener('click', open);
  el.restartYes.addEventListener('click', () => setTimeout(close));   // starting over goes straight to day 1
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !S.sorting && !S.avatar && !S.calendar && !S.settings && !S.elfCard) { e.preventDefault(); S.menuOpen ? close() : open(); }
  });

  return { open, close, render, get isOpen() { return S.menuOpen; } };
}
