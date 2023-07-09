import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const BASE_HEIGHT = 70;
const BASE_RADIUS = 2;
const BRANCH_ANGLE = 60;
const BRANCHES_PER_LEVEL = 3;
const RECURSION_DEPTH = 5;
const ROTATION_SPEED = 0.001;
const BRANCH_SHRINK_RATE = 0.7;

const params = {
  baseHeight: BASE_HEIGHT, /* Base cylinder height of a branch, shrinks as recursion gets deeper */
  baseRadius: BASE_RADIUS, /* Base cylinder radius of a branch, shrinks as recursion gets deeper */
  branchAngle: BRANCH_ANGLE, /* Angle between each child and parent branch */
  branchesPerLevel: BRANCHES_PER_LEVEL, /* Number of children generated per parent branch */
  recursionDepth: RECURSION_DEPTH, /* Max recursion depth allowed when generating tree */
  branchShrinkRate: BRANCH_SHRINK_RATE, /* Factor by which branches shrink as you move up recursion levels */
};
const paramsToApply = { ...params };

const dynamicParams = {
  rotationSpeed: ROTATION_SPEED, /* Speed at which each branch rotates around its parent branch */
};

const applyParams = () => Object.keys(paramsToApply).forEach(key => params[key] = paramsToApply[key]);

// TODO: change branch color on hover
// TODO: add ability to right click to remove branch + children
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
  const branchHoverMaterial = new THREE.MeshPhongMaterial({ color: 0xbb2200 })

  // Recursive function that creates branches as children of a parent branch
  const createBranch = (parent, depth) => {
    if (depth > params.recursionDepth) return;
    
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.scale.set(params.branchShrinkRate, params.branchShrinkRate, params.branchShrinkRate);

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

  // Function that rotates branches over time
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
  gui.width = 300;
  const resetScene = () => {
    applyParams();
    branchGeometry = new THREE.CylinderGeometry(params.baseRadius, params.baseRadius, params.baseHeight, 5); 

    scene.remove(tree);
    tree = createTree();
  };
  const treeGuiFolder = gui.addFolder('Tree Params');
  treeGuiFolder.add(paramsToApply, 'baseHeight', 30, 100, 1);
  treeGuiFolder.add(paramsToApply, 'baseRadius', 1, 5, 0.1);
  treeGuiFolder.add(paramsToApply, 'branchAngle', 0, 90, 1);
  treeGuiFolder.add(paramsToApply, 'branchesPerLevel', 1, 5, 1);
  treeGuiFolder.add(paramsToApply, 'recursionDepth', 1, 8, 1);
  treeGuiFolder.add(paramsToApply, 'branchShrinkRate', 0.5, 0.9, 0.1);
  treeGuiFolder.add({ 'Regenerate Tree': resetScene }, 'Regenerate Tree');
  treeGuiFolder.open();
  const animationGuiFolder = gui.addFolder('Animation Params');
  animationGuiFolder.add(dynamicParams, 'rotationSpeed', 0, 0.01);
  animationGuiFolder.open();

  // Create new offshoots when a branch is clicked
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered = null;

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  const onBranchClick = (event) => {
    const [intersect] = raycaster.intersectObjects(scene.children) || [];
    if (intersect) {
      createBranch(intersect.object, params.recursionDepth);
    }
  };

  const checkBranchHover = () => {
    const [intersect] = raycaster.intersectObjects(scene.children) || [];
    if (hovered) {
      if (intersect?.object?.uuid !== hovered.object.uuid) {
        hovered.object.material = branchMaterial;
      }
    }

    if (intersect) {
      intersect.object.material = branchHoverMaterial;
      hovered = intersect;
    }
  };

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', onBranchClick);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    rotateBranch(tree.children[0], dynamicParams.rotationSpeed);

    checkBranchHover();

    renderer.render(scene, camera);
  };

  animate();
}

init();
