import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { FBXLoader } from './vendor/loaders/FBXLoader.js';

const canvas = document.getElementById('studioTour');
const stage = document.querySelector('[data-tour-stage]');
const loading = document.querySelector('[data-tour-loading]');
const bar = document.querySelector('[data-load-bar]');
const viewButtons = [...document.querySelectorAll('[data-view]')];
const autoButton = document.querySelector('[data-auto]');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
const MAX_DPR = 1.35;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181b1c);
scene.fog = new THREE.Fog(0x181b1c, 72, 170);
scene.environment = makeReflectionEnvironment();

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 420);
camera.position.set(42, 26, 52);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 4, 0);
controls.minDistance = 12;
controls.maxDistance = 110;
controls.maxPolarAngle = Math.PI * 0.49;
controls.screenSpacePanning = true;

const pointerState = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  active: false
};

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const nx = (event.clientX - rect.left) / rect.width;
  const ny = (event.clientY - rect.top) / rect.height;
  pointerState.targetX = (nx - 0.5) * 2;
  pointerState.targetY = (ny - 0.5) * 2;
  pointerState.active = true;
  if (stage) {
    stage.style.setProperty('--tour-glow-x', `${Math.round(nx * 100)}%`);
    stage.style.setProperty('--tour-glow-y', `${Math.round(ny * 100)}%`);
  }
}, { passive: true });

canvas.addEventListener('pointerleave', () => {
  pointerState.targetX = 0;
  pointerState.targetY = 0;
  pointerState.active = false;
}, { passive: true });

const setProgress = (value) => {
  if (bar) bar.style.setProperty('--load-progress', `${Math.round(value * 100)}%`);
};
setProgress(0.18);

const STUDIO = { w: 34.5, l: 63.9, h: 16 };
const LED = {
  h: 8,
  flat: 20,
  curved: 36.5,
  side: 3.5
};
LED.total = LED.flat + LED.curved + LED.side;
LED.radius = LED.curved / Math.PI;
LED.arcCenterX = 0;
LED.arcCenterZ = -(STUDIO.l / 2 - LED.radius);

const CEILING = {
  w: 21,
  d: 15,
  y: 8.6,
  tile: 0.5,
  x: LED.arcCenterX,
  z: LED.arcCenterZ
};

const VEHICLE = {
  length: 5.21,
  width: 1.96,
  height: 1.82,
  source: './assets/models/mercedes-gls-580.fbx'
};

const studioGroup = new THREE.Group();
const ledGroup = new THREE.Group();
scene.add(studioGroup, ledGroup);
let mainLedPath = [];

function makeGridTexture(size, cells, lineColor, baseColor, alpha) {
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = size;
  gridCanvas.height = size;
  const ctx = gridCanvas.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = lineColor.replace('ALPHA', alpha);
  ctx.lineWidth = 1;
  const step = size / cells;
  for (let i = 0; i <= cells; i += 1) {
    const p = Math.round(i * step) + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(gridCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFloorTexture(size) {
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = size;
  floorCanvas.height = size;
  const ctx = floorCanvas.getContext('2d');
  ctx.fillStyle = '#383c39';
  ctx.fillRect(0, 0, size, size);

  const softWash = ctx.createLinearGradient(0, 0, size, size);
  softWash.addColorStop(0, 'rgba(255,255,255,0.045)');
  softWash.addColorStop(0.55, 'rgba(255,255,255,0.015)');
  softWash.addColorStop(1, 'rgba(0,0,0,0.055)');
  ctx.fillStyle = softWash;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(floorCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeReflectionEnvironment() {
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 512;
  envCanvas.height = 256;
  const ctx = envCanvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, envCanvas.height);
  base.addColorStop(0, '#273236');
  base.addColorStop(0.32, '#111719');
  base.addColorStop(0.52, '#f0f3ef');
  base.addColorStop(0.68, '#131918');
  base.addColorStop(1, '#303532');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, envCanvas.width, envCanvas.height);

  const ledBand = ctx.createLinearGradient(0, 0, envCanvas.width, 0);
  ledBand.addColorStop(0, 'rgba(115,160,170,0.15)');
  ledBand.addColorStop(0.42, 'rgba(235,244,244,0.58)');
  ledBand.addColorStop(0.62, 'rgba(152,205,214,0.42)');
  ledBand.addColorStop(1, 'rgba(18,24,26,0.18)');
  ctx.fillStyle = ledBand;
  ctx.fillRect(0, 114, envCanvas.width, 18);

  const texture = new THREE.CanvasTexture(envCanvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLEDMaterial(texture, intensity) {
  if (texture.isVideoTexture) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: true
    });
    const grade = {
      brightness: 0.78,
      contrast: 1.36,
      gamma: 1.12,
      saturation: 1.12
    };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uLedBrightness = { value: grade.brightness };
      shader.uniforms.uLedContrast = { value: grade.contrast };
      shader.uniforms.uLedGamma = { value: grade.gamma };
      shader.uniforms.uLedSaturation = { value: grade.saturation };
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        uniform float uLedBrightness;
        uniform float uLedContrast;
        uniform float uLedGamma;
        uniform float uLedSaturation;

        void main() {
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          sampledDiffuseColor.rgb = pow( max( sampledDiffuseColor.rgb, vec3( 0.0 ) ), vec3( uLedGamma ) );
          sampledDiffuseColor.rgb = ( sampledDiffuseColor.rgb - vec3( 0.5 ) ) * uLedContrast + vec3( 0.5 );
          float ledLuma = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
          sampledDiffuseColor.rgb = mix( vec3( ledLuma ), sampledDiffuseColor.rgb, uLedSaturation );
          sampledDiffuseColor.rgb *= uLedBrightness;
          sampledDiffuseColor.rgb = clamp( sampledDiffuseColor.rgb, 0.0, 1.0 );
          diffuseColor *= sampledDiffuseColor;
        #endif
        `
      );
    };
    window.__studioVLedWallGrade = grade;
    return material;
  }

  return new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    color: texture.isVideoTexture ? 0xffffff : 0x071116,
    emissive: new THREE.Color(texture.isVideoTexture ? 0xffffff : 0x65aebe),
    emissiveIntensity: intensity,
    metalness: 0.05,
    roughness: 0.7,
    side: THREE.DoubleSide
  });
}

function makeLedVideoTexture() {
  const sources = [
    './assets/video/260121-test01-videostitchstudio-web.mp4',
    './assets/video/short2-web.mp4'
  ];
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  window.__studioVLedWallVideo = video;

  let sourceIndex = 0;
  const playVideo = () => video.play().catch(() => {});
  const loadSource = () => {
    video.src = sources[sourceIndex];
    window.__studioVLedWallVideoFile = sources[sourceIndex];
    video.load();
  };

  video.addEventListener('canplay', playVideo);
  video.addEventListener('error', () => {
    if (sourceIndex < sources.length - 1) {
      sourceIndex += 1;
      loadSource();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else playVideo();
  });
  canvas.addEventListener('pointerdown', playVideo, { once: true });

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  fitLedVideoTexture(texture, { width: 3000, height: 1000 });
  video.addEventListener('loadedmetadata', () => {
    fitLedVideoTexture(texture, { width: video.videoWidth || 3000, height: video.videoHeight || 1000 });
  });

  loadSource();
  return texture;
}

function fitLedVideoTexture(texture, size) {
  const wallAspect = LED.total / LED.h;
  const videoAspect = size.width / Math.max(size.height, 1);
  const fillScale = 1.05;
  let repeatX = 1;
  let repeatY = videoAspect / wallAspect;

  if (repeatY > 1) {
    repeatY = 1;
    repeatX = wallAspect / videoAspect;
  }

  repeatX = THREE.MathUtils.clamp(repeatX / fillScale, 0.18, 1);
  repeatY = THREE.MathUtils.clamp(repeatY / fillScale, 0.18, 1);
  texture.repeat.set(repeatX, repeatY);
  texture.offset.set((1 - repeatX) * 0.5, (1 - repeatY) * 0.5);
  window.__studioVLedWallFit = {
    wallAspect,
    videoAspect,
    repeatX,
    repeatY,
    mode: 'aspect-preserving scale'
  };
}

const ledTex = makeGridTexture(512, 32, 'rgba(130,195,210,ALPHA)', '#05090c', 0.16);
ledTex.repeat.set(18, 3.5);
const ledVideoTex = makeLedVideoTexture();
const ceilingTex = makeGridTexture(512, 24, 'rgba(145,205,215,ALPHA)', '#060a0c', 0.14);
ceilingTex.repeat.set(8, 5);
const floorTex = makeFloorTexture(512);
floorTex.repeat.set(1, 1);

const materials = {
  floor: new THREE.MeshStandardMaterial({
    map: floorTex,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.04
  }),
  wall: new THREE.MeshStandardMaterial({
    color: 0x101719,
    emissive: new THREE.Color(0x182328),
    emissiveIntensity: 0.18,
    roughness: 0.95,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide
  }),
  led: makeLEDMaterial(ledVideoTex, 1.18),
  ceilingTile: makeLEDMaterial(ceilingTex, 0.64),
  ledDark: new THREE.MeshStandardMaterial({ color: 0x0f181b, emissive: 0x17282d, emissiveIntensity: 0.85, roughness: 0.36 }),
  rail: new THREE.LineBasicMaterial({ color: 0xd8d0c2, transparent: true, opacity: 0.68 }),
  person: new THREE.MeshStandardMaterial({ color: 0xd6d1c4, roughness: 0.7 }),
  vehicle: new THREE.MeshStandardMaterial({ color: 0xced7d8, roughness: 0.58, metalness: 0.16 }),
  vehicleBody: new THREE.MeshPhysicalMaterial({
    color: 0xb8bdb9,
    emissive: 0x0b0c0c,
    emissiveIntensity: 0.02,
    roughness: 0.16,
    metalness: 0.56,
    clearcoat: 1.0,
    clearcoatRoughness: 0.10,
    envMapIntensity: 2.05,
    side: THREE.DoubleSide
  }),
  vehicleGlass: new THREE.MeshPhysicalMaterial({
    color: 0x12181a,
    emissive: 0x05090a,
    emissiveIntensity: 0.10,
    roughness: 0.06,
    metalness: 0.04,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    transmission: 0.04,
    transparent: true,
    opacity: 0.62,
    envMapIntensity: 1.85,
    side: THREE.DoubleSide
  }),
  vehicleTrim: new THREE.MeshStandardMaterial({ color: 0xaeb6b8, roughness: 0.18, metalness: 0.72, envMapIntensity: 1.55, side: THREE.DoubleSide }),
  vehicleLamp: new THREE.MeshStandardMaterial({ color: 0xf6f0df, emissive: 0xf6efe2, emissiveIntensity: 0.34, roughness: 0.18, side: THREE.DoubleSide }),
  tire: new THREE.MeshStandardMaterial({ color: 0x090a0a, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide }),
  camera: new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.5, metalness: 0.2 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x28383c, emissive: 0x192a2f, emissiveIntensity: 0.85, roughness: 0.44 }),
  matteBlack: new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.88, metalness: 0.08 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8d9594, roughness: 0.46, metalness: 0.36 }),
  monitor: new THREE.MeshStandardMaterial({ color: 0x0a0c0e, emissive: 0x8fb5bd, emissiveIntensity: 0.9, roughness: 0.3 }),
  warmPanel: new THREE.MeshStandardMaterial({ color: 0xfff3da, emissive: 0xffd99a, emissiveIntensity: 1.35, roughness: 0.42 }),
  lensGlass: new THREE.MeshStandardMaterial({ color: 0x050607, emissive: 0x0d2930, emissiveIntensity: 0.35, roughness: 0.18, metalness: 0.22 })
};
materials.ceilingTile.color.setHex(0x0a2027);
materials.ceilingTile.transparent = true;
materials.ceilingTile.opacity = 0.88;

let interactiveWash = null;

function addLights() {
  scene.add(new THREE.HemisphereLight(0xf8f2e7, 0x33383a, 2.75));

  const key = new THREE.DirectionalLight(0xffffff, 2.45);
  key.position.set(30, 48, 24);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc4d6dc, 1.55);
  fill.position.set(-36, 20, 28);
  scene.add(fill);

  const ledGlow = new THREE.PointLight(0x9fbdc2, 2.4, 90, 1.8);
  ledGlow.position.set(0, 6, -12);
  scene.add(ledGlow);

  const floorWash = new THREE.PointLight(0xf4eadc, 1.55, 78, 1.7);
  floorWash.position.set(0, 7.5, LED.arcCenterZ + 14);
  scene.add(floorWash);

  const ledKickTarget = new THREE.Object3D();
  ledKickTarget.position.set(3.8, 1.2, LED.arcCenterZ + 5.4);
  scene.add(ledKickTarget);

  const ledKick = new THREE.SpotLight(0xc9e6e9, 3.4, 56, Math.PI * 0.22, 0.62, 1.25);
  ledKick.position.set(LED.arcCenterX, 4.2, LED.arcCenterZ - 1.6);
  ledKick.target = ledKickTarget;
  scene.add(ledKick);

  interactiveWash = new THREE.PointLight(0xd7e9eb, 0.0, 30, 2.0);
  interactiveWash.position.set(0, 3.2, LED.arcCenterZ + 11);
  scene.add(interactiveWash);
}

function addRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(STUDIO.w, STUDIO.l), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  studioGroup.add(floor);

  function addWall(width, height, x, z, rotY = 0) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.wall.clone());
    wall.position.set(x, height / 2, z);
    wall.rotation.y = rotY;
    studioGroup.add(wall);
  }

  addWall(STUDIO.w, STUDIO.h, 0, -STUDIO.l / 2, 0);
  addWall(STUDIO.w, STUDIO.h, 0, STUDIO.l / 2, Math.PI);
  addWall(STUDIO.l, STUDIO.h, -STUDIO.w / 2, 0, Math.PI / 2);
  addWall(STUDIO.l, STUDIO.h, STUDIO.w / 2, 0, -Math.PI / 2);

  const softBoxMat = new THREE.MeshBasicMaterial({ color: 0xf3f7f8, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  [-18, 14].forEach((z) => {
    const softBox = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.2), softBoxMat.clone());
    softBox.rotation.x = -Math.PI / 2;
    softBox.position.set(0, STUDIO.h - 0.55, z);
    studioGroup.add(softBox);
  });
}

function buildDrawingMainPath() {
  const pts = [];
  const cx = LED.arcCenterX;
  const cz = LED.arcCenterZ;
  const r = LED.radius;

  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    pts.push(new THREE.Vector3(cx - r, 0, cz + LED.flat * (1 - t)));
  }

  for (let i = 1; i <= 72; i += 1) {
    const angle = Math.PI + Math.PI * (i / 72);
    pts.push(new THREE.Vector3(
      cx + Math.cos(angle) * r,
      0,
      cz + Math.sin(angle) * r
    ));
  }

  for (let i = 1; i <= 8; i += 1) {
    const t = i / 8;
    pts.push(new THREE.Vector3(cx + r, 0, cz + LED.side * t));
  }

  return pts;
}

function buildRibbonGeometry(path, height) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const cumulative = [0];
  for (let i = 1; i < path.length; i += 1) {
    cumulative[i] = cumulative[i - 1] + path[i].distanceTo(path[i - 1]);
  }
  const total = cumulative[cumulative.length - 1];
  for (let i = 0; i < path.length; i += 1) {
    const point = path[i];
    const u = cumulative[i] / total;
    positions.push(point.x, 0, point.z, point.x, height, point.z);
    uvs.push(u, 0, u, 1);
  }
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.pathLength = total;
  return geometry;
}

function ceilingCutAt(localZ) {
  const depth = CEILING.d / 2 - localZ;
  const profile = [
    [0, 0], [7.5, 0], [9.5, 1.0], [11.0, 2.0], [12.0, 3.0],
    [12.5, 3.5], [14.0, 4.0], [14.5, 4.5], [15.0, 5.0]
  ];
  for (let i = 1; i < profile.length; i += 1) {
    const [z0, c0] = profile[i - 1];
    const [z1, c1] = profile[i];
    if (depth <= z1) {
      const t = (depth - z0) / (z1 - z0);
      return THREE.MathUtils.lerp(c0, c1, THREE.MathUtils.clamp(t, 0, 1));
    }
  }
  return 5;
}

function buildCeilingTiles() {
  const tile = CEILING.tile;
  const cols = Math.round(CEILING.w / tile);
  const rows = Math.round(CEILING.d / tile);
  const tileGeometry = new THREE.BoxGeometry(tile * 0.88, 0.1, tile * 0.88);
  const mesh = new THREE.InstancedMesh(tileGeometry, materials.ceilingTile, cols * rows);
  const dummy = new THREE.Object3D();
  let count = 0;

  for (let row = 0; row < rows; row += 1) {
    const localZ = -CEILING.d / 2 + tile * (row + 0.5);
    const cut = ceilingCutAt(localZ);
    for (let col = 0; col < cols; col += 1) {
      const localX = -CEILING.w / 2 + tile * (col + 0.5);
      const xFromLeft = localX + CEILING.w / 2;
      const inPartGap = (xFromLeft > 5 && xFromLeft < 5.5) || (xFromLeft > 15.5 && xFromLeft < 16);
      if (inPartGap || xFromLeft < cut || xFromLeft > CEILING.w - cut) continue;
      dummy.position.set(CEILING.x + localX, CEILING.y, CEILING.z + localZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(count, dummy.matrix);
      count += 1;
    }
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function buildCeilingOutline() {
  const points = [];
  const steps = Math.round(CEILING.d / CEILING.tile);
  for (let i = 0; i <= steps; i += 1) {
    const z = -CEILING.d / 2 + (CEILING.d * i) / steps;
    points.push(new THREE.Vector3(CEILING.x - CEILING.w / 2 + ceilingCutAt(z), CEILING.y + 0.08, CEILING.z + z));
  }
  for (let i = steps; i >= 0; i -= 1) {
    const z = -CEILING.d / 2 + (CEILING.d * i) / steps;
    points.push(new THREE.Vector3(CEILING.x + CEILING.w / 2 - ceilingCutAt(z), CEILING.y + 0.08, CEILING.z + z));
  }
  points.push(points[0].clone());
  return points;
}

function addLedSystem() {
  const jPath = buildDrawingMainPath();
  mainLedPath = jPath;
  const jWallGeometry = buildRibbonGeometry(jPath, LED.h);
  const jWall = new THREE.Mesh(jWallGeometry, materials.led);
  ledGroup.add(jWall);

  ledGroup.add(buildCeilingTiles());
  ledGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(buildCeilingOutline()),
    new THREE.LineBasicMaterial({ color: 0xd9e6ea, transparent: true, opacity: 0.28 })
  ));

  const guideMat = new THREE.LineBasicMaterial({ color: 0xd9e6ea, transparent: true, opacity: 0.10 });
  const addCeilingPartGuide = (x, width) => {
    const left = x - width / 2;
    const right = x + width / 2;
    const points = [
      new THREE.Vector3(left, CEILING.y + 0.18, CEILING.z - CEILING.d / 2),
      new THREE.Vector3(right, CEILING.y + 0.18, CEILING.z - CEILING.d / 2),
      new THREE.Vector3(right, CEILING.y + 0.18, CEILING.z + CEILING.d / 2),
      new THREE.Vector3(left, CEILING.y + 0.18, CEILING.z + CEILING.d / 2),
      new THREE.Vector3(left, CEILING.y + 0.18, CEILING.z - CEILING.d / 2)
    ];
    ledGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMat));
  };
  addCeilingPartGuide(CEILING.x - 8, 5);
  addCeilingPartGuide(CEILING.x, 10);
  addCeilingPartGuide(CEILING.x + 8, 5);

  const hoistMat = new THREE.MeshBasicMaterial({ color: 0xc9d4d8, transparent: true, opacity: 0.72 });
  [-7.2, -3.1, 0, 3.1, 7.2].forEach((x) => {
    [-5.7, -0.2, 5.0].forEach((z) => {
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24), hoistMat);
      dot.rotation.x = Math.PI / 2;
      dot.position.set(CEILING.x + x, CEILING.y + 0.25, CEILING.z + z);
      ledGroup.add(dot);
    });
  });

  const trussMat = new THREE.MeshBasicMaterial({ color: 0xa8b6bc, transparent: true, opacity: 0.32 });
  for (let x = -7.5; x <= 7.5; x += 2.5) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, CEILING.d * 0.86), trussMat);
    truss.position.set(CEILING.x + x, CEILING.y + 0.14, CEILING.z - 0.2);
    ledGroup.add(truss);
  }
}

function makeLabel(text, width = 3.2, height = 0.46) {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 112;
  const ctx = labelCanvas.getContext('2d');
  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.fillStyle = 'rgba(248, 244, 235, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;
  let fontSize = 30;
  do {
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > 388 && fontSize > 16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 56);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(208, 154, 90, 0.72)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(196, 82);
  ctx.lineTo(316, 82);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1);
  return sprite;
}

function addMeasurements() {
  const ledLabel = makeLabel('Main LED Wall 60m x 8m', 3.4, 0.42);
  ledLabel.position.set(LED.arcCenterX, LED.h + 0.9, LED.arcCenterZ + 2.4);
  scene.add(ledLabel);
  const ceilingLabel = makeLabel('Ceiling LED 21m x 15m', 3.4, 0.42);
  ceilingLabel.position.set(CEILING.x, CEILING.y + 1.1, CEILING.z - 1.2);
  scene.add(ceilingLabel);
}

let scaleBase = null;

function addPeople() {
  const base = new THREE.Vector3(LED.arcCenterX - 2, 0, LED.arcCenterZ + 5);
  const person = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.32, 1.22, 20), materials.person);
  body.position.y = 0.78;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.60, 24), materials.person);
  torso.position.y = 1.22;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), materials.person);
  head.position.y = 1.73;
  person.add(body, torso, head);
  person.position.copy(base);
  person.rotation.y = Math.atan2(LED.arcCenterX - base.x, LED.arcCenterZ - base.z);
  scene.add(person);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.50, 0.66, 48),
    new THREE.MeshBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(base.x, 0.02, base.z);
  scene.add(ring);

  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(base.x + 0.70, 0, base.z), new THREE.Vector3(base.x + 0.70, 1.8, base.z)]),
    new THREE.LineBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.95 })
  ));

  const label = makeLabel('Human scale 1.8m', 2.75, 0.38);
  label.position.set(base.x + 1.55, 1.35, base.z);
  scene.add(label);
  scaleBase = base;
}

function addVehicle() {
  const base = scaleBase || new THREE.Vector3(LED.arcCenterX - 2, 0, LED.arcCenterZ + 5);
  const carX = base.x + 5.5;
  const carZ = base.z;
  const L = VEHICLE.length;
  const W = VEHICLE.width;
  const H = VEHICLE.height;
  const car = new THREE.Group();
  const placeholder = new THREE.Group();
  addVehiclePlaceholder(placeholder, L, W, H);
  car.add(placeholder);
  window.__studioVMercedesLoaded = false;
  window.__studioVMercedesStatus = 'loading';

  const loader = new FBXLoader();
  loader.load(
    VEHICLE.source,
    (fbx) => {
      const model = new THREE.Group();
      const orientation = new THREE.Group();
      orientation.add(fbx);
      model.add(orientation);
      prepareVehicleModel(fbx);
      normalizeVehicleModel(model, orientation);
      placeholder.removeFromParent();
      car.add(model);
      window.__studioVMercedesLoaded = true;
      window.__studioVMercedesStatus = 'loaded';
    },
    (event) => {
      if (event.total) window.__studioVMercedesProgress = event.loaded / event.total;
    },
    (error) => {
      console.warn('Mercedes GLS FBX load failed; using scale placeholder.', error);
      window.__studioVMercedesLoaded = false;
      window.__studioVMercedesStatus = 'fallback';
    }
  );

  car.position.set(carX, 0, carZ);
  car.rotation.y = Math.atan2(LED.arcCenterZ - carZ, LED.arcCenterX - carX);
  scene.add(car);

  const label = makeLabel('Mercedes GLS scale L 5.21m / H 1.82m', 4.55, 0.40);
  label.position.set(carX, 2.95, carZ + 1.8);
  scene.add(label);

  car.updateMatrixWorld(true);
  const frontRight = car.localToWorld(new THREE.Vector3(L / 2, 0, W / 2 + 0.38));
  const rearRight = car.localToWorld(new THREE.Vector3(-L / 2, 0, W / 2 + 0.38));
  const rulerMat = new THREE.LineBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.95 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([rearRight.clone().setY(0.10), frontRight.clone().setY(0.10)]), rulerMat));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([frontRight.clone().setY(0), frontRight.clone().setY(H)]), rulerMat));
}

function addVehiclePlaceholder(car, L, W, H) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, 0.82, W), materials.vehicle);
  body.position.y = 0.42;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(L * 0.68, 0.62, W * 0.9), materials.vehicle);
  cabin.position.set(-L * 0.06, 1.0, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(L * 0.60, 0.10, W * 0.86), materials.vehicle);
  roof.position.set(-L * 0.06, 1.32, 0);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(L * 0.30, 0.18, W * 0.96), materials.vehicle);
  hood.position.set(L * 0.34, 0.84, 0);
  hood.rotation.z = -0.12;
  const wheelGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 24);
  const wheelPositions = [
    [L * 0.30, 0.38, W / 2 + 0.04],
    [L * 0.30, 0.38, -(W / 2 + 0.04)],
    [-L * 0.30, 0.38, W / 2 + 0.04],
    [-L * 0.30, 0.38, -(W / 2 + 0.04)]
  ];
  car.add(body, cabin, roof, hood);
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, materials.tire);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    car.add(wheel);
  });
}

function selectVehicleMaterial(mesh) {
  const materialName = Array.isArray(mesh.material)
    ? mesh.material.map((material) => material?.name || '').join(' ')
    : mesh.material?.name || '';
  const token = `${mesh.name || ''} ${materialName}`.toLowerCase();
  return selectVehicleMaterialByToken(token);
}

function selectVehicleMaterialByToken(token) {
  if (/tire|tyre|rubber/.test(token)) return materials.tire;
  if (/lamp|light|head|tail/.test(token)) return materials.vehicleLamp;
  if (/glass|window|windshield|screen/.test(token)) return materials.vehicleGlass;
  if (/rim|wheel|chrome|metal|grill|grille|trim|star|logo/.test(token)) return materials.vehicleTrim;
  return materials.vehicleBody;
}

function prepareVehicleModel(root) {
  const removable = [];
  const meshes = [];
  const materialCounts = {
    body: 0,
    glass: 0,
    trim: 0,
    lamp: 0,
    tire: 0
  };
  const sourceMaterials = [];
  root.traverse((child) => {
    if (child.isCamera || child.isLight) removable.push(child);
    if (!child.isMesh) return;
    meshes.push(child);
    child.castShadow = false;
    child.receiveShadow = false;
    if (child.geometry && !child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }
  });

  const countMaterial = (material) => {
    if (material === materials.vehicleGlass) materialCounts.glass += 1;
    else if (material === materials.vehicleTrim) materialCounts.trim += 1;
    else if (material === materials.vehicleLamp) materialCounts.lamp += 1;
    else if (material === materials.tire) materialCounts.tire += 1;
    else materialCounts.body += 1;
  };

  meshes.forEach((child) => {
    const meshName = child.name || 'mesh';
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material, index) => {
        const token = `${meshName} ${material?.name || ''}`.toLowerCase();
        const selected = selectVehicleMaterialByToken(token);
        sourceMaterials.push({
          mesh: meshName,
          slot: index,
          source: material?.name || '',
          target: selected === materials.vehicleGlass ? 'glass'
            : selected === materials.vehicleTrim ? 'trim'
              : selected === materials.vehicleLamp ? 'lamp'
                : selected === materials.tire ? 'tire'
                  : 'silver body'
        });
        countMaterial(selected);
        return selected;
      });
      return;
    }

    const originalName = child.material?.name || '';
    const selected = selectVehicleMaterial(child);
    sourceMaterials.push({
      mesh: meshName,
      slot: 0,
      source: originalName,
      target: selected === materials.vehicleGlass ? 'glass'
        : selected === materials.vehicleTrim ? 'trim'
          : selected === materials.vehicleLamp ? 'lamp'
            : selected === materials.tire ? 'tire'
              : 'silver body'
    });
    child.material = selected;
    countMaterial(selected);
  });
  removable.forEach((child) => child.parent?.remove(child));
  window.__studioVMercedesMaterialCounts = materialCounts;
  window.__studioVMercedesSourceMaterials = sourceMaterials;
}

function normalizeVehicleModel(root, orientation = root) {
  const debug = {};
  root.position.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  orientation.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  debug.before = { x: size.x, y: size.y, z: size.z };

  const smallestAxis = getAxisBySize(size, 'min');
  if (smallestAxis === 'z') {
    orientation.rotation.x -= Math.PI / 2;
  } else if (smallestAxis === 'x') {
    orientation.rotation.z += Math.PI / 2;
  }
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
  debug.afterUp = { x: size.x, y: size.y, z: size.z };

  const lengthAxis = getAxisBySize(size, 'max');
  if (lengthAxis === 'z') {
    orientation.rotation.y += Math.PI / 2;
  } else if (lengthAxis === 'y') {
    orientation.rotation.z -= Math.PI / 2;
  }
  if (lengthAxis !== 'x') {
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
  }
  debug.afterLength = { x: size.x, y: size.y, z: size.z };

  const scaleX = VEHICLE.length / Math.max(size.x, 0.001);
  const scaleY = VEHICLE.height / Math.max(size.y, 0.001);
  const scaleZ = VEHICLE.width / Math.max(size.z, 0.001);
  root.scale.set(scaleX, scaleY, scaleZ);
  root.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(root);
  let center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
  debug.final = { x: size.x, y: size.y, z: size.z };
  debug.scale = { x: scaleX, y: scaleY, z: scaleZ };
  window.__studioVMercedesBox = debug;
}

function getAxisBySize(size, mode) {
  const axes = [
    ['x', size.x],
    ['y', size.y],
    ['z', size.z]
  ];
  axes.sort((a, b) => mode === 'min' ? a[1] - b[1] : b[1] - a[1]);
  return axes[0][0];
}

function addCameraRig() {
  const base = scaleBase || new THREE.Vector3(LED.arcCenterX - 2, 0, LED.arcCenterZ + 5);
  const rig = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.55), materials.camera);
  head.position.y = 2.05;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 24), materials.camera);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 2.05, -0.5);
  rig.add(head, lens);
  for (let i = 0; i < 3; i += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.85, 8), materials.camera);
    leg.position.y = 0.95;
    leg.rotation.z = 0.24;
    leg.rotation.y = i * (Math.PI * 2 / 3);
    rig.add(leg);
  }
  rig.position.set(base.x - 2.8, 0, base.z + 1.5);
  rig.rotation.y = Math.atan2(base.x - rig.position.x, base.z - rig.position.z);
  scene.add(rig);

}

function addLightPanel(x, z, rotY, height = 3.0) {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, height, 12), materials.metal);
  stand.position.y = height / 2;
  group.add(stand);

  for (let i = 0; i < 3; i += 1) {
    const angle = i * Math.PI * 2 / 3;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.045, 0.045), materials.metal);
    leg.position.set(Math.cos(angle) * 0.38, 0.05, Math.sin(angle) * 0.38);
    leg.rotation.y = -angle;
    group.add(leg);
  }

  const yoke = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.08), materials.metal);
  yoke.position.y = height + 0.05;
  group.add(yoke);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.72, 0.08), materials.warmPanel);
  panel.position.y = height + 0.05;
  panel.position.z = -0.12;
  group.add(panel);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

function addMonitorCart(x, z, rotY) {
  const cart = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.76), materials.metal);
  deck.position.y = 0.72;
  cart.add(deck);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.68), materials.metal);
  lower.position.y = 0.34;
  cart.add(lower);

  [-0.55, 0.55].forEach((px) => {
    [-0.26, 0.26].forEach((pz) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), materials.tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(px, 0.08, pz);
      cart.add(wheel);
    });
  });

  [-0.42, 0.42].forEach((px) => {
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.40, 0.06), materials.monitor);
    monitor.position.set(px, 1.12, -0.22);
    monitor.rotation.x = -0.12;
    cart.add(monitor);
  });

  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.24), materials.matteBlack);
  keyboard.position.set(0, 0.86, 0.08);
  cart.add(keyboard);

  cart.position.set(x, 0, z);
  cart.rotation.y = rotY;
  scene.add(cart);
  return cart;
}

function addDollyTrack() {
  const base = scaleBase || new THREE.Vector3(LED.arcCenterX - 2, 0, LED.arcCenterZ + 5);
  const z = base.z + 7.8;
  const x0 = -10;
  const x1 = 12;
  const railMat = new THREE.LineBasicMaterial({ color: 0xc7d2d4, transparent: true, opacity: 0.62 });
  [-0.42, 0.42].forEach((offset) => {
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, 0.12, z + offset), new THREE.Vector3(x1, 0.12, z + offset)]),
      railMat
    ));
  });

  for (let x = x0; x <= x1; x += 1.8) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 1.12), materials.metal);
    sleeper.position.set(x, 0.07, z);
    scene.add(sleeper);
  }

  const dolly = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 0.9), materials.matteBlack);
  dolly.position.set(base.x + 1.6, 0.22, z);
  scene.add(dolly);

  return new THREE.Vector3(dolly.position.x, 0, z);
}

function addCinemaCameraRig(x, z, rotY = 0) {
  const rig = new THREE.Group();

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.72, 18), materials.metal);
  pedestal.position.y = 0.72;
  rig.add(pedestal);

  const headMount = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.48), materials.metal);
  headMount.position.y = 1.14;
  rig.add(headMount);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.46, 0.46), materials.camera);
  body.position.y = 1.48;
  rig.add(body);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.48, 28), materials.lensGlass);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.48, -0.48);
  rig.add(lens);

  const matteBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.36, 0.10), materials.matteBlack);
  matteBox.position.set(0, 1.48, -0.78);
  rig.add(matteBox);

  [-0.18, 0.18].forEach((px) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92, 10), materials.metal);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(px, 1.23, -0.44);
    rig.add(rod);
  });

  const topHandle = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.10), materials.matteBlack);
  topHandle.position.set(0, 1.82, 0);
  rig.add(topHandle);

  const sideMonitor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.04), materials.monitor);
  sideMonitor.position.set(-0.54, 1.66, -0.02);
  sideMonitor.rotation.y = 0.34;
  rig.add(sideMonitor);

  const battery = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.14), materials.matteBlack);
  battery.position.set(0, 1.47, 0.34);
  rig.add(battery);

  [-0.42, 0.42].forEach((px) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.08, 18), materials.tire);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(px, 0.18, -0.32);
    rig.add(wheel);
  });

  rig.position.set(x, 0, z);
  rig.rotation.y = rotY;
  scene.add(rig);
  return rig;
}

function addBoomMic(x, z, rotY = 0) {
  const boom = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.05, 12), materials.metal);
  stand.position.y = 1.52;
  boom.add(stand);

  for (let i = 0; i < 3; i += 1) {
    const angle = i * Math.PI * 2 / 3;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.04), materials.metal);
    leg.position.set(Math.cos(angle) * 0.32, 0.05, Math.sin(angle) * 0.32);
    leg.rotation.y = -angle;
    boom.add(leg);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 3.25, 10), materials.matteBlack);
  pole.rotation.z = Math.PI / 2;
  pole.position.set(1.3, 3.05, 0);
  boom.add(pole);

  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.18), materials.matteBlack);
  counterWeight.position.set(-0.48, 3.05, 0);
  boom.add(counterWeight);

  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.46, 16), materials.matteBlack);
  mic.rotation.z = Math.PI / 2;
  mic.position.set(2.95, 2.92, 0);
  boom.add(mic);

  boom.position.set(x, 0, z);
  boom.rotation.y = rotY;
  scene.add(boom);
}

function addStudioRigging() {
  const dollyPosition = addDollyTrack();
  addCinemaCameraRig(dollyPosition.x, dollyPosition.z, 0);
  addBoomMic(-5.6, LED.arcCenterZ + 5.7, 0.18);
  addLightPanel(-8.4, LED.arcCenterZ + 8.4, -0.55, 3.2);
  addLightPanel(8.8, LED.arcCenterZ + 8.8, 0.55, 3.2);
  addMonitorCart(-12.6, LED.arcCenterZ + 23.5, Math.PI * 0.18);

}

function buildScene() {
  addLights();
  setProgress(0.32);
  addRoom();
  setProgress(0.48);
  addLedSystem();
  setProgress(0.62);
  addMeasurements();
  addPeople();
  addVehicle();
  addCameraRig();
  addStudioRigging();
  setProgress(0.82);
}

const views = {
  overview: {
    camera: new THREE.Vector3(LED.arcCenterX, 18, LED.arcCenterZ + 38),
    target: new THREE.Vector3(LED.arcCenterX, 5, LED.arcCenterZ)
  },
  wall: {
    camera: new THREE.Vector3(LED.arcCenterX, 11.5, LED.arcCenterZ + 24),
    target: new THREE.Vector3(LED.arcCenterX, 4.4, LED.arcCenterZ - 5)
  },
  scale: {
    camera: new THREE.Vector3(13, 8, LED.arcCenterZ + 15),
    target: new THREE.Vector3(2, 2.2, LED.arcCenterZ + 5)
  },
  top: {
    camera: new THREE.Vector3(0, 86, 0.01),
    target: new THREE.Vector3(0, 0, 0)
  }
};

const targetCamera = views.overview.camera.clone();
const targetLook = views.overview.target.clone();
let transitionFrames = 0;

function setView(name) {
  const view = views[name];
  if (!view) return;
  targetCamera.copy(view.camera);
  targetLook.copy(view.target);
  transitionFrames = 90;
  viewButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.view === name));
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

controls.addEventListener('start', () => {
  transitionFrames = 0;
});

if (autoButton) {
  autoButton.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    controls.autoRotateSpeed = 0.45;
    autoButton.classList.toggle('is-on', controls.autoRotate);
  });
}

function resize() {
  const width = stage.clientWidth || window.innerWidth;
  const height = stage.clientHeight || window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize, { passive: true });
if ('ResizeObserver' in window) {
  new ResizeObserver(resize).observe(stage);
}

let firstFrame = true;
function animate() {
  requestAnimationFrame(animate);
  pointerState.x += (pointerState.targetX - pointerState.x) * 0.08;
  pointerState.y += (pointerState.targetY - pointerState.y) * 0.08;
  if (interactiveWash) {
    interactiveWash.intensity += ((pointerState.active ? 0.88 : 0.18) - interactiveWash.intensity) * 0.06;
    interactiveWash.position.x = pointerState.x * 8;
    interactiveWash.position.y = 3.8 - pointerState.y * 1.4;
    interactiveWash.position.z = LED.arcCenterZ + 11 + pointerState.y * 4;
  }
  ceilingTex.offset.y += (pointerState.y * 0.001 - ceilingTex.offset.y) * 0.035;
  renderer.toneMappingExposure += ((pointerState.active ? 1.00 : 0.94) - renderer.toneMappingExposure) * 0.035;
  if (transitionFrames > 0) {
    camera.position.lerp(targetCamera, 0.065);
    controls.target.lerp(targetLook, 0.065);
    transitionFrames -= 1;
  }
  controls.update();
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    setProgress(1);
    window.setTimeout(() => loading?.classList.add('is-done'), 250);
  }
}

buildScene();
resize();
setView('overview');
animate();
