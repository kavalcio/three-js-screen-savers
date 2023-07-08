import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const BASE_HEIGHT = 70;
const BASE_RADIUS = 2;
const BRANCH_ANGLE = 60;
const BRANCHES_PER_LEVEL = 3;
const RECURSION_DEPTH = 5;
const ROTATION_SPEED = 0.001;

let params = {
  baseHeight: BASE_HEIGHT,
  baseRadius: BASE_RADIUS,
  branchAngle: BRANCH_ANGLE,
  branchesPerLevel: BRANCHES_PER_LEVEL,
  recursionDepth: RECURSION_DEPTH,
  rotationSpeed: ROTATION_SPEED,
};
let paramsToApply = { ...params };

// TODO: add param to control branch shrink rate
// TODO: is it possible to add tooltip/notes to each gui option?
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

  // Initialize tree geometry and material
  let branchGeometry = new THREE.CylinderGeometry(params.baseRadius, params.baseRadius, params.baseHeight, 5); 
  const branchMaterial = new THREE.MeshPhongMaterial({ color: 0xbbbbbb }); 

  // Recursive function that creates branches as children of a parent branch
  const createBranch = (parent, depth) => {
    if (depth > params.recursionDepth) return;
    
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.scale.set(0.7, 0.7, 0.7);

    // Skip rotation and translation for first branch so that it's straight up
    if (depth > 0) {
      // Rotate branch around parent randomly
      branch.rotateOnAxis(new THREE.Vector3(0, 1, 0), 2 * Math.random() * Math.PI);

      // Put branch at a 60 degree offset from parent
      branch.rotateOnAxis(new THREE.Vector3(0, 0, 1), params.branchAngle * Math.PI / 180);

      // Set branch position
      branch.position.y = params.baseHeight * (Math.random() - 0.5);
      branch.translateOnAxis(new THREE.Vector3(0, 1, 0), params.baseHeight * branch.scale.y / 2);
    }

    parent.add(branch);

    // Recursively create more branches
    for (let i = 0; i < params.branchesPerLevel; i++) {
      createBranch(branch, depth + 1);
    }
  };

  // Function that creates a tree and returns the root
  const createTree = () => {
    const root = new THREE.Object3D();
    root.position.y = -params.baseHeight / 4;
    scene.add(root);

    createBranch(root, 0);
    return root;
  };

  let tree = createTree();

  // Rotate branches over time
  const animationRotationAxis = new THREE.Vector3(0, 1, 0);
  const rotateBranch = (branch, angle) => {
    branch.rotateOnAxis(animationRotationAxis, angle);
    // Recursively rotate children
    branch.children.forEach(child => {
      rotateBranch(child, angle);
    });
  };

  // Create GUI
  const gui = new GUI();
  const resetScene = () => {
    params = { ...paramsToApply };
    branchGeometry = new THREE.CylinderGeometry(params.baseRadius, params.baseRadius, params.baseHeight, 5); 

    scene.remove(tree);
    tree = createTree();
  };
  gui.add(paramsToApply, 'baseHeight', 30, 100, 1);
  gui.add(paramsToApply, 'baseRadius', 1, 5, 0.1);
  gui.add(paramsToApply, 'branchAngle', 0, 90, 1);
  gui.add(paramsToApply, 'branchesPerLevel', 1, 5, 1);
  gui.add(paramsToApply, 'recursionDepth', 1, 8, 1);
  gui.add(paramsToApply, 'rotationSpeed', 0, 0.01);
  gui.add({ 'Apply Changes': resetScene }, 'Apply Changes');

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    rotateBranch(tree.children[0], params.rotationSpeed);

    renderer.render(scene, camera);
  };

  animate();
}

init();
