
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ROOT_HEIGHT = 50;
const ROOT_RADIUS = 2;
const BRANCH_ANGLE = Math.PI / 3;
const BRANCHES_PER_LEVEL = 3;

function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.z = 200;
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

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.x = 1;
  directionalLight.position.z = 1;
  scene.add(directionalLight);

  // Create fractal tree
  const geometry = new THREE.CylinderGeometry(ROOT_RADIUS, ROOT_RADIUS, ROOT_HEIGHT, 5); 
  const material = new THREE.MeshPhongMaterial({ color: 0xbbbbbb }); 
  const rootCylinder = new THREE.Mesh(geometry, material);
  scene.add(rootCylinder);

  console.log(rootCylinder);

  const createBranch = (parent, depth) => {
    if (depth > 1) return;
    
    const branch = new THREE.Mesh(geometry, material);
    branch.scale.set(0.7, 0.7, 0.7);

    // Rotate branch around root randomly
    branch.rotateOnAxis(new THREE.Vector3(0, 1, 0), 2 * Math.random() * Math.PI);

    // Put branch at a 60 degree offset from root
    branch.rotateOnAxis(new THREE.Vector3(0, 0, 1), BRANCH_ANGLE);

    // Set branch position
    branch.position.y = ROOT_HEIGHT * (Math.random() - 0.5);
    branch.translateOnAxis(new THREE.Vector3(0, 1, 0), ROOT_HEIGHT * branch.scale.y / 2);

    parent.add(branch);
    console.log('branch', branch);

    // Recursively create more branches
    // createBranch(branch, depth + 1);
    for (let i = 0; i < BRANCHES_PER_LEVEL; i++) {
      createBranch(branch, depth + 1);
    }
  };

  // const cylinder2 = cylinder.clone();
  // cylinder2.scale.set(0.5, 0.5, 0.5);
  // const direction = new THREE.Vector3(0, 1, 0);
  // const axis = new THREE.Vector3(0, 0, 1);
  // cylinder2.rotateOnAxis(axis, BRANCH_ANGLE);
  // cylinder2.position.y = ROOT_HEIGHT * (Math.random() - 0.5);
  // cylinder2.translateOnAxis(direction, ROOT_HEIGHT * cylinder2.scale.y / 2);
  // cylinder.add(cylinder2);

  createBranch(rootCylinder, 0);
  createBranch(rootCylinder, 0);
  createBranch(rootCylinder, 0);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
  };

  animate();
}

init();
