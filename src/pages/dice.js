import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { initializeScene } from '/src/pages/template';

const DIE_TYPES = {
  D4: 'D4',
  D6: 'D6',
  D8: 'D8',
  D12: 'D12',
  D20: 'D20',
};

const MAX_DICE_COUNT = 200;
const DIE_SCALE = 1;
const PLATFORM_SIZE = 35;
const WALL_HEIGHT = 3;

// TODO: add dice textures
// TODO: add sounds
// TODO: add up numbers on the upper face of each die after a roll
// get normals of each face, dot product with -y vector, pick largest

let params = {
  'd4Count': 1,
  'd6Count': 0,
  'd8Count': 1,
  'd12Count': 0,
  'd20Count': 0,
};

let world;
const objectsToUpdate = [];

const OBJECT_TEMPLATE = {
  mesh: null,
  body: null,
  normals: [],
  normalHelpers: [],
};

const icosahedronGeometry = new THREE.IcosahedronGeometry(DIE_SCALE, 0);
const dodecahedronGeometry = new THREE.DodecahedronGeometry(DIE_SCALE, 0);
const octahedronGeometry = new THREE.OctahedronGeometry(DIE_SCALE, 0);
const boxGeometry = new THREE.BoxGeometry(DIE_SCALE, DIE_SCALE, DIE_SCALE);
const tetrahedronGeometry = new THREE.TetrahedronGeometry(DIE_SCALE, 0);

// const material = new THREE.MeshNormalMaterial();
const material = new THREE.MeshStandardMaterial({ color: 0xccaa55, wireframe: true });

function init() {
  const {
    scene,
    renderer,
    camera,
    gui,
    stats,
  } = initializeScene();

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create clock
  const clock = new THREE.Clock();

  // Create camera
  camera.position.set(45, 80, 55);
  camera.fov = 20;
  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xdddddd, 0.6);
  directionalLight.position.set(-5, 30, 20);
  directionalLight.lookAt(scene.position);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.top = PLATFORM_SIZE;
  directionalLight.shadow.camera.bottom = -PLATFORM_SIZE;
  directionalLight.shadow.camera.left = -PLATFORM_SIZE;
  directionalLight.shadow.camera.right = PLATFORM_SIZE;
  directionalLight.shadow.camera.far = 70;
  directionalLight.shadow.mapSize.set(2048, 2048);
  scene.add(directionalLight);

  const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
  scene.add(shadowHelper);

  const directionalLight2 = new THREE.DirectionalLight(0xdddddd, 0.2);
  directionalLight2.position.set(10, 5, 10);
  directionalLight2.lookAt(scene.position);
  scene.add(directionalLight2);

  // Create physics world
  world = new CANNON.World();
  world.gravity.set(0, -98.1, 0);
  // world.gravity.set(0, 0, 0);
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
  const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE),
    surfaceMaterial,
  );
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: floorShape,
  });
  floorBody.position.set(0, 0, 0);
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
  world.addBody(floorBody);
  floorMesh.position.copy(floorBody.position);
  floorMesh.quaternion.copy(floorBody.quaternion);

  // Create walls
  const wallGeometry = new THREE.PlaneGeometry(PLATFORM_SIZE, WALL_HEIGHT);
  const createWall = ({ x, z, rotation }) => {
    const wallMesh = new THREE.Mesh(wallGeometry, surfaceMaterial);
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    const wallShape = new CANNON.Plane();
    const wallBody = new CANNON.Body({
      mass: 0,
      shape: wallShape,
    });
    wallBody.position.set(x, WALL_HEIGHT / 2, z);
    wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
    world.addBody(wallBody);
    wallMesh.position.copy(wallBody.position);
    wallMesh.quaternion.copy(wallBody.quaternion);
  };

  createWall({ x: PLATFORM_SIZE / 2, z: 0, rotation: -Math.PI * 0.5 });
  createWall({ x: -PLATFORM_SIZE / 2, z: 0, rotation: Math.PI * 0.5 });
  createWall({ x: 0, z: PLATFORM_SIZE / 2, rotation: Math.PI });
  createWall({ x: 0, z: -PLATFORM_SIZE / 2, rotation: 0 });

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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  
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
      objectsToUpdate.push({ ...OBJECT_TEMPLATE, mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d12Count dodecahedrons
    for (let i = 0; i < params.d12Count; i++) {
      const { mesh, body } = createDie({ geometry: dodecahedronGeometry });
      objectsToUpdate.push({ ...OBJECT_TEMPLATE, mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d8Count octahedrons
    for (let i = 0; i < params.d8Count; i++) {
      const { mesh, body } = createDie({ geometry: octahedronGeometry });
      objectsToUpdate.push({ ...OBJECT_TEMPLATE, mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d6Count cubes
    for (let i = 0; i < params.d6Count; i++) {
      const { mesh, body } = createDie({ geometry: boxGeometry });
      objectsToUpdate.push({ ...OBJECT_TEMPLATE, mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
    // Create param.d4Count tetrahedrons
    for (let i = 0; i < params.d4Count; i++) {
      const { mesh, body } = createDie({ geometry: tetrahedronGeometry });
      objectsToUpdate.push({ ...OBJECT_TEMPLATE, mesh, body });
      scene.add(mesh);
      world.addBody(body);
    }
  };
  
  const updateFaceNormals = (object) => {
    const tri = new THREE.Triangle();
    const faceCenter = new THREE.Vector3();
    const normalVector = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();

    normalMatrix.getNormalMatrix(object.mesh.matrixWorld);
    const vertexCoords = object.mesh.geometry.attributes.position.array;
    
    for (let i = 0; i < vertexCoords.length / 9; i++) {
      tri.set(
        new THREE.Vector3(vertexCoords[i * 9], vertexCoords[i * 9 + 1], vertexCoords[i * 9 + 2]),
        new THREE.Vector3(vertexCoords[i * 9 + 3], vertexCoords[i * 9 + 4], vertexCoords[i * 9 + 5]),
        new THREE.Vector3(vertexCoords[i * 9 + 6], vertexCoords[i * 9 + 7], vertexCoords[i * 9 + 8]),
      );
      tri.getNormal(normalVector);

      normalVector.applyMatrix3(normalMatrix).normalize();

      // Draw the normal at the center of the face
      faceCenter.addVectors(tri.a, tri.b);
      faceCenter.add(tri.c);
      faceCenter.divideScalar(3);

      // Convert center from local space to world space
      object.mesh.localToWorld(faceCenter);

      if (object.normalHelpers[i]) {
        object.normalHelpers[i].position.copy(faceCenter);
        object.normalHelpers[i].setDirection(normalVector);
      } else {
        const normalHelper = new THREE.ArrowHelper(normalVector, faceCenter, 2, 0x00ff00);
        scene.add(normalHelper);
        object.normalHelpers[i] = normalHelper;
      }

      // TODO: the normals behave weirdly when there are multiple objects

      object.normals[i] = normalVector.clone();
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

      updateFaceNormals(object);

      // TODO: pick normal pointing down, color it red
    });
    console.log(objectsToUpdate)

    stats.end();
    renderer.render(scene, camera);
  }

  animate();
}

init();
