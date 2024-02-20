import * as THREE from 'three';

import { initializeScene } from 'pages/template';

import vertexShader from 'shaders/raging-sea/vertex.glsl';
import fragmentShader from 'shaders/raging-sea/fragment.glsl';

const params = {
  peakColor: 0xa0ffe5,
  valleyColor: 0x184650,
};

const {
  scene,
  renderer,
  camera,
  gui,
  stats,
  controls,
} = initializeScene();

camera.position.set(-10, 15, 20);
camera.lookAt(scene.position);
controls.update();

const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uWaveFrequency: { value: new THREE.Vector2(0.4, 0.3) },
    uWaveAmplitude: { value: 0.8 },
    uAnimationSpeed: { value: new THREE.Vector2(1, 2) },
    uPeakColor: { value: new THREE.Color(params.peakColor) },
    uValleyColor: { value: new THREE.Color(params.valleyColor) },
    uColorOffset: { value: 0.4 },
    uColorDamping: { value: 2 },
  },
  // wireframe: true,
  side: THREE.DoubleSide,
});

const object = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 128, 128),
  material,
);
object.rotation.x = Math.PI / 2;
scene.add(object);

const clock = new THREE.Clock();

gui.width = 300;
gui.add(material.uniforms.uWaveFrequency.value, 'x').min(0).max(1).step(0.01).name('Wave Frequency X');
gui.add(material.uniforms.uWaveFrequency.value, 'y').min(0).max(1).step(0.01).name('Wave Frequency Y');
gui.add(material.uniforms.uWaveAmplitude, 'value').min(0).max(2).step(0.01).name('Wave Amplitude');
gui.add(material.uniforms.uAnimationSpeed.value, 'x').min(0).max(5).step(0.01).name('Animation Speed X');
gui.add(material.uniforms.uAnimationSpeed.value, 'y').min(0).max(5).step(0.01).name('Animation Speed Y');
gui.addColor(params, 'peakColor').onChange((value) => {
  material.uniforms.uPeakColor.value.set(value);
});
gui.addColor(params, 'valleyColor').onChange((value) => {
  material.uniforms.uValleyColor.value.set(value);
});
gui.add(material.uniforms.uColorOffset, 'value').min(0).max(3).step(0.01).name('Color Offset');
gui.add(material.uniforms.uColorDamping, 'value').min(1).max(10).step(0.01).name('Color Damping');

const tick = () => {
  requestAnimationFrame(tick);
  stats.begin();

  const elapsedTime = clock.getElapsedTime();

  material.uniforms.uTime.value = elapsedTime;

  renderer.render(scene, camera);
  stats.end();
};

tick();
