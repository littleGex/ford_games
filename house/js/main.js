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
import { createJobs } from './jobs/jobs.js';
import { createPower } from './systems/power.js';
import { createSitting } from './systems/sitting.js';
import { createMowing } from './systems/mowing.js';
import { createHoovering } from './systems/hoovering.js';
import { createCharging } from './systems/charging.js';
import { createDeliveries } from './systems/deliveries.js';
import { createPlant } from './systems/plant.js';

const stage = createStage(document.getElementById('scene'));
const world = buildWorld(stage.scene);
const items = createItems(stage.scene);
const player = createPlayer(stage.scene, items);
const hud = createHud();
const board = createJobBoard({ scene: stage.scene, items, hud });

// ctx is what job hooks and systems can reach
const ctx = { S, stage, world, items, player, hud, board };
ctx.power = createPower(ctx);
ctx.sitting = createSitting(ctx);
ctx.charging = createCharging(ctx);
ctx.deliveries = createDeliveries(ctx);
ctx.plant = createPlant(ctx);
const systems = [ctx.power, ctx.deliveries, createMowing(ctx), createHoovering(ctx), ctx.sitting, ctx.charging, ctx.plant];
board.setContext(ctx);
createJobs().forEach(job => board.add(job));

// controls
let yaw = 0, yawTarget = 0, nearest = null;
const turnView = () => { yawTarget += Math.PI / 2; };
const doAction = () => board.act(nearest);
const input = createInput({
  stick: document.getElementById('stick'), knob: document.getElementById('knob'),
  onAction: doAction, onTurn: turnView,
  onFirstInput: () => { S.started = true; hud.hideHint(); },
});
hud.onAction(doAction);
document.getElementById('rotBtn').addEventListener('click', turnView);
hud.bindCharacterButtons(key => player.setCharacter(key));
player.setCharacter('dad');

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  const axis = input.axis();
  yaw += (yawTarget - yaw) * Math.min(1, dt * (S.reduceMotion ? 60 : 8));

  let walking = false;
  if (S.sitting) { if (axis.len > 0.3) ctx.sitting.standUp(); }
  else if (axis.len > 0.08) walking = player.stepFromInput(axis, yaw, dt);
  player.animate(dt, walking);

  for (const sys of systems) sys.update(dt, time);

  const pos = player.group.position;
  hud.setRoom(roomAt(pos.x, pos.z));
  nearest = board.nearestAction(pos);
  hud.setAction(nearest ? nearest.step.label : null);
  hud.banner(ctx.deliveries.banner() || ctx.sitting.banner());
  board.updateMarkers(time);

  stage.camera.position.set(pos.x + Math.sin(yaw) * CAMERA.distance, CAMERA.height, pos.z + Math.cos(yaw) * CAMERA.distance);
  stage.camera.lookAt(pos.x, CAMERA.lookY, pos.z);
  stage.renderer.render(stage.scene, stage.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// handy for debugging in the browser console: window.house.board.jobs, window.house.S ...
window.house = ctx;
