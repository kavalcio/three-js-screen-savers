import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';
import * as CANNON from 'cannon-es'
import Stats from 'stats.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const objectsToUpdate = [];

const icosahedronGeometry = new THREE.IcosahedronGeometry(0.5, 0);
const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.5, 0);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

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

const createIcosahedron = () => {
  const mesh = new THREE.Mesh(icosahedronGeometry, material);

  const shape = getPolyhedronShape(mesh);
  const body = new CANNON.Body({
    mass: 1,
    shape,
    position: new CANNON.Vec3(0, 3, 0),
    angularVelocity: new CANNON.Vec3(4, 1, -3),
  });

  return { mesh, body };
};

const createTetrahedron = () => {
  const mesh = new THREE.Mesh(tetrahedronGeometry, material);

  const shape = getPolyhedronShape(mesh);
  const body = new CANNON.Body({
    mass: 1,
    shape,
    position: new CANNON.Vec3(0, 2, 0),
    angularVelocity: new CANNON.Vec3(-1, 4, 1),
  });

  return { mesh, body };
};

function init() {
  // Create clock
  const clock = new THREE.Clock();

  // Create scene
  const scene = new THREE.Scene();

  const axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.z = 10;
  camera.position.y = 3;
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

  /**
   * PHYSICS --------------------------------------------------------
   */
  const world = new CANNON.World();
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
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5);
  world.addBody(floorBody);
  floorMesh.position.copy(floorBody.position);
  floorMesh.quaternion.copy(floorBody.quaternion);

  // Create iconsahedron
  const icosahedron = createIcosahedron();
  objectsToUpdate.push(icosahedron);
  scene.add(icosahedron.mesh);
  world.addBody(icosahedron.body);

  // Create tetrahedron
  const tetrahedron = createTetrahedron();
  objectsToUpdate.push(tetrahedron);
  scene.add(tetrahedron.mesh);
  world.addBody(tetrahedron.body);
  
  // Create GUI
  const gui = new GUI();
  const rollDice = () => {
    objectsToUpdate.forEach((object) => {
      world.removeBody(object.body);
      scene.remove(object.mesh);
    });
    objectsToUpdate.splice(0, objectsToUpdate.length);

    const { mesh, body } = createIcosahedron();
    objectsToUpdate.push({ mesh, body });
    scene.add(mesh);
    world.addBody(body);
  };
  gui.add({ 'Roll Dice': rollDice }, 'Roll Dice');

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  
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
