const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe6f0);
scene.fog = new THREE.FogExp2(0xffe6f0, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffb6c1, 0.8);
dirLight.position.set(15, 25, 20);
scene.add(dirLight);

// Zemin
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshLambertMaterial({ color: 0xd4f5d4 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const grid = new THREE.GridHelper(80, 40, 0xffb6c1, 0xc1eec1);
grid.position.y = 0.01;
scene.add(grid);

// Ağaçlar
function addTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 1.4, 6),
    new THREE.MeshLambertMaterial({ color: 0xd2a679 })
  );
  trunk.position.y = 0.7;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1),
    new THREE.MeshStandardMaterial({ color: 0x98fb98 })
  );
  leaves.position.y = 1.8;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  scene.add(tree);
}

for (let i = 0; i < 15; i++) {
  const rx = (Math.random() - 0.5) * 60;
  const rz = (Math.random() - 0.5) * 60;
  if (Math.abs(rx) > 3 || Math.abs(rz) > 3) addTree(rx, rz);
}

// Kalpler
const hearts = [];
const heartGeo = new THREE.OctahedronGeometry(0.4);
const heartMat = new THREE.MeshStandardMaterial({
  color: 0xff1493,
  emissive: 0xff69b4,
  emissiveIntensity: 0.5
});

for (let i = 0; i < 10; i++) {
  const h = new THREE.Mesh(heartGeo, heartMat);
  h.position.set((Math.random() - 0.5) * 50, 0.8, (Math.random() - 0.5) * 50);
  scene.add(h);
  hearts.push(h);
}

// Karakter
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({ color: 0xff69b4 })
);
player.add(body);

const earGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
const earMat = new THREE.MeshStandardMaterial({ color: 0xff1493 });
const leftEar = new THREE.Mesh(earGeo, earMat);
leftEar.position.set(-0.4, 0.8, 0);
player.add(leftEar);

const rightEar = new THREE.Mesh(earGeo, earMat);
rightEar.position.set(0.4, 0.8, 0);
player.add(rightEar);

player.position.set(0, 0.6, 0);
scene.add(player);

// Kontroller
let moveX = 0, moveZ = 0, velY = 0, onGround = true, score = 0;
const speed = 0.14, gravity = -0.012, jumpForce = 0.28;

const zone = document.getElementById('joystick-zone');
const knob = document.getElementById('joystick-knob');
let touchId = null;

function setStick(touch) {
  const rect = zone.getBoundingClientRect();
  let dx = touch.clientX - (rect.left + 50);
  let dy = touch.clientY - (rect.top + 50);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 35) {
    dx = (dx / dist) * 35;
    dy = (dy / dist) * 35;
  }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  moveX = dx / 35;
  moveZ = dy / 35;
}

zone.addEventListener('touchstart', (e) => {
  touchId = e.changedTouches[0].identifier;
  setStick(e.changedTouches[0]);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === touchId) setStick(e.changedTouches[i]);
  }
}, { passive: false });

window.addEventListener('touchend', (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === touchId) {
      touchId = null;
      knob.style.transform = 'translate(0px, 0px)';
      moveX = 0; moveZ = 0;
    }
  }
});

document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (onGround) {
    velY = jumpForce;
    onGround = false;
  }
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Oyun Döngüsü
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.03;

  if (moveX !== 0 || moveZ !== 0) {
    player.position.x += moveX * speed;
    player.position.z += moveZ * speed;
    player.rotation.y = Math.atan2(moveX, moveZ);
  }

  if (!onGround) {
    player.position.y += velY;
    velY += gravity;
    if (player.position.y <= 0.6) {
      player.position.y = 0.6;
      velY = 0;
      onGround = true;
    }
  }

  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.rotation.y += 0.03;
    h.position.y = 0.8 + Math.sin(time + i) * 0.15;
    if (player.position.distanceTo(h.position) < 1.3) {
      scene.remove(h);
      hearts.splice(i, 1);
      score++;
      document.getElementById('score').innerText = score;
    }
  }

  camera.position.x = player.position.x;
  camera.position.y = player.position.y + 4.5;
  camera.position.z = player.position.z + 7.5;
  camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);

  renderer.render(scene, camera);
}
animate();