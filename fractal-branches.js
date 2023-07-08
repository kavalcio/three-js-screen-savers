import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ROOT_HEIGHT = 70;
const ROOT_RADIUS = 2;
const BRANCH_ANGLE = Math.PI / 3;
const BRANCHES_PER_LEVEL = 3;
const MAX_DEPTH = 5;
const ROTATION_SPEED = 0.001;

// TODO: add some randomization to branches per level, rotationspeed, etc
// TODO: add gui to control parameters
// TODO: add ability to click to add custom branches
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
  const directionalLight = new THREE.DirectionalLight(0xdddddd, 1);
  directionalLight.position.set(1, 0, 1);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xdddddd, 1);
  directionalLight2.position.set(-1, 1, 1);
  scene.add(directionalLight2);

  // Create fractal tree
  const geometry = new THREE.CylinderGeometry(ROOT_RADIUS, ROOT_RADIUS, ROOT_HEIGHT, 5); 
  const material = new THREE.MeshPhongMaterial({ color: 0xbbbbbb }); 

  // Recursive function that creates branches as children of a parent branch.
  const createBranch = (parent, depth) => {
    if (depth > MAX_DEPTH) return;
    
    const branch = new THREE.Mesh(geometry, material);
    branch.scale.set(0.7, 0.7, 0.7);

    // Skip rotation and translation for first branch so that it's straight up
    if (depth > 0) {
      // Rotate branch around parent randomly
      branch.rotateOnAxis(new THREE.Vector3(0, 1, 0), 2 * Math.random() * Math.PI);

      // Put branch at a 60 degree offset from parent
      branch.rotateOnAxis(new THREE.Vector3(0, 0, 1), BRANCH_ANGLE);

      // Set branch position
      branch.position.y = ROOT_HEIGHT * (Math.random() - 0.5);
      branch.translateOnAxis(new THREE.Vector3(0, 1, 0), ROOT_HEIGHT * branch.scale.y / 2);
    }

    parent.add(branch);

    // Recursively create more branches
    for (let i = 0; i < BRANCHES_PER_LEVEL; i++) {
      createBranch(branch, depth + 1);
    }
  };

  const root = new THREE.Object3D();
  root.position.y = -ROOT_HEIGHT / 4;
  scene.add(root);

  createBranch(root, 0);

  // Rotate branches over time
  const animationRotationAxis = new THREE.Vector3(0, 1, 0);
  const rotateBranch = (branch, angle) => {
    branch.rotateOnAxis(animationRotationAxis, angle);
    // Recursively rotate children
    branch.children.forEach(child => {
      rotateBranch(child, angle);
    });
  };

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    rotateBranch(root.children[0], ROTATION_SPEED);

    renderer.render(scene, camera);
  };

  animate();
}

init();
