import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { initializeScene } from '/pages/template';

const MAX_DICE_COUNT = 200;
const DIE_SCALE = 2;

// TODO: add walls
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

let world;
const objectsToUpdate = [];

const icosahedronGeometry = new THREE.IcosahedronGeometry(DIE_SCALE, 0);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(DIE_SCALE, 0);
const octahedronGeometry = new THREE.OctahedronGeometry(DIE_SCALE, 0);
const boxGeometry = new THREE.BoxGeometry(DIE_SCALE, DIE_SCALE, DIE_SCALE);
const tetrahedronGeometry = new THREE.TetrahedronGeometry(DIE_SCALE, 0);

const material = new THREE.MeshNormalMaterial({ color: 0x00ff00 });

function init() {
  const {
    scene,
    renderer,
    camera,
    gui,
    stats,
  } = initializeScene();

  // Create clock
  const clock = new THREE.Clock();

  // Create camera
  camera.position.set(28, 25, 43);
  camera.fov = 45;
  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);

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
  world.gravity.set(0, - 98.1, 0);
  world.allowSleep = true;

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
      position: new CANNON.Vec3((Math.random() - 0.5) * DIE_SCALE * 10, (Math.random() * 6 + 8) * DIE_SCALE, (Math.random() - 0.5) * DIE_SCALE * 10),
      quaternion: new CANNON.Quaternion((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      velocity: new CANNON.Vec3((Math.random() - 0.5) * DIE_SCALE * 8, -Math.random() * DIE_SCALE, (Math.random() - 0.5) * DIE_SCALE * 8),
      angularVelocity: new CANNON.Vec3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
      sleepSpeedLimit: 1.0,
      sleepTimeLimit: 1.0,
    });
  
    return { mesh, body };
  };
  
  const rollDice = () => {
    // Return early if there are too many dice
    if (params.d20Count + params.d12Count + params.d8Count + params.d6Count + params.d4Count > MAX_DICE_COUNT) {
      alert(`You can't roll more than ${MAX_DICE_COUNT} dice at once!`);
      return;
    }
  
    objectsToUpdate.forEach((object) => {
      world.removeBody(object.body);
      scene.remove(object.mesh);
    });
    objectsToUpdate.splice(0, objectsToUpdate.length);
  
    // Create param.d20Count icosahedrons
    for (let i = 0; i < params.d20Count; i++) {
      const { mesh, body } = createDie({ geometry: icosahedronGeometry });
      objectsToUpdate.push({ mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d12Count dodecahedrons
    for (let i = 0; i < params.d12Count; i++) {
      const { mesh, body } = createDie({ geometry: dodecahedronGeometry });
      objectsToUpdate.push({ mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d8Count octahedrons
    for (let i = 0; i < params.d8Count; i++) {
      const { mesh, body } = createDie({ geometry: octahedronGeometry });
      objectsToUpdate.push({ mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d6Count cubes
    for (let i = 0; i < params.d6Count; i++) {
      const { mesh, body } = createDie({ geometry: boxGeometry });
      objectsToUpdate.push({ mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d4Count tetrahedrons
    for (let i = 0; i < params.d4Count; i++) {
      const { mesh, body } = createDie({ geometry: tetrahedronGeometry });
      objectsToUpdate.push({ mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
  };

  // Create GUI
  gui.width = 150;
  gui.add(params, 'd20Count').name('d20').min(0).step(1);
  gui.add(params, 'd12Count').name('d12').min(0).step(1);
  gui.add(params, 'd8Count').name('d8').min(0).step(1);
  gui.add(params, 'd6Count').name('d6').min(0).step(1);
  gui.add(params, 'd4Count').name('d4').min(0).step(1);
  gui.add({ 'Roll Dice': rollDice }, 'Roll Dice');

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
  }

  animate();
}

init();
