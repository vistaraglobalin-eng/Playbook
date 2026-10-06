import * as THREE from 'three';
import './style.css';

import {
  loadPracticeRounds,
  supabaseConfigured
} from './supabase.js';

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

const camera = new THREE.PerspectiveCamera(
  48,
  1,
  0.1,
  500
);

camera.position.set(0, 3.4, 11);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x17364a);

stage.appendChild(renderer.domElement);


/* ---------- LIGHTING ---------- */

const hemi = new THREE.HemisphereLight(
  0xaed5e5,
  0x152025,
  2.2
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
  0xffe2bd,
  4
);

sun.position.set(-8, 13, 8);
sun.castShadow = true;

scene.add(sun);


/* ---------- WORLD ---------- */

const world = new THREE.Group();
scene.add(world);

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


/* ---------- RUNWAY ---------- */

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

const lane = new THREE.Mesh(
  new THREE.PlaneGeometry(0.35, 90),
  new THREE.MeshStandardMaterial({
    color: 0xe5d9a5
  })
);

lane.rotation.x = -Math.PI / 2;
lane.position.set(0, -2.98, -25);

world.add(lane);


/* ---------- CLOUDS ---------- */

function makeCloud(x, y, z, scale) {

  const group = new THREE.Group();

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xf3fbff,
      transparent: true,
      opacity: 0.64,
      roughness: 1
    });

  for (let i = 0; i < 6; i++) {

    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      material
    );

    cloud.scale.set(
      1.4 + Math.random() * 1.3,
      0.65 + Math.random() * 0.45,
      0.75 + Math.random() * 0.5
    );

    cloud.position.set(
      (i - 2.5) * 1.25,
      Math.random() * 0.6,
      (Math.random() - 0.5) * 0.8
    );

    group.add(cloud);
  }

  group.position.set(x, y, z);
  group.scale.setScalar(scale);

  world.add(group);

  return group;
}

const clouds = [
  makeCloud(-10, 5, -22, 1.3),
  makeCloud(9, 4, -32, 1.0),
  makeCloud(-4, 7, -44, 0.9),
  makeCloud(13, 8, -58, 1.4)
];


/* ---------- AIRCRAFT ---------- */

function makePlane() {

  const group = new THREE.Group();

  const red =
    new THREE.MeshStandardMaterial({
      color: 0xd91f35,
      metalness: 0.48,
      roughness: 0.28
    });

  const dark =
    new THREE.MeshStandardMaterial({
      color: 0x171d22,
      metalness: 0.75,
      roughness: 0.22
    });

  const glass =
    new THREE.MeshStandardMaterial({
      color: 0x78b8d1,
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: 0.8
    });


  /* Fuselage */

  const fuselage = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      0.48,
      2.9,
      8,
      18
    ),
    red
  );

  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;

  group.add(fuselage);


  /* Wings */

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.13, 0.72),
    red
  );

  wing.rotation.x = -0.06;
  wing.castShadow = true;

  group.add(wing);


  /* Tail */

  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.12, 0.5),
    red
  );

  tail.position.set(-1.25, 0.55, 0);
  tail.rotation.z = 0.25;

  group.add(tail);


  /* Tail fin */

  const fin = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.2, 4),
    red
  );

  fin.scale.set(0.7, 0.8, 0.22);
  fin.position.set(-1.05, 0.55, 0);
  fin.rotation.z = Math.PI / 2;

  group.add(fin);


  /* Cockpit */

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 12),
    glass
  );

  cockpit.scale.set(1.15, 0.55, 0.7);
  cockpit.position.set(0.7, 0.42, 0);

  group.add(cockpit);


  /* Propeller */

  const propeller = new THREE.Group();

  propeller.position.set(1.65, 0, 0);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 8),
    dark
  );

  propeller.add(hub);

  for (let i = 0; i < 3; i++) {

    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.15, 0.08),
      dark
    );

    blade.position.y = 0.55;
    blade.rotation.z = i * 2.094;

    propeller.add(blade);
  }

  group.add(propeller);


  /* Engine glow */

  const engineGlow = new THREE.PointLight(
    0xff6a44,
    1.7,
    4
  );

  engineGlow.position.set(-1.6, 0, 0);

  group.add(engineGlow);

  group.userData.propeller = propeller;
  group.userData.engineGlow = engineGlow;

  return group;
}

const plane = makePlane();

plane.position.set(-6, 0.1, 0);
plane.rotation.z = -0.12;
plane.rotation.y = -0.1;

scene.add(plane);


/* ---------- EXHAUST TRAIL ---------- */

const trail = [];

const trailMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xff3d4e,
    transparent: true,
    opacity: 0.52
  });

for (let i = 0; i < 22; i++) {

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.045 + i * 0.002,
      8,
      8
    ),
    trailMaterial
  );

  particle.visible = false;

  scene.add(particle);
  trail.push(particle);
}


/* ---------- PARTICLES ---------- */

const particleGeometry =
  new THREE.SphereGeometry(
    0.035,
    6,
    6
  );

const particleMaterial =
  new THREE.MeshBasicMaterial({
    color: 0xffc0b7
  });

const particles = [];

for (let i = 0; i < 90; i++) {

  const particle = new THREE.Mesh(
    particleGeometry,
    particleMaterial
  );

  particle.visible = false;

  scene.add(particle);
  particles.push(particle);
}


/* ---------- GAME STATE ---------- */

let running = false;
let crashed = false;

let startTime = 0;
let crashAt = 2.5;

let round = 0;

let animationFrame = 0;

let history = [];

let practiceRounds = [];
let practiceRoundIndex = 0;


/* ---------- RESIZE ---------- */

function resize() {

  const width = stage.clientWidth;
  const height = stage.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height,
    false
  );
}

window.addEventListener(
  'resize',
  resize
);

resize();


/* ---------- MULTIPLIER ---------- */

function setMultiplier(value) {

  multiplierEl.innerHTML =
    `${value.toFixed(2)}<span>x</span>`;
}


/* ---------- AIRCRAFT POSITION ---------- */

function positionFlight(value) {

  const denominator =
    Math.max(crashAt - 1, 0.01);

  const progress =
    Math.min(
      1,
      Math.max(
        0,
        (value - 1) / denominator
      )
    );

  plane.position.x =
    -6 + progress * 11.5;

  plane.position.y =
    0.1 + progress * 7.5;

  plane.position.z =
    -progress * 8;

  plane.rotation.z =
    -0.12 - progress * 0.36;

  plane.rotation.y =
    -0.1 + progress * 0.22;


  camera.position.x +=
    (
      plane.position.x * 0.08 -
      camera.position.x
    ) * 0.04;

  camera.position.y +=
    (
      3.4 + progress * 1.4 -
      camera.position.y
    ) * 0.035;

  camera.position.z +=
    (
      11 - progress * 2.2 -
      camera.position.z
    ) * 0.035;

  camera.lookAt(
    plane.position.x * 0.2,
    plane.position.y * 0.65,
    plane.position.z - 5
  );


  trail.forEach((particle, index) => {

    const trailProgress =
      Math.max(
        0,
        progress - index * 0.018
      );

    particle.visible =
      trailProgress > 0;

    particle.position.set(
      -6 + trailProgress * 11.5,
      0.1 + trailProgress * 7.5 - 0.08,
      -trailProgress * 8 + 0.3
    );

    particle.scale.setScalar(
      Math.max(
        0.3,
        1 - index * 0.035
      )
    );
  });
}


/* ---------- EXHAUST ---------- */

function spawnExhaust(
  amount = 2,
  crashMode = false
) {

  for (let i = 0; i < amount; i++) {

    const particle =
      particles[
        Math.floor(
          Math.random() *
          particles.length
        )
      ];

    particle.visible = true;

    particle.position.copy(
      plane.position
    );

    particle.position.x -=
      0.9 + Math.random() * 0.4;

    particle.position.y +=
      (Math.random() - 0.5) * 0.25;

    particle.position.z +=
      (Math.random() - 0.5) * 0.25;

    particle.userData.velocity =
      new THREE.Vector3(
        -(1 + Math.random() * 2),
        (Math.random() - 0.3) *
          (crashMode ? 4 : 1),
        (Math.random() - 0.5) *
          (crashMode ? 4 : 1)
      );

    particle.userData.life =
      crashMode
        ? 0.8 + Math.random() * 0.8
        : 0.35 + Math.random() * 0.3;
  }
}


/* ---------- CRASH ---------- */

function crashSequence() {

  running = false;
  crashed = true;

  setMultiplier(crashAt);

  statusEl.textContent =
    'FLIGHT ENDED · CRASH SEQUENCE';

  stage.classList.add('shake');

  setTimeout(() => {
    stage.classList.remove('shake');
  }, 800);

  for (let i = 0; i < 55; i++) {
    spawnExhaust(1, true);
  }

  history.unshift(crashAt);

  history =
    history.slice(0, 9);

  historyEl.innerHTML =
    history
      .map(
        value =>
          `<span>${value.toFixed(2)}x</span>`
      )
      .join('');

  startBtn.disabled = false;
  startBtn.textContent =
    'START FLIGHT';
}


/* ---------- START FLIGHT ---------- */

function startFlight() {

  if (running) return;

  crashed = false;

  round++;


  /*
    PRACTICE ONLY

    When Supabase practice data exists,
    use the next stored demo round.

    No real-money wager,
    payout or settlement logic.
  */

  const databaseRound =
    practiceRounds[
      practiceRoundIndex %
      Math.max(practiceRounds.length, 1)
    ];

  if (databaseRound) {

    crashAt =
      Number(
        databaseRound.crash_multiplier
      );

    practiceRoundIndex++;

  } else {

    crashAt =
      Number(
        (
          1.25 +
          Math.random() * 5.75
        ).toFixed(2)
      );
  }


  running = true;

  startTime =
    performance.now();

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


/* ---------- RESET ---------- */

function reset() {

  running = false;
  crashed = false;

  round = 0;

  history = [];

  practiceRoundIndex = 0;

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


/* ---------- BUTTONS ---------- */

startBtn.addEventListener(
  'click',
  startFlight
);

resetBtn.addEventListener(
  'click',
  reset
);


/* ---------- ANIMATION ---------- */

let lastTime =
  performance.now();

function animate(now) {

  const delta =
    Math.min(
      0.04,
      (now - lastTime) / 1000
    );

  lastTime = now;


  /* Moving clouds */

  clouds.forEach(
    (cloud, index) => {

      cloud.position.x +=
        delta *
        (0.15 + index * 0.035);

      if (cloud.position.x > 24) {
        cloud.position.x = -24;
      }
    }
  );


  /* Propeller */

  plane.userData.propeller.rotation.z +=
    delta * 28;


  /* Engine */

  plane.userData.engineGlow.intensity =
    1.4 +
    Math.sin(now * 0.025) * 0.45;


  /* Exhaust */

  particles.forEach(
    particle => {

      if (!particle.visible) {
        return;
      }

      particle.position.addScaledVector(
        particle.userData.velocity,
        delta
      );

      particle.userData.velocity.multiplyScalar(
        0.985
      );

      particle.userData.life -=
        delta;

      if (
        particle.userData.life <= 0
      ) {
        particle.visible = false;
      }
    }
  );


  /* Flight */

  if (running) {

    const seconds =
      (now - startTime) / 1000;

    const multiplier =
      1 +
      Math.pow(
        seconds * 0.68,
        1.5
      );


    if (
      multiplier >= crashAt
    ) {

      crashSequence();

    } else {

      setMultiplier(
        multiplier
      );

      if (seconds < 1) {

        statusEl.textContent =
          'ENGINE START · TAKEOFF';

      } else if (seconds < 3) {

        statusEl.textContent =
          'CLIMBING · CAMERA FOLLOW';

      } else {

        statusEl.textContent =
          'HIGH ALTITUDE · FULL POWER';
      }


      positionFlight(
        multiplier
      );


      if (
        Math.random() <
        delta * 8
      ) {

        spawnExhaust(
          1,
          false
        );
      }
    }
  }


  /* Crash movement */

  else if (crashed) {

    plane.position.y -=
      delta * 2.2;

    plane.position.x +=
      delta * 3.4;

    plane.rotation.z +=
      delta * 2.4;

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

  animationFrame =
    requestAnimationFrame(
      animate
    );
}


/* ---------- SUPABASE ---------- */

async function initPracticeData() {

  if (!supabaseConfigured) {

    statusEl.textContent =
      'Practice mode · local demo data';

    return;
  }


  statusEl.textContent =
    'Loading practice rounds…';


  const {
    rounds,
    error
  } =
    await loadPracticeRounds();


  if (error) {

    console.warn(
      'Supabase practice rounds unavailable:',
      error
    );

    statusEl.textContent =
      'Practice mode · database unavailable';

    return;
  }


  practiceRounds =
    rounds || [];


  if (practiceRounds.length) {

    statusEl.textContent =
      `Practice database ready · ${practiceRounds.length} rounds`;

  } else {

    statusEl.textContent =
      'Practice database ready · no rounds';
  }
}


/* ---------- START ---------- */

reset();

animationFrame =
  requestAnimationFrame(
    animate
  );

initPracticeData();
