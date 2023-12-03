import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';
import * as CANNON from 'cannon-es'
import Stats from 'stats.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// TODO: add walls
// TODO: randomize dice positions, velocity and angular velocity
// TODO: add dice textures
// TODO: add shadows
// TODO: add sounds
// TODO: add up numbers on the upper face of each die after a roll

let params = {
  'd4Count': 2,
  'd6Count': 0,
  'd8Count': 0,
  'd12Count': 0,
  'd20Count': 1,
};

let scene;
let world;
const objectsToUpdate = [];

const icosahedronGeometry = new THREE.IcosahedronGeometry(0.5, 0);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.5, 0);
const octahedronGeometry = new THREE.OctahedronGeometry(0.5, 0);
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.5, 0);

const material = new THREE.MeshNormalMaterial({ color: 0x00ff00 });

const getPolyhedronShape = (mesh) => {
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', mesh.geometry.getAttribute('position'));

  geometry = BufferGeometryUtils.mergeVertices(geometry);

  const position = geometry.attributes.position.array;
  const index = geometry.index.array;

  const points = [];
  for (let i = 0; i < position.length; i += 3) {
    points.push(new CANNON.Vec3(position[i], position[i + 1], position[i + 2]));
  }
  const faces = [];
  for (let i = 0; i < index.length; i += 3) {
    faces.push([index[i], index[i + 1], index[i + 2]]);
  }

  return new CANNON.ConvexPolyhedron({ vertices: points, faces });
};

const createDie = ({ geometry }) => {
  const mesh = new THREE.Mesh(geometry, material);

  const shape = getPolyhedronShape(mesh);
  const body = new CANNON.Body({
    mass: 1,
    shape,
    position: new CANNON.Vec3((Math.random() - 0.5) * 5, Math.random() * 3 + 1, (Math.random() - 0.5) * 5),
    quaternion: new CANNON.Quaternion((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
    velocity: new CANNON.Vec3((Math.random() - 0.5) * 2, -Math.random() * 2, (Math.random() - 0.5) * 2),
    angularVelocity: new CANNON.Vec3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
  });

  return { mesh, body };
};

const rollDice = () => {
  objectsToUpdate.forEach((object) => {
    world.removeBody(object.body);
    scene.remove(object.mesh);
  });
  objectsToUpdate.splice(0, objectsToUpdate.length);

  // Create param.d20Count icosahedrons
  for (let i = 0; i < params.d20Count; i++) {
    const { mesh, body } = createDie({ geometry: icosahedronGeometry});
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  }
  // Create param.d12Count dodecahedrons
  for (let i = 0; i < params.d12Count; i++) {
    const { mesh, body } = createDie({ geometry: dodecahedronGeometry});
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  }
  // Create param.d8Count octahedrons
  for (let i = 0; i < params.d8Count; i++) {
    const { mesh, body } = createDie({ geometry: octahedronGeometry});
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  }
  // Create param.d6Count cubes
  for (let i = 0; i < params.d6Count; i++) {
    const { mesh, body } = createDie({ geometry: boxGeometry});
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  }
  // Create param.d4Count tetrahedrons
  for (let i = 0; i < params.d4Count; i++) {
    const { mesh, body } = createDie({ geometry: tetrahedronGeometry});
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  }
};

function init() {
  // Create clock
  const clock = new THREE.Clock();

  // Create scene
  scene = new THREE.Scene();

  // const axesHelper = new THREE.AxesHelper( 5 );
  // scene.add( axesHelper );

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.z = 12;
  camera.position.y = 6;
  camera.position.x = 9;
  camera.lookAt(scene.position);
  const tanFOV = Math.tan(((Math.PI / 180) * camera.fov / 2));
  const initialWindowHeight = window.innerHeight;

  function onWindowResize(event) {
    // Adjust camera and renderer on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * ( window.innerHeight / initialWindowHeight));
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
  window.addEventListener('resize', onWindowResize, false);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xdddddd, 0.5);
  directionalLight.position.set(-10, 10, -10);
  directionalLight.lookAt(scene.position);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xdddddd, 0.4);
  directionalLight2.position.set(10, 5, 10);
  directionalLight2.lookAt(scene.position);
  scene.add(directionalLight2);

  // Create physics world
  world = new CANNON.World();
  world.gravity.set(0, - 9.82, 0);

  // Create contact material
  const defaultMaterial = new CANNON.Material('default');
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.4,
      restitution: 0.3,
    },
  );
  world.addContactMaterial(defaultContactMaterial);
  world.defaultContactMaterial = defaultContactMaterial;

  // Create floor
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide }),
  );
  scene.add(floorMesh);
  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: floorShape,
  });
  floorBody.position.set(0, -1, 0);
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
  world.addBody(floorBody);
  floorMesh.position.copy(floorBody.position);
  floorMesh.quaternion.copy(floorBody.quaternion);

  // Create GUI
  const gui = new GUI();
  gui.width = 150;
  gui.add(params, 'd20Count').name('d20').min(0).step(1);
  gui.add(params, 'd12Count').name('d12').min(0).step(1);
  gui.add(params, 'd8Count').name('d8').min(0).step(1);
  gui.add(params, 'd6Count').name('d6').min(0).step(1);
  gui.add(params, 'd4Count').name('d4').min(0).step(1);
  gui.add({ 'Roll Dice': rollDice }, 'Roll Dice');

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  // Roll dice on page load
  rollDice();
  
  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    stats.begin();

    // Update physics world
    const deltaTime = clock.getDelta();
    world.step(1 / 60, deltaTime, 3);

    // Move meshes
    objectsToUpdate.forEach((object) => {
      object.mesh.position.copy(object.body.position);
      object.mesh.quaternion.copy(object.body.quaternion);
    });

    renderer.render(scene, camera);

    stats.end();
  };

  animate();
}

init();
