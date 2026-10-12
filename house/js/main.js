// Ford House: walk around the house and do the jobs.
// This file wires everything together and runs the frame loop.
import * as THREE from 'three';
import { CAMERA } from './config.js';
import { S } from './state.js';
import { createStage } from './core/stage.js';
import { createInput } from './core/input.js';
import { buildWorld } from './world/index.js';
import { roomAt } from './world/rooms.js';
import { createItems } from './items.js';
import { createPlayer } from './characters/player.js';
import { createHud } from './ui/hud.js';
import { createJobBoard } from './jobs/board.js';
import { createPower } from './systems/power.js';
import { createSitting } from './systems/sitting.js';
import { createMowing } from './systems/mowing.js';
import { createHoovering } from './systems/hoovering.js';
import { createCharging } from './systems/charging.js';
import { createDeliveries } from './systems/deliveries.js';
import { createDragon } from './systems/dragon.js';
import { createTrimming } from './systems/trimming.js';
import { createPlant } from './systems/plant.js';
import { createDays } from './days/days.js';
import { createLevels } from './systems/levels.js';
import { createLoft } from './systems/loft.js';
import { createWeather } from './systems/weather.js';
import { createWiping } from './systems/wiping.js';
import { createSorting } from './ui/sorting.js';
import { createHome } from './ui/home.js';
import { createMissions } from './missions/missions.js';
import { preventZoom } from './core/nozoom.js';
import { createSweeping } from './systems/sweeping.js';
import { createSeasonal } from './systems/seasonal.js';
import { currentSeason } from './seasons.js';
import { createWaiting } from './systems/waiting.js';

const stage = createStage(document.getElementById('scene'));
const world = buildWorld(stage.scene);
const items = createItems(stage.scene, world.upstairs, world.attic);
const player = createPlayer(stage.scene, items);
const hud = createHud();
const board = createJobBoard({ scene: stage.scene, items, hud, levels: [stage.scene, world.upstairs, world.attic] });

const clock = new THREE.Clock();

// ctx is what job hooks and systems can reach
let yaw = 0, yawTarget = 0, nearest = null;
const ctx = { S, stage, world, items, player, hud, board, clock };
ctx.season = currentSeason();   // spring, summer, autumn or winter, from the date (or ?season=)
ctx.view = { reset() { yaw = yawTarget = 0; } };
ctx.power = createPower(ctx);
ctx.sitting = createSitting(ctx);
ctx.charging = createCharging(ctx);
ctx.deliveries = createDeliveries(ctx);
ctx.dragon = createDragon(ctx);
ctx.trimming = createTrimming(ctx);
ctx.plant = createPlant(ctx);
ctx.mowing = createMowing(ctx);
ctx.hoovering = createHoovering(ctx);
ctx.levels = createLevels(ctx);
ctx.loft = createLoft(ctx);
ctx.weather = createWeather(ctx);
ctx.wiping = createWiping(ctx);
ctx.sorting = createSorting(ctx);
ctx.sweeping = createSweeping(ctx);
ctx.seasonal = createSeasonal(ctx, ctx.season);
ctx.waiting = createWaiting(ctx);
board.setContext(ctx);
ctx.days = createDays(ctx);
const systems = [ctx.power, ctx.deliveries, ctx.dragon, ctx.mowing, ctx.hoovering, ctx.sitting, ctx.charging, ctx.waiting, ctx.plant, ctx.days, ctx.levels, ctx.loft, ctx.weather, ctx.sweeping, ctx.trimming, ctx.seasonal];

// controls
preventZoom();
const turnView = () => { yawTarget += Math.PI / 2; };
const doAction = () => {
  if (S.dayOver || S.sorting || S.menuOpen) return;
  if (S.wiping) { ctx.wiping.stop(); return; }
  board.act(nearest);
};
const input = createInput({
  stick: document.getElementById('stick'), knob: document.getElementById('knob'),
  onAction: doAction, onTurn: turnView,
  onFirstInput: () => { S.started = true; hud.hideHint(); },
});
hud.onAction(doAction);
document.getElementById('rotBtn').addEventListener('click', turnView);
const markCharacter = hud.bindCharacterButtons(key => {
  if (S.mission) return;   // a mission is played as one of the kids
  player.setCharacter(key); ctx.days.setCharacter(key);
});
player.setCharacter(ctx.days.character);
markCharacter(ctx.days.character);
ctx.days.start();
ctx.home = createHome(ctx);
ctx.missions = createMissions(ctx);
systems.push(ctx.missions);
ctx.home.open();   // the game opens on the home screen

let drawn = false, room = null;
function frame() {
  if (S.menuOpen && drawn) { requestAnimationFrame(frame); return; }   // paused behind the home screen (after drawing the house once)
  drawn = true;
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  const axis = input.axis();
  yaw += (yawTarget - yaw) * Math.min(1, dt * (S.reduceMotion ? 60 : 8));

  let walking = false;
  if (S.dayOver) { /* the Day complete screen is up */ }
  else if (S.sitting) { if (axis.len > 0.3) ctx.sitting.standUp(); }
  else if (S.wiping || S.sorting) { /* wiping a window uses the stick; sorting has its own card */ }
  else if (axis.len > 0.08) walking = player.stepFromInput(axis, yaw, dt);
  player.animate(dt, walking);
  if (S.wiping) ctx.wiping.feed(axis, dt);

  for (const sys of systems) sys.update(dt, time);

  const pos = player.group.position;
  room = roomAt(pos.x, pos.z, S.level, room);
  hud.setRoom(room);
  nearest = S.dayOver || S.sorting || S.wiping ? null : board.nearestAction(pos);
  hud.setAction(S.wiping ? 'Stop wiping' : nearest ? nearest.step.label : null);
  hud.banner(S.dayOver ? null : ctx.weather.banner() || ctx.deliveries.banner() || ctx.wiping.banner() || ctx.sitting.banner());
  board.updateMarkers(time);

  shiftView(dt);
  stage.camera.position.set(pos.x + Math.sin(yaw) * CAMERA.distance, pos.y + CAMERA.height, pos.z + Math.cos(yaw) * CAMERA.distance);
  stage.camera.lookAt(pos.x, pos.y + CAMERA.lookY, pos.z);
  stage.renderer.render(stage.scene, stage.camera);
  requestAnimationFrame(frame);
}

// Keep the player clear of the job list in the top right: on a landscape screen the picture slides left
// by half the list's width, so what's under the list is next door or the garden (depending on the view
// rotation) rather than the room you're in. It slides back when the list is folded up.
const taskPanel = document.getElementById('taskPanel');
let shift = 0, shiftTarget = 0, shiftW = 0, shiftH = 0, measured = 0;
function shiftView(dt) {
  const w = window.innerWidth, h = window.innerHeight;
  if (--measured <= 0 && taskPanel && taskPanel.getBoundingClientRect) {   // measuring every frame would cost layout time
    measured = 10;
    shiftTarget = w > h ? Math.min(taskPanel.getBoundingClientRect().width / 2, w * 0.2) : 0;
  }
  if (Math.abs(shiftTarget - shift) < 0.5 && w === shiftW && h === shiftH) return;
  shift = Math.abs(shiftTarget - shift) < 0.5 ? shiftTarget : shift + (shiftTarget - shift) * Math.min(1, dt * 6);
  shiftW = w; shiftH = h;
  stage.camera.setViewOffset(w, h, shift, 0, w, h);
}
requestAnimationFrame(frame);

// handy for debugging in the browser console: window.house.board.jobs, window.house.days.plan(['mow'])...
window.house = ctx;
