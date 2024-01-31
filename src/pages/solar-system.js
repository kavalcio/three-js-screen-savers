import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { initializeScene } from '/src/pages/template';
import {
  createSelectiveUnrealBloomComposer,
  checkObjectNonBloomed,
  restoreNonBloomedObjectMaterial,
  BLOOM_LAYER_ID,
} from '../utils/solar-system';

// TODO: try out tonemapping

const {
  scene,
  renderer,
  camera,
  gui,
  stats,
  controls,
} = initializeScene();

camera.position.set(0, 0, 30);
controls.update();

const {
  bloomComposer,
  finalComposer,
} = createSelectiveUnrealBloomComposer({ renderer, scene, camera });

// Create lights
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Create objects
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc77 });
const planetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

const sun = new THREE.Mesh(sphereGeometry, sunMaterial);
sun.layers.enable(BLOOM_LAYER_ID);
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

  scene.traverse(checkObjectNonBloomed);
  bloomComposer.render(scene, camera);
  scene.traverse(restoreNonBloomedObjectMaterial);
  finalComposer.render(scene, camera);

  stats.end();
};

tick();
