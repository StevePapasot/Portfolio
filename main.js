/* =====================================================================
   STAVROS PAPASOTIROPOULOS — MISSION CONSOLE v3.0
   ---------------------------------------------------------------------
   v3 NEW FEATURES:
   ─────────────────────────────────────────────────────────────────────
   1. KONAMI CODE (↑↑↓↓←→←→BA) — opens a classified terminal overlay
      with a full working command set:
        help · whoami · id · skills · certs · contact · ls · cat <file>
        clear · date · ping · exit

   2. CLICKABLE PROJECT NODES — 8 designated "project" nodes in the 3D
      scene glow brighter (octahedron geometry, larger, pulsing).
      THREE.Raycaster detects clicks/taps → pins a frosted glass project
      card on screen, animated in by GSAP.

   Everything from v2 is preserved below.
   ===================================================================== */

import * as THREE from 'three';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);


/* =====================================================================
   CONFIG
   ===================================================================== */
const CONFIG = {
  bgColor: 0x03060f,
  fogDensity: 0.018,
  nodeCount: 120,
  tunnelLength: 240,
  tunnelRadius: 10,
  nodeSize: 0.18,
  connectRadius: 4.2,
  maxConnPerNode: 3,
  particleCount: 900,
  cameraStartZ: 8,
  cameraEndZ: -220,
  cameraEase: 0.07,
  packetCount: 24,
  packetSpeed: 0.6,
  floatAmp: 0.35,
  floatSpeed: 0.5,
};


/* =====================================================================
   ✦ KONAMI CODE — terminal overlay
   ===================================================================== */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'];
let konamiIdx = 0;

const kOverlay = document.getElementById('k-overlay');
const kClose = document.getElementById('k-close');
const kBody = document.getElementById('k-body');
const kInput = document.getElementById('k-input');

// ── Command definitions ──────────────────────────────────────────────
const FS = {
  'id.txt': [
    'UID:      stavros.papasotiropoulos',
    'ROLE:     soc_l1_analyst',
    'EMPLOYER: adacom',
    'GROUPS:   engineers, investigators, educators',
    'LOCATION: Athens, Greece',
  ],
  'skills.txt': [
    'BLUE TEAM:    Wazuh SIEM, Wireshark, Incident Response, Log Analysis',
    'RED TEAM:     Nmap, Metasploit, Burp Suite, Hydra',
    'DEV:          Python, React.js, JavaScript, HTML/CSS, WordPress',
    'ENGINEERING:  AutoCAD, MATLAB, Circuit Design, Embedded Systems',
    'SOFT:         Teaching, Technical Writing, Mentoring',
  ],
  'certs.txt': [
    'SOC Analyst L1 (SAL1) .... TryHackMe   [07/2025 - 07/2028]',
    'eCPPT (Pen Tester)    .... INE          [03/2025 - 03/2028]',
    'Jr Penetration Tester .... TryHackMe    [05/2024]',
    'Ethical Hacking Boot  .... Udemy        [04-06/2024]',
    'Meta Front-End Dev    .... Meta         [03-04/2023]',
    'Responsive Web Design .... freeCodeCamp [01-02/2022]',
    'JavaScript Complete   .... Udemy        [02-03/2024]',
    'Google UX Design      .... Google       [06-08/2022]',
    'Google IT Support     .... Google       [08-10/2023]',
    'Electrical Design     .... Udemy        [08-10/2023]',
    'Energy Prod & Safety  .... Univ Buffalo [08-09/2023]',
  ],
  'contact.txt': [
    'EMAIL:    spapasotiropoulos@gmail.com',
    'LINKEDIN: /in/stavros-papasotiropoulos-b35302200',
    'GITHUB:   /StevePapasot',
    'PLATFORM: greek-eduplatform-re-fc99.bolt.host',
  ],
};

const COMMANDS = {
  help: () => [
    { cls: 'k-line--hdr', txt: 'CLASSIFIED TERMINAL — AVAILABLE COMMANDS' },
    { cls: 'k-line--out', txt: '  whoami     — identity record' },
    { cls: 'k-line--out', txt: '  id         — full user entry' },
    { cls: 'k-line--out', txt: '  ls         — list files in this system' },
    { cls: 'k-line--out', txt: '  cat <file> — read a file (e.g. cat skills.txt)' },
    { cls: 'k-line--out', txt: '  skills     — dump skill tree' },
    { cls: 'k-line--out', txt: '  certs      — certification log' },
    { cls: 'k-line--out', txt: '  contact    — comms channels' },
    { cls: 'k-line--out', txt: '  ping       — latency test' },
    { cls: 'k-line--out', txt: '  date       — current timestamp' },
    { cls: 'k-line--out', txt: '  clear      — flush terminal buffer' },
    { cls: 'k-line--out', txt: '  exit       — close this terminal' },
    { cls: 'k-line--blank', txt: '' },
  ],

  whoami: () => [
    { cls: 'k-line--ok', txt: 'stavros.papasotiropoulos' },
    { cls: 'k-line--out', txt: 'SOC L1 Analyst · OSINT Investigator · Engineer · Educator' },
    { cls: 'k-line--out', txt: 'Athens, Greece  [37.9838°N, 23.7275°E]' },
    { cls: 'k-line--blank', txt: '' },
  ],

  id: () => [
    { cls: 'k-line--hdr', txt: '== IDENTITY RECORD ==' },
    ...FS['id.txt'].map(t => ({ cls: 'k-line--out', txt: t })),
    { cls: 'k-line--blank', txt: '' },
  ],

  ls: () => [
    { cls: 'k-line--hdr', txt: '/home/stavros' },
    ...Object.keys(FS).map(f => ({ cls: 'k-line--ok', txt: `  ${f}` })),
    { cls: 'k-line--blank', txt: '' },
  ],

  skills: () => [
    { cls: 'k-line--hdr', txt: '== SKILL TREE ==' },
    ...FS['skills.txt'].map(t => ({ cls: 'k-line--out', txt: `  ${t}` })),
    { cls: 'k-line--blank', txt: '' },
  ],

  certs: () => [
    { cls: 'k-line--hdr', txt: '== CERTIFICATION LOG ==' },
    ...FS['certs.txt'].map(t => ({ cls: 'k-line--out', txt: `  ${t}` })),
    { cls: 'k-line--blank', txt: '' },
  ],

  contact: () => [
    { cls: 'k-line--hdr', txt: '== COMMS CHANNELS ==' },
    ...FS['contact.txt'].map(t => ({ cls: 'k-line--out', txt: `  ${t}` })),
    { cls: 'k-line--blank', txt: '' },
  ],

  ping: () => [
    { cls: 'k-line--out', txt: 'PING 0.0.0.0 (spapasotiropoulos@gmail.com)' },
    { cls: 'k-line--ok', txt: `  64 bytes from node_07.ath: time=${(Math.random() * 4 + 1).toFixed(2)}ms` },
    { cls: 'k-line--ok', txt: `  64 bytes from node_07.ath: time=${(Math.random() * 4 + 1).toFixed(2)}ms` },
    { cls: 'k-line--ok', txt: '  --- 0% packet loss · response: HIRE ME ---' },
    { cls: 'k-line--blank', txt: '' },
  ],

  date: () => [
    { cls: 'k-line--out', txt: new Date().toUTCString() },
    { cls: 'k-line--blank', txt: '' },
  ],

  clear: () => 'CLEAR',
  exit: () => 'CLOSE',

  // Easter egg inside the easter egg
  konami: () => [
    { cls: 'k-line--warn', txt: '> you found the terminal. nice.' },
    { cls: 'k-line--warn', txt: '> if you are a recruiter, email me.' },
    { cls: 'k-line--warn', txt: '> if you are a threat actor, close the tab.' },
    { cls: 'k-line--blank', txt: '' },
  ],
};

function kWrite(lines) {
  lines.forEach(({ cls, txt }) => {
    const s = document.createElement('span');
    s.className = `k-line ${cls}`;
    s.textContent = txt;
    kBody.appendChild(s);
  });
  kBody.scrollTop = kBody.scrollHeight;
}

function kExec(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Echo the command
  const echo = document.createElement('span');
  echo.className = 'k-line k-line--cmd';
  echo.textContent = raw;
  kBody.appendChild(echo);

  if (cmd === 'cat') {
    const file = args[0];
    if (!file) {
      kWrite([{ cls: 'k-line--err', txt: 'cat: missing operand' }]);
    } else if (FS[file]) {
      kWrite([
        { cls: 'k-line--hdr', txt: `== ${file} ==` },
        ...FS[file].map(t => ({ cls: 'k-line--out', txt: t })),
        { cls: 'k-line--blank', txt: '' },
      ]);
    } else {
      kWrite([
        { cls: 'k-line--err', txt: `cat: ${file}: No such file or directory` },
        { cls: 'k-line--out', txt: 'Hint: run "ls" to see available files' },
        { cls: 'k-line--blank', txt: '' },
      ]);
    }
    return;
  }

  if (!COMMANDS[cmd]) {
    kWrite([
      { cls: 'k-line--err', txt: `${cmd}: command not found` },
      { cls: 'k-line--out', txt: 'Type "help" for available commands.' },
      { cls: 'k-line--blank', txt: '' },
    ]);
    return;
  }

  const result = COMMANDS[cmd](args);
  if (result === 'CLEAR') { kBody.innerHTML = ''; return; }
  if (result === 'CLOSE') { closeKonami(); return; }
  kWrite(result);
}

function openKonami() {
  kOverlay.classList.add('is-open');
  kOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => kInput && kInput.focus(), 400);
  if (kBody.children.length === 0) {
    kWrite([
      { cls: 'k-line--ok', txt: '  KONAMI CODE ACCEPTED — CLASSIFIED ACCESS GRANTED' },
      { cls: 'k-line--out', txt: '  ──────────────────────────────────────────────────' },
      { cls: 'k-line--out', txt: '  Welcome, operator. Type "help" for command index.' },
      { cls: 'k-line--blank', txt: '' },
    ]);
  }
}
function closeKonami() {
  kOverlay.classList.remove('is-open');
  kOverlay.setAttribute('aria-hidden', 'true');
  konamiIdx = 0;
}

// Global key listener for the sequence
window.addEventListener('keydown', (e) => {
  // If terminal is open, handle input in the input field — don't advance Konami
  if (kOverlay.classList.contains('is-open')) return;

  const key = e.key;
  if (key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) { konamiIdx = 0; openKonami(); }
  } else {
    konamiIdx = key === KONAMI[0] ? 1 : 0;
  }
});

// Terminal input submission
kInput && kInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = kInput.value.trim();
    if (val) kExec(val);
    kInput.value = '';
  }
  if (e.key === 'Escape') closeKonami();
});

kClose && kClose.addEventListener('click', closeKonami);

// Click outside the terminal box closes it
kOverlay && kOverlay.addEventListener('click', (e) => {
  if (e.target === kOverlay) closeKonami();
});


/* =====================================================================
   ✦ PROJECT NODE DATA — the 8 clickable nodes in the 3D scene
   ===================================================================== */
const PROJECT_NODES = [
  {
    label: 'DEPLOYMENT',
    title: 'Wazuh SOC Lab',
    body: 'Home-built Security Operations Center on Linux. Endpoints log to Wazuh SIEM; custom detection rules, alert triage, brute-force and PowerShell investigation. Simulated enterprise threat environment.',
    chips: ['Wazuh', 'Linux', 'SIEM', 'Incident Response', 'Threat Hunting'],
    link: '#cyber',
    linkLabel: '→ View Cyber Module',
  },
  {
    label: 'PLATFORM',
    title: 'Greek EduPlatform',
    body: 'A full educational platform built for Greek students — curriculum, exercises and resources for Electrical Engineering courses. Deployed on Bolt.host, built with React-compatible tooling.',
    chips: ['React', 'JavaScript', 'HTML/CSS', 'Curriculum Design'],
    link: 'https://greek-eduplatform-re-fc99.bolt.host/',
    linkLabel: '→ Visit Platform',
  },
  {
    label: 'CERTIFICATION',
    title: 'eCPPT — INE',
    body: 'Certified Professional Penetration Tester by INE. Covers advanced exploitation, Active Directory attacks, pivoting, post-exploitation and professional report writing.',
    chips: ['Penetration Testing', 'AD Attacks', 'Pivoting', 'Report Writing'],
    link: '#cyber',
    linkLabel: '→ View Certifications',
  },
  {
    label: 'EMPLOYMENT',
    title: 'Adacom SOC',
    body: 'SOC L1 Analyst at Adacom (2025–present). Daily triage of security alerts, playbook execution, client advisory on containment actions. Real-world threat detection.',
    chips: ['SOC', 'Alert Triage', 'Playbooks', 'Client Advisory'],
    link: 'https://www.linkedin.com/in/stavros-papasotiropoulos-b35302200/',
    linkLabel: '→ LinkedIn Profile',
  },
  {
    label: 'EDUCATION',
    title: 'ASPAITE BSc',
    body: 'Bachelor\'s in Educational Electrical & Electronic Engineering (2018–2025). Covered circuit design, digital/analog systems, embedded systems, telecom and network fundamentals.',
    chips: ['Circuit Design', 'MATLAB', 'AutoCAD', 'Embedded Systems'],
    link: '#engineer',
    linkLabel: '→ View Engineer Module',
  },
  {
    label: 'REPOSITORY',
    title: 'GitHub — edu-platform',
    body: 'Source code for the educational platform project — built to scale tutoring beyond individual sessions. Open repository on GitHub.',
    chips: ['React', 'Open Source', 'Education', 'JavaScript'],
    link: 'https://github.com/StevePapasot/edu-platform',
    linkLabel: '→ Open Repository',
  },
  {
    label: 'EMPLOYMENT',
    title: 'CoreConcepts — Web Dev',
    body: 'Web Developer at CoreConcepts, Athens (2023). Designed and built dynamic, responsive WordPress sites for a diverse client base. Deep UX focus and client-satisfaction driven delivery.',
    chips: ['WordPress', 'Web Dev', 'UX Design', 'Responsive Design'],
    link: 'https://www.linkedin.com/in/stavros-papasotiropoulos-b35302200/',
    linkLabel: '→ LinkedIn Profile',
  },
  {
    label: 'CERTIFICATION',
    title: 'TryHackMe SAL1',
    body: 'SOC Analyst L1 certification from TryHackMe (2025). Covers SIEM, log analysis, threat detection, incident response and blue-team fundamentals.',
    chips: ['SIEM', 'Blue Team', 'Log Analysis', 'Incident Response'],
    link: '#cyber',
    linkLabel: '→ View Cyber Module',
  },
];


/* =====================================================================
   ✦ NODE-CARD DOM ELEMENTS + OPEN/CLOSE HELPERS
   ===================================================================== */
const nodeCard = document.getElementById('node-card');
const ncTag = document.getElementById('nc-tag');
const ncTitle = document.getElementById('nc-title');
const ncBody = document.getElementById('nc-body');
const ncChips = document.getElementById('nc-chips');
const ncLink = document.getElementById('nc-link');
const ncLinkLabel = document.getElementById('nc-link-label');
const ncClose = document.getElementById('nc-close');

function openNodeCard(proj) {
  ncTag.textContent = proj.label;
  ncTitle.textContent = proj.title;
  ncBody.textContent = proj.body;
  ncLinkLabel.textContent = proj.linkLabel;
  ncLink.href = proj.link;

  // Is it an anchor or external link?
  if (proj.link.startsWith('#')) {
    ncLink.removeAttribute('target');
    ncLink.removeAttribute('rel');
  } else {
    ncLink.setAttribute('target', '_blank');
    ncLink.setAttribute('rel', 'noopener');
  }

  // Rebuild chips
  ncChips.innerHTML = '';
  proj.chips.forEach((c) => {
    const li = document.createElement('li');
    li.textContent = c;
    ncChips.appendChild(li);
  });

  nodeCard.classList.add('is-open');
  nodeCard.setAttribute('aria-hidden', 'false');
}

function closeNodeCard() {
  nodeCard.classList.remove('is-open');
  nodeCard.setAttribute('aria-hidden', 'true');
}

ncClose && ncClose.addEventListener('click', closeNodeCard);
// Click outside the card panel
nodeCard && nodeCard.addEventListener('click', (e) => {
  if (e.target === nodeCard) closeNodeCard();
});


/* =====================================================================
   THREE.JS — MAIN SCENE
   ===================================================================== */
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(CONFIG.bgColor, CONFIG.fogDensity);

const camera = new THREE.PerspectiveCamera(
  72, window.innerWidth / window.innerHeight, 0.1, 500
);
camera.position.set(0, 0, CONFIG.cameraStartZ);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(CONFIG.bgColor, 1);


/* --- LIGHTING ----------------------------------------------------- */
scene.add(new THREE.AmbientLight(0x4b5fd9, 0.5));

const cyanLight = new THREE.PointLight(0x00e5ff, 2.2, 70);
cyanLight.position.set(8, 6, 4);
scene.add(cyanLight);

const greenLight = new THREE.PointLight(0x5fff9f, 1.6, 70);
greenLight.position.set(-8, -6, 0);
scene.add(greenLight);

scene.add(new THREE.PointLight(0xffffff, 0.8, 50));


/* --- REGULAR NODES ------------------------------------------------ */
const nodeGroup = new THREE.Group();
const nodes = [];
const nodeGeometry = new THREE.IcosahedronGeometry(CONFIG.nodeSize, 0);

const nodeMaterials = {
  cyan: new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.6, wireframe: true }),
  green: new THREE.MeshStandardMaterial({ color: 0x5fff9f, emissive: 0x5fff9f, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.6, wireframe: true }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4faff, emissive: 0xf4faff, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.6, wireframe: true }),
};

for (let i = 0; i < CONFIG.nodeCount; i++) {
  const r = Math.random();
  const mat = r < 0.65 ? nodeMaterials.cyan : r < 0.88 ? nodeMaterials.green : nodeMaterials.white;
  const node = new THREE.Mesh(nodeGeometry, mat);

  const z = -((i / CONFIG.nodeCount) * CONFIG.tunnelLength) - 4;
  const angle = Math.random() * Math.PI * 2;
  const radius = (0.4 + Math.random() * 0.6) * CONFIG.tunnelRadius;

  node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  node.userData = {
    originalY: node.position.y,
    originalX: node.position.x,
    floatPhase: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.6,
    isProject: false,
  };
  nodeGroup.add(node);
  nodes.push(node);
}


/* --- ✦ PROJECT NODES — brighter, larger, distinct geometry -------- */
const projectMeshes = []; // these are raycasted on click

const projGeo = new THREE.OctahedronGeometry(0.45, 0); // bigger + different shape = easy to spot
const projMat = new THREE.MeshStandardMaterial({
  color: 0x00e5ff,
  emissive: 0x00e5ff,
  emissiveIntensity: 3.5,
  roughness: 0.1,
  metalness: 0.9,
});
// Second material for when the node is hovered
const projMatHover = new THREE.MeshStandardMaterial({
  color: 0x5fff9f,
  emissive: 0x5fff9f,
  emissiveIntensity: 4.5,
  roughness: 0.1,
  metalness: 0.9,
});

PROJECT_NODES.forEach((proj, i) => {
  const mesh = new THREE.Mesh(projGeo, projMat.clone());

  // Spread project nodes evenly through the tunnel, slightly inward
  const frac = (i + 0.5) / PROJECT_NODES.length;
  const z = -(frac * CONFIG.tunnelLength * 0.9) - 10;
  const angle = (i / PROJECT_NODES.length) * Math.PI * 2;
  const r = CONFIG.tunnelRadius * 0.55;

  mesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r, z);
  mesh.userData = {
    originalY: mesh.position.y,
    originalX: mesh.position.x,
    floatPhase: Math.random() * Math.PI * 2,
    rotSpeed: 0.8,
    isProject: true,
    project: proj,
    hovered: false,
  };

  nodeGroup.add(mesh);
  projectMeshes.push(mesh);
});

scene.add(nodeGroup);


/* --- CONNECTION LINES + DATA PACKETS ------------------------------ */
const allNodes = [...nodes, ...projectMeshes];
const linePositions = [];
const connections = [];

for (let i = 0; i < allNodes.length; i++) {
  const a = allNodes[i].position;
  const dists = [];
  for (let j = 0; j < allNodes.length; j++) {
    if (i === j) continue;
    const d = a.distanceTo(allNodes[j].position);
    if (d < CONFIG.connectRadius) dists.push({ j, d });
  }
  dists.sort((x, y) => x.d - y.d);
  dists.slice(0, CONFIG.maxConnPerNode).forEach(({ j }) => {
    linePositions.push(a.x, a.y, a.z, allNodes[j].position.x, allNodes[j].position.y, allNodes[j].position.z);
    connections.push({ a: allNodes[i], b: allNodes[j] });
  });
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
const lineMesh = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.22 }));
scene.add(lineMesh);

// Data packets
const packetGeo = new THREE.SphereGeometry(0.07, 8, 8);
const packets = [];
for (let i = 0; i < CONFIG.packetCount; i++) {
  const m = new THREE.Mesh(
    packetGeo,
    new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xffffff : 0x5fff9f })
  );
  m.userData = {
    conn: connections[Math.floor(Math.random() * connections.length)],
    t: Math.random(),
    speed: CONFIG.packetSpeed * (0.6 + Math.random() * 0.8),
  };
  scene.add(m);
  packets.push(m);
}


/* --- CENTRAL CORE ------------------------------------------------- */
const coreGroup = new THREE.Group();
coreGroup.add(new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.6, 1),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.4 })
));
const coreInner = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.5, transparent: true, opacity: 0.7 })
);
coreGroup.add(coreInner);
const coreRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.02, 8, 64),
  new THREE.MeshBasicMaterial({ color: 0x5fff9f, transparent: true, opacity: 0.6 })
);
coreRing.rotation.x = Math.PI / 2;
coreGroup.add(coreRing);
coreGroup.position.set(0, 0, -CONFIG.tunnelLength / 2);
scene.add(coreGroup);


/* --- PARTICLES ---------------------------------------------------- */
const pPos = new Float32Array(CONFIG.particleCount * 3);
for (let i = 0; i < CONFIG.particleCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 90;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
  pPos[i * 3 + 2] = -Math.random() * CONFIG.tunnelLength;
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0x7aa9ff, size: 0.04, transparent: true, opacity: 0.7, sizeAttenuation: true }));
scene.add(particles);


/* --- CIRCUIT GRID ------------------------------------------------- */
const grid = new THREE.GridHelper(CONFIG.tunnelLength * 1.2, 60, 0x00e5ff, 0x0a1a3a);
grid.position.y = -CONFIG.tunnelRadius - 1;
grid.position.z = -CONFIG.tunnelLength / 2;
grid.material.transparent = true;
grid.material.opacity = 0.18;
scene.add(grid);


/* =====================================================================
   ✦ RAYCASTER — click detection on project nodes
   ===================================================================== */
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

// Increase raycaster threshold for mesh picking (doesn't apply to meshes, but good to have)
raycaster.params.Points.threshold = 0.3;

function getMouseNDC(event) {
  // Handles both mouse and touch events
  const e = event.touches ? event.touches[0] : event;
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function handleCanvasClick(event) {
  // Ignore if Konami terminal is open
  if (kOverlay.classList.contains('is-open')) return;

  getMouseNDC(event);
  raycaster.setFromCamera(mouseNDC, camera);

  const hits = raycaster.intersectObjects(projectMeshes, false);
  if (hits.length > 0) {
    const proj = hits[0].object.userData.project;
    if (proj) openNodeCard(proj);
  } else {
    // Clicking away from a project node closes the card
    closeNodeCard();
  }
}

canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchend', handleCanvasClick, { passive: true });

// Hover cursor feedback on desktop
canvas.addEventListener('mousemove', (e) => {
  getMouseNDC(e);
  raycaster.setFromCamera(mouseNDC, camera);
  const hits = raycaster.intersectObjects(projectMeshes, false);
  canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
});


/* =====================================================================
   SCROLL → CAMERA + PROGRESS
   ===================================================================== */
const cameraState = { targetZ: CONFIG.cameraStartZ, currentZ: CONFIG.cameraStartZ };
const progressFill = document.getElementById('progress-fill');
const progressPct = document.getElementById('progress-pct');

ScrollTrigger.create({
  trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    cameraState.targetZ = CONFIG.cameraStartZ + (CONFIG.cameraEndZ - CONFIG.cameraStartZ) * p;
    if (progressFill) progressFill.style.width = `${p * 100}%`;
    if (progressPct) progressPct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
  },
});

// Section fade-ins
gsap.utils.toArray('.module').forEach((sec) => {
  gsap.fromTo(sec, { opacity: 0, y: 60 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: sec, start: 'top 75%', end: 'top 30%', scrub: 1 },
  });
});

// Horizontal toolkit
const toolkit = document.getElementById('toolkit');
const rack = document.getElementById('toolkit-rack');
if (toolkit && rack && window.innerWidth > 1100) {
  ScrollTrigger.create({
    trigger: toolkit, start: 'top top', end: 'bottom bottom', scrub: 1,
    onUpdate: (self) => {
      const d = rack.scrollWidth - window.innerWidth + 200;
      rack.style.transform = `translate3d(${-d * self.progress}px, 0, 0)`;
    },
  });
}


/* =====================================================================
   MAIN ANIMATION LOOP
   ===================================================================== */
const clock = new THREE.Clock();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

let frameCount = 0;
let lastFpsTime = performance.now();
const fpsEl = document.getElementById('fps-readout');

function animate(now) {
  const t = clock.getElapsedTime();
  const dt = clock.getDelta();

  // FPS
  frameCount++;
  if (now - lastFpsTime >= 1000) {
    if (fpsEl) fpsEl.textContent = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }

  // Camera lerp
  cameraState.currentZ += (cameraState.targetZ - cameraState.currentZ) * CONFIG.cameraEase;
  camera.position.z = cameraState.currentZ;
  camera.position.x = Math.sin(t * 0.15) * 0.5;
  camera.position.y = Math.cos(t * 0.2) * 0.35;
  camera.rotation.z = Math.sin(t * 0.1) * 0.02;
  camera.lookAt(0, 0, camera.position.z - 5);

  // Float regular nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const ud = n.userData;
    n.position.y = ud.originalY + Math.sin(t * CONFIG.floatSpeed + ud.floatPhase) * CONFIG.floatAmp;
    n.position.x = ud.originalX + Math.cos(t * CONFIG.floatSpeed * 0.7 + ud.floatPhase) * CONFIG.floatAmp * 0.5;
    n.rotation.x += ud.rotSpeed * dt;
    n.rotation.y += ud.rotSpeed * dt * 0.7;
  }

  // ✦ Animate project nodes — faster spin, pulsing emissive
  for (let i = 0; i < projectMeshes.length; i++) {
    const m = projectMeshes[i];
    const ud = m.userData;
    m.position.y = ud.originalY + Math.sin(t * CONFIG.floatSpeed * 1.3 + ud.floatPhase) * CONFIG.floatAmp * 1.5;
    m.position.x = ud.originalX + Math.cos(t * CONFIG.floatSpeed * 0.9 + ud.floatPhase) * CONFIG.floatAmp;
    m.rotation.x += ud.rotSpeed * dt;
    m.rotation.y += ud.rotSpeed * dt;
    // Pulse emissive so project nodes clearly stand out
    m.material.emissiveIntensity = 2.5 + Math.sin(t * 3 + i) * 1.5;
  }

  // Node-group + line drift
  nodeGroup.rotation.z = Math.sin(t * 0.05) * 0.05;
  lineMesh.rotation.z = nodeGroup.rotation.z;

  // Particle parallax
  particles.rotation.y = t * 0.012;

  // Breathing lights
  cyanLight.intensity = 1.8 + Math.sin(t * 1.2) * 0.5;
  greenLight.intensity = 1.3 + Math.cos(t * 0.9) * 0.4;

  // Data packets
  for (let i = 0; i < packets.length; i++) {
    const p = packets[i];
    p.userData.t += p.userData.speed * dt;
    if (p.userData.t >= 1) {
      p.userData.conn = connections[Math.floor(Math.random() * connections.length)];
      p.userData.t = 0;
    }
    tmpA.copy(p.userData.conn.a.position);
    tmpB.copy(p.userData.conn.b.position);
    p.position.lerpVectors(tmpA, tmpB, p.userData.t);
  }

  // Central core
  coreGroup.rotation.x = t * 0.2;
  coreGroup.rotation.y = t * 0.3;
  coreRing.rotation.z = t * 0.5;
  coreInner.material.emissiveIntensity = 2.2 + Math.sin(t * 2) * 0.8;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate(performance.now());


/* =====================================================================
   RESIZE
   ===================================================================== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  ScrollTrigger.refresh();
});


/* =====================================================================
   BOOT + CLOCKS + THREAT FEED + COUNTERS + TICKER + HERO TERMINAL
   (all identical to v2 — preserved below)
   ===================================================================== */

// -- BOOT -----------------------------------------------------------
const bootLog = document.getElementById('boot-log');
const bootBar = document.getElementById('boot-bar-fill');
const bootEl = document.getElementById('boot');

const bootLines = [
  '[00:00.01] BOOT_SEQUENCE_INIT',
  '[00:00.04] kernel ............... papasotiropoulos@v3.0',
  '[00:00.09] node_id .............. 0x07.ATH',
  '[00:00.14] modules .............. engineer | cyber | educator',
  '[00:00.19] siem_link ............ ESTABLISHED',
  '[00:00.23] osint_feed ........... SYNCED',
  '[00:00.27] project_nodes ........ 8 INDEXED',
  '[00:00.31] konami_terminal ...... ARMED ⬡',
  '[00:00.35] mission_console ...... READY ✓',
];

(function runBoot() {
  let i = 0;
  function next() {
    if (i >= bootLines.length) { setTimeout(() => bootEl.classList.add('is-done'), 350); return; }
    bootLog.textContent += bootLines[i] + '\n';
    bootBar.style.width = `${((i + 1) / bootLines.length) * 100}%`;
    i++;
    setTimeout(next, 130 + Math.random() * 90);
  }
  next();
})();

// -- CLOCKS ---------------------------------------------------------
const utcEl = document.getElementById('clock-utc');
const athEl = document.getElementById('clock-ath');
function tickClocks() {
  const now = new Date();
  if (utcEl) utcEl.textContent = now.toISOString().substring(11, 19);
  if (athEl) athEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Europe/Athens' });
}
tickClocks();
setInterval(tickClocks, 1000);

// -- THREAT FEED ----------------------------------------------------
const FEED_TEMPLATES = [
  { kind: 'block', txt: 'brute-force ssh', ip: true },
  { kind: 'alert', txt: 'PowerShell EncodedCommand', ip: false },
  { kind: 'info', txt: 'Wazuh rule 5710 triggered', ip: false },
  { kind: 'block', txt: 'DNS exfil → tor exit', ip: true },
  { kind: 'alert', txt: 'SMB share enumeration', ip: true },
  { kind: 'info', txt: 'SIEM ingest 1.2k ev/s', ip: false },
  { kind: 'block', txt: 'credential stuffing', ip: true },
  { kind: 'alert', txt: 'suspicious mshta.exe', ip: false },
  { kind: 'info', txt: 'asset quarantine confirmed', ip: false },
  { kind: 'block', txt: '14 failed logins · acct', ip: true },
  { kind: 'alert', txt: 'Mimikatz signature obs.', ip: false },
  { kind: 'info', txt: 'OSINT pivot: domain→ASN', ip: false },
  { kind: 'block', txt: 'C2 beacon → blocked', ip: true },
];
const feedEl = document.getElementById('threat-feed');
const FEED_MAX = 16;
function randomIP() { const o = () => Math.floor(Math.random() * 256); return `${o()}.${o()}.${o()}.${o()}`; }
function pushFeedItem() {
  if (!feedEl) return;
  const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
  const li = document.createElement('li');
  li.className = `is-${tpl.kind}`;
  li.innerHTML = `<time>${new Date().toLocaleTimeString('en-GB', { hour12: false })}</time><span><b>${tpl.kind.toUpperCase()}</b> · ${tpl.txt}${tpl.ip ? ` · <em style="color:var(--cyan)">${randomIP()}</em>` : ''}</span>`;
  feedEl.prepend(li);
  while (feedEl.children.length > FEED_MAX) feedEl.removeChild(feedEl.lastChild);
}
for (let i = 0; i < 8; i++) pushFeedItem();
(function loopFeed() { pushFeedItem(); setTimeout(loopFeed, 1200 + Math.random() * 2400); })();

// -- COUNTERS -------------------------------------------------------
document.querySelectorAll('[data-counter]').forEach((el) => {
  const target = +el.dataset.counter;
  gsap.to(el, { innerText: target, duration: 1.6, ease: 'power2.out', snap: { innerText: 1 }, delay: 0.4, onUpdate() { el.innerText = Math.floor(el.innerText); } });
});

// -- TICKER ---------------------------------------------------------
const TICKER_ITEMS = ['STATUS · ALL SYSTEMS NOMINAL', 'SOC L1 ANALYST · ADACOM · ATHENS', 'eCPPT · CERTIFIED PENETRATION TESTER', 'WAZUH SIEM · LAB ENV · OPERATIONAL', 'PYTHON · REACT.JS · BURP · NMAP · METASPLOIT', 'OSINT · INVESTIGATIVE · ENUMERATION', 'EDUCATIONAL ELECTRICAL ENGINEERING · ASPAITE', 'PRIVATE TUTOR · 2021–PRESENT', 'CLICK A GLOWING NODE TO PULL ITS FILE', '↑↑↓↓←→←→BA // CLASSIFIED ACCESS'];
const tickerEl = document.getElementById('ticker');
if (tickerEl) {
  const html = TICKER_ITEMS.map(t => `<span>${t}</span>`).join('');
  tickerEl.innerHTML = html + html;
}

// -- HERO TERMINAL --------------------------------------------------
const heroTerm = document.getElementById('hero-terminal');
const heroLines = [
  { type: 'cmd', text: '$ whoami' },
  { type: 'out', text: '> stavros.papasotiropoulos' },
  { type: 'cmd', text: '$ id' },
  { type: 'out', text: '> uid=1000 role=soc_l1_analyst' },
  { type: 'out', text: '> groups=engineers,osint,educators' },
  { type: 'cmd', text: '$ ls /projects' },
  { type: 'out', text: '> wazuh-soc  eduplatform  ecppt-lab' },
  { type: 'cmd', text: '$ status' },
  { type: 'ok', text: '> [OK] mission console online ✓' },
  { type: 'cur', text: '$ ' },
];
(function typeHeroTerminal() {
  if (!heroTerm) return;
  heroTerm.innerHTML = '';
  let li = 0, ci = 0, curLine = null;
  function step() {
    if (li >= heroLines.length) return;
    const ln = heroLines[li];
    if (ci === 0) { curLine = document.createElement('span'); curLine.className = ln.type; heroTerm.appendChild(curLine); }
    if (ln.type === 'cur') { curLine.textContent = ln.text; return; }
    if (ci < ln.text.length) {
      curLine.textContent += ln.text[ci]; ci++;
      setTimeout(step, (ln.type === 'cmd' ? 28 : 12) + Math.random() * 15);
    } else {
      heroTerm.appendChild(document.createTextNode('\n')); li++; ci = 0;
      setTimeout(step, ln.type === 'cmd' ? 220 : 120);
    }
  }
  setTimeout(step, 1700);
})();

// -- DRAG-TO-ROTATE OSINT EXPLORER ----------------------------------
(function initExplorer() {
  const exCanvas = document.getElementById('explorer-canvas');
  if (!exCanvas) return;
  const exScene = new THREE.Scene();
  const exCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  exCamera.position.set(0, 0, 6);
  const exRenderer = new THREE.WebGLRenderer({ canvas: exCanvas, antialias: true, alpha: true });
  exRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  function size() { const w = exCanvas.clientWidth, h = exCanvas.clientHeight; exRenderer.setSize(w, h, false); exCamera.aspect = w / h; exCamera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  exScene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const exLight = new THREE.PointLight(0x00e5ff, 1.5, 20); exLight.position.set(3, 3, 3); exScene.add(exLight);
  const exGroup = new THREE.Group(); exScene.add(exGroup);
  const sGeo = new THREE.IcosahedronGeometry(2.4, 2);
  exGroup.add(new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.35 })));
  const verts = sGeo.attributes.position, used = new Set();
  const nGeo = new THREE.IcosahedronGeometry(0.07, 0), mA = new THREE.MeshBasicMaterial({ color: 0x00e5ff }), mB = new THREE.MeshBasicMaterial({ color: 0x5fff9f });
  for (let i = 0; i < verts.count; i += 3) {
    const x = verts.getX(i), y = verts.getY(i), z = verts.getZ(i);
    const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (used.has(key)) continue; used.add(key);
    const n = new THREE.Mesh(nGeo, Math.random() < 0.7 ? mA : mB); n.position.set(x, y, z); exGroup.add(n);
  }
  exGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf4faff })));
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
  exCanvas.addEventListener('mousedown', e => { dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; });
  exCanvas.addEventListener('touchstart', e => { dragging = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; vx = vy = 0; }, { passive: false });
  window.addEventListener('mousemove', e => { if (!dragging) return; vx = (e.clientX - lx) * 0.01; vy = (e.clientY - ly) * 0.01; exGroup.rotation.y += vx; exGroup.rotation.x += vy; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('touchmove', e => { if (!dragging) return; vx = (e.touches[0].clientX - lx) * 0.01; vy = (e.touches[0].clientY - ly) * 0.01; exGroup.rotation.y += vx; exGroup.rotation.x += vy; lx = e.touches[0].clientX; ly = e.touches[0].clientY; e.preventDefault(); }, { passive: false });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('touchend', () => dragging = false);
  (function exTick() { if (!dragging) { exGroup.rotation.y += 0.003 + vx; exGroup.rotation.x += vy; vx *= 0.94; vy *= 0.94; } exRenderer.render(exScene, exCamera); requestAnimationFrame(exTick); })();
})();

// -- ENTRY ANIMATIONS -----------------------------------------------
gsap.from('.hud-top', { opacity: 0, y: -20, duration: 1, ease: 'power2.out', delay: 1.6 });
gsap.from('.rail', { opacity: 0, x: (i) => (i === 0 ? -40 : 40), duration: 1, ease: 'power2.out', delay: 1.8, stagger: 0.15 });
gsap.from('.hud-bottom', { opacity: 0, y: 20, duration: 1, ease: 'power2.out', delay: 2.0 });
gsap.from('.hero__name, .hero__role, .hero__intro, .stat-strip', { opacity: 0, y: 30, duration: 1.2, ease: 'power3.out', stagger: 0.12, delay: 2.2 });