import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { initializeScene } from '/src/pages/template';

const {
  scene,
  renderer,
  camera,
  gui,
  stats,
  controls,
} = initializeScene();

// camera.position.set(7, 4, 7);
// controls.update();

// Postprocessing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.1,
);
composer.addPass(bloomPass);

// Create lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Create objects
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const planetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

const sun = new THREE.Mesh(sphereGeometry, sunMaterial);
scene.add(sun);

const planet1 = new THREE.Mesh(sphereGeometry, planetMaterial);
planet1.position.x = 5;
scene.add(planet1);

const planet2 = new THREE.Mesh(sphereGeometry, planetMaterial);
planet2.position.x = -5;
scene.add(planet2);

const tick = () => {
  requestAnimationFrame(tick);
  stats.begin();

  stats.end();
  // renderer.render(scene, camera);
  composer.render(scene, camera);
};

tick();
