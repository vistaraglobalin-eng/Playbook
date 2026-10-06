import * as THREE from 'three';
import './style.css';

const stage = document.querySelector('#stage');
const multiplierEl = document.querySelector('#multiplier');
const statusEl = document.querySelector('#status');
const startBtn = document.querySelector('#start');
const resetBtn = document.querySelector('#reset');
const historyEl = document.querySelector('#history');
const transition = document.querySelector('#transition');
const countdownEl = document.querySelector('#countdown');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x10232e, 0.012);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
camera.position.set(0, 3.4, 11);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x17364a);

stage.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xaed5e5, 0x152025, 2.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe2bd, 4.0);
sun.position.set(-8, 13, 8);
sun.castShadow = true;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({
    color: 0x182a2a,
    roughness: 1
  })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -3.1;
ground.receiveShadow = true;
world.add(ground);

// Runway
const runway = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 100),
  new THREE.MeshStandardMaterial({
    color: 0x273137,
    roughness: 0.92
  })
);

runway.rotation.x = -Math.PI / 2;
runway.position.set(0, -3.02, -25);
world.add(runway);

// Runway lane
const lane = new THREE.Mesh(
  new THREE.PlaneGeometry(0.35, 90),
  new THREE.MeshStandardMaterial({
    color: 0xe5d9a5
  })
);

lane.rotation.x = -Math.PI / 2;
lane.position.set(0, -2.98, -25);
world.add(lane);

// Clouds
function makeCloud(x, y, z, scale) {
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xf3fbff,
    transparent: true,
    opacity: 0.64,
    roughness: 1
  });

  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      mat
    );

    s.scale.set(
      1.4 + Math.random() * 1.3,
      0.65 + Math.random() * 0.45,
      0.75 + Math.random() * 0.5
    );

    s.position.set(
      (i - 2.5) * 1.25,
      Math.random() * 0.6,
      (Math.random() - 0.5) * 0.8
    );

    g.add(s);
  }

  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  world.add(g);

  return g;
}

const clouds = [
  makeCloud(-10, 5, -22, 1.3),
  makeCloud(9, 4, -32, 1.0),
  makeCloud(-4, 7, -44, 0.9),
  makeCloud(13, 8, -58, 1.4)
];

// Aircraft
function makePlane() {
  const g = new THREE.Group();

  const red = new THREE.MeshStandardMaterial({
    color: 0xd91f35,
    metalness: 0.48,
    roughness: 0.28
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x171d22,
    metalness: 0.75,
    roughness: 0.22
  });

  const glass = new THREE.MeshStandardMaterial({
    color: 0x78b8d1,
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: 0.8
  });

  // Fuselage
  const fuselage = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.48, 2.9, 8, 18),
    red
  );

  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  g.add(fuselage);

  // Wings
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.13, 0.72),
    red
  );

  wing.position.set(0, 0, 0.05);
  wing.rotation.x = -0.06;
  wing.castShadow = true;
  g.add(wing);

  // Tail
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.12, 0.5),
    red
  );

  tail.position.set(-1.25, 0.55, 0.02);
  tail.rotation.z = 0.25;
  g.add(tail);

  // Fin
  const fin = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.2, 4),
    red
  );

  fin.scale.set(0.7, 0.8, 0.22);
  fin.position.set(-1.05, 0.55, 0);
  fin.rotation.z = Math.PI / 2;
  g.add(fin);

  // Cockpit
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 12),
    glass
  );

  cockpit.scale.set(1.15, 0.55, 0.7);
  cockpit.position.set(0.7, 0.42, 0);
  g.add(cockpit);

  // Propeller
  const propGroup = new THREE.Group();

  propGroup.position.set(1.65, 0, 0);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 8),
    dark
  );

  propGroup.add(hub);

  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.15, 0.08),
      dark
    );

    blade.position.y = 0.55;
    blade.rotation.z = i * 2.094;

    propGroup.add(blade);
  }

  g.add(propGroup);

  // Engine glow
  const engineGlow = new THREE.PointLight(
    0xff6a44,
    1.7,
    4
  );

  engineGlow.position.set(-1.6, 0, 0);
  g.add(engineGlow);

  g.userData.prop = propGroup;
  g.userData.engineGlow = engineGlow;

  return g;
}

const plane = makePlane();

plane.position.set(-6, 0.1, 0);
plane.rotation.z = -0.12;
plane.rotation.y = -0.1;

scene.add(plane);

// Flight trail
const trail = [];

const trailMat = new THREE.MeshBasicMaterial({
  color: 0xff3d4e,
  transparent: true,
  opacity: 0.52
});

for (let i = 0; i < 22; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.045 + i * 0.002,
      8,
      8
    ),
    trailMat
  );

  p.visible = false;

  scene.add(p);
  trail.push(p);
}

// Exhaust particles
const particleGeo = new THREE.SphereGeometry(
  0.035,
  6,
  6
);

const particleMat = new THREE.MeshBasicMaterial({
  color: 0xffc0b7
});

const particles = [];

for (let i = 0; i < 90; i++) {
  const p = new THREE.Mesh(
    particleGeo,
    particleMat
  );

  p.visible = false;

  scene.add(p);
  particles.push(p);
}

let running = false;
let crashed = false;
let t0 = 0;
let crashAt = 2.5;
let round = 0;
let raf = 0;

let history = [];

// Resize
function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h, false);
}

window.addEventListener('resize', resize);
resize();

// Multiplier
function setMultiplier(v) {
  multiplierEl.innerHTML =
    `${v.toFixed(2)}<span>x</span>`;
}

// Flight positioning
function positionFlight(v) {
  const q = Math.min(
    1,
    Math.max(
      0,
      (v - 1) / (crashAt - 1)
    )
  );

  plane.position.x =
    -6 + q * 11.5;

  plane.position.y =
    0.1 + q * 7.5;

  plane.position.z =
    -q * 8;

  plane.rotation.z =
    -0.12 - q * 0.36;

  plane.rotation.y =
    -0.1 + q * 0.22;

  camera.position.x +=
    ((plane.position.x * 0.08) -
      camera.position.x) * 0.04;

  camera.position.y +=
    ((3.4 + q * 1.4) -
      camera.position.y) * 0.035;

  camera.position.z +=
    ((11 - q * 2.2) -
      camera.position.z) * 0.035;

  camera.lookAt(
    plane.position.x * 0.2,
    plane.position.y * 0.65,
    plane.position.z - 5
  );

  trail.forEach((p, i) => {
    const tq = Math.max(
      0,
      q - i * 0.018
    );

    p.visible = tq > 0;

    p.position.set(
      -6 + tq * 11.5,
      0.1 + tq * 7.5 - 0.08,
      -tq * 8 + 0.3
    );

    p.scale.setScalar(
      Math.max(
        0.3,
        1 - i * 0.035
      )
    );
  });
}

// Exhaust
function spawnExhaust(
  amount = 2,
  crashMode = false
) {
  for (let k = 0; k < amount; k++) {
    const p =
      particles[
        Math.floor(
          Math.random() *
          particles.length
        )
      ];

    p.visible = true;

    p.position.copy(
      plane.position
    );

    p.position.x -=
      0.9 + Math.random() * 0.4;

    p.position.y +=
      (Math.random() - 0.5) * 0.25;

    p.position.z +=
      (Math.random() - 0.5) * 0.25;

    p.userData.v =
      new THREE.Vector3(
        -(1 + Math.random() * 2),
        (Math.random() - 0.3) *
          (crashMode ? 4 : 1),
        (Math.random() - 0.5) *
          (crashMode ? 4 : 1)
      );

    p.userData.life =
      crashMode
        ? 0.8 + Math.random() * 0.8
        : 0.35 + Math.random() * 0.3;
  }
}

// Crash sequence
function crashSequence() {
  running = false;
  crashed = true;

  setMultiplier(crashAt);

  statusEl.textContent =
    'FLIGHT ENDED · CRASH SEQUENCE';

  stage.classList.add('shake');

  setTimeout(
    () => stage.classList.remove('shake'),
    800
  );

  for (let i = 0; i < 55; i++) {
    spawnExhaust(1, true);
  }

  history.unshift(crashAt);

  history = history.slice(0, 9);

  historyEl.innerHTML =
    history
      .map(
        v =>
          `<span class="${
            v >= 3 ? 'hot' : ''
          }">${v.toFixed(2)}x</span>`
      )
      .join('');

  startBtn.disabled = false;
  startBtn.textContent =
    'START FLIGHT';
}

// Start flight
function startFlight() {
  if (running) return;

  crashed = false;

  round++;

  crashAt = +(
    1.25 +
    Math.random() * 5.75
  ).toFixed(2);

  running = true;

  t0 = performance.now();

  startBtn.disabled = true;

  startBtn.textContent =
    'IN FLIGHT…';

  statusEl.textContent =
    'ENGINE START · TAKEOFF';

  setMultiplier(1);

  plane.position.set(
    -6,
    0.1,
    0
  );

  camera.position.set(
    0,
    3.4,
    11
  );

  camera.lookAt(
    0,
    1,
    -5
  );
}

// Reset
function reset() {
  running = false;
  crashed = false;
  round = 0;
  history = [];

  cancelAnimationFrame(raf);

  setMultiplier(1);

  statusEl.textContent =
    'Aircraft systems ready';

  historyEl.innerHTML =
    '<span>—</span>';

  startBtn.disabled = false;

  startBtn.textContent =
    'START FLIGHT';

  plane.position.set(
    -6,
    0.1,
    0
  );

  camera.position.set(
    0,
    3.4,
    11
  );
}

startBtn.addEventListener(
  'click',
  startFlight
);

resetBtn.addEventListener(
  'click',
  reset
);

// Animation
let last = performance.now();

function animate(now) {
  const dt =
    Math.min(
      0.04,
      (now - last) / 1000
    );

  last = now;

  // Move clouds
  clouds.forEach((c, i) => {
    c.position.x +=
      dt * (0.15 + i * 0.035);

    if (c.position.x > 24) {
      c.position.x = -24;
    }
  });

  // Propeller animation
  plane.userData.prop.rotation.z +=
    dt * 28;

  // Engine glow
  plane.userData.engineGlow.intensity =
    1.4 +
    Math.sin(now * 0.025) * 0.45;

  // Particles
  particles.forEach(p => {
    if (!p.visible) return;

    p.position.addScaledVector(
      p.userData.v,
      dt
    );

    p.userData.v.multiplyScalar(
      0.985
    );

    p.userData.life -= dt;

    if (p.userData.life <= 0) {
      p.visible = false;
    }
  });

  // Flight
  if (running) {
    const sec =
      (now - t0) / 1000;

    const v =
      1 +
      Math.pow(
        sec * 0.68,
        1.5
      );

    if (v >= crashAt) {
      crashSequence();
    } else {
      setMultiplier(v);

      statusEl.textContent =
        sec < 1
          ? 'ENGINE START · TAKEOFF'
          : sec < 3
          ? 'CLIMBING · CAMERA FOLLOW'
          : 'HIGH ALTITUDE · FULL POWER';

      positionFlight(v);

      if (
        Math.random() <
        dt * 8
      ) {
        spawnExhaust(1, false);
      }
    }
  }

  // Crash movement
  else if (crashed) {
    plane.position.y -=
      dt * 2.2;

    plane.position.x +=
      dt * 3.4;

    plane.rotation.z +=
      dt * 2.4;

    camera.lookAt(
      plane.position.x * 0.2,
      plane.position.y * 0.6,
      plane.position.z - 5
    );
  }

  renderer.render(
    scene,
    camera
  );

  raf =
    requestAnimationFrame(
      animate
    );
}

reset();

raf =
  requestAnimationFrame(
    animate
  );
