import * as THREE from 'three';

import { initializeScene } from 'pages/template';

import vertexShader from 'shaders/inkblot/vertex.glsl';
import fragmentShader from 'shaders/inkblot/fragment.glsl';

const {
  scene,
  renderer,
  camera,
  gui,
  stats,
  controls,
} = initializeScene();

renderer.setClearColor(0x333333, 1);

camera.position.set(0, 0, 30);
controls.update();

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
  },
  side: THREE.DoubleSide,
  // wireframe: true,
  // transparent: true,
});

const object = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 20, 20),
  material,
);
scene.add(object);

const clock = new THREE.Clock();

const tick = () => {
  requestAnimationFrame(tick);
  stats.begin();

  const elapsedTime = clock.getElapsedTime();

  material.uniforms.uTime.value = elapsedTime;

  renderer.render(scene, camera);
  stats.end();
};

tick();
