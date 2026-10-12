// Minimal stand-in for three.js so the game logic can run in Node without a browser or GPU.
const any = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : (k === 'then' ? undefined : any), apply: () => any, construct: () => any, set: () => true });
export class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } setScalar(s) { return this.set(s, s, s); }
  copy(v) { return this.set(v.x, v.y, v.z); } clone() { return new Vector3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  lerp(v, f) { this.x += (v.x - this.x) * f; this.y += (v.y - this.y) * f; this.z += (v.z - this.z) * f; return this; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  toArray() { return [this.x, this.y, this.z]; } fromArray(a) { return this.set(a[0], a[1], a[2]); } }
class Euler { constructor() { this.x = 0; this.y = 0; this.z = 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
export class Color { constructor(c) { this.v = c; } set(c) { this.v = c; return this; } setRGB() { return this; } lerp() { return this; } copy(c) { this.v = c.v; return this; } }
export class Object3D { constructor() { Object.defineProperties(this, { position: { value: new Vector3(), enumerable: true }, rotation: { value: new Euler(), enumerable: true }, scale: { value: new Vector3(1, 1, 1), enumerable: true } });   // read-only, as in three.js
    this.children = []; this.parent = null; this.visible = true; this.userData = {}; this.name = ''; }
  add(...os) { for (const o of os) { if (o.parent) o.parent.remove(o); o.parent = this; this.children.push(o); } return this; }
  remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); o.parent = null; return this; }
  attach(o) { return this.add(o); }
  traverse(f) { f(this); this.children.forEach(c => c.traverse(f)); }
  getObjectByName(n) { if (this.name === n) return this; for (const c of this.children) { const r = c.getObjectByName(n); if (r) return r; } return undefined; }
  getWorldPosition(v) { let o = this, x = 0, y = 0, z = 0; while (o) { x += o.position.x; y += o.position.y; z += o.position.z; o = o.parent; } return v.set(x, y, z); }
  localToWorld(v) { const w = this.getWorldPosition(new Vector3()); return v.add(w); }
  lookAt() {} updateProjectionMatrix() {} }
export class Group extends Object3D { constructor() { super(); this.isGroup = true; } }
export class Scene extends Object3D { constructor() { super(); this.background = null; this.fog = null; } }
export class Mesh extends Object3D { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } clone() { const m = new Mesh(this.geometry, this.material); m.position.copy(this.position); return m; } }
export class InstancedMesh extends Mesh { constructor(g, m, n) { super(g, m); this.count = n; this.instanceMatrix = {}; this.instanceColor = {}; } setMatrixAt() {} setColorAt() {} }
class Geo { translate() { return this; } dispose() {} }
export class BoxGeometry extends Geo {} export class SphereGeometry extends Geo {} export class CylinderGeometry extends Geo {}
export class TorusGeometry extends Geo {} export class PlaneGeometry extends Geo {} export class TubeGeometry extends Geo {}
export class RingGeometry extends Geo {} export class OctahedronGeometry extends Geo {} export class ConeGeometry extends Geo {} export class CircleGeometry extends Geo {}
class Mat { constructor(o = {}) { Object.assign(this, o); this.color = new Color(o.color); this.emissive = new Color(o.emissive); } }
export class MeshStandardMaterial extends Mat {} export class MeshBasicMaterial extends Mat {}
export class CanvasTexture { constructor() { this.repeat = { set() {} }; this.offset = { set() {} }; } clone() { return new CanvasTexture(); } }
class Light extends Object3D { constructor(c, i = 1) { super(); this.intensity = i; this.target = new Object3D(); this.shadow = any; } }
export class HemisphereLight extends Light { constructor(a, b, i) { super(a, i); } }
export class DirectionalLight extends Light {} export class PointLight extends Light {} export class SpotLight extends Light {}
export class PerspectiveCamera extends Object3D { setViewOffset(fw, fh, x, y, w, h) { this.view = { fullWidth: fw, fullHeight: fh, offsetX: x, offsetY: y, width: w, height: h }; } updateProjectionMatrix() {} }
export class Fog { constructor(c) { this.color = new Color(c); } }
export class Matrix4 { makeScale() { return this; } setPosition() { return this; } }
export class Curve {}
export class CatmullRomCurve3 { constructor(p) { this.points = p; } }
export class WebGLRenderer { constructor() { this.shadowMap = {}; this.frames = 0; } setPixelRatio() {} setSize() {} render() { this.frames++; } }
export class Clock { constructor() { this.elapsedTime = 0; } getDelta() { this.elapsedTime += 0.05; return 0.05; } }
export const PCFSoftShadowMap = 2, RepeatWrapping = 1000, DoubleSide = 2;
