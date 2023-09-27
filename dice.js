import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

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
  const directionalLight = new THREE.DirectionalLight(0xdddddd, 0.1);
  directionalLight.position.set(1, 0, 1);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xdddddd, 0.4);
  directionalLight2.position.set(-1, 1, 1);
  scene.add(directionalLight2);

  // Create dice
  const geometry = new THREE.IcosahedronGeometry(10, 0);
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const dice = new THREE.Mesh(geometry, material);
  scene.add(dice);

  // Create GUI
  const gui = new GUI();
  const rollDice = () => {
    console.log('roll');
  };
  gui.add({ 'Roll Dice': rollDice }, 'Roll Dice');
  console.log(geometry)
  gui.add(geometry.parameters, 'radius', 1, 20, 0.05).onChange((value) => {
    dice.geometry.dispose();
    dice.geometry = new THREE.IcosahedronGeometry(value, geometry.parameters.detail);
  });
  
  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    // Rotate dice
    dice.rotation.x += 0.01;
    dice.rotation.y += 0.01;

    renderer.render(scene, camera);
  };

  animate();
}

init();
