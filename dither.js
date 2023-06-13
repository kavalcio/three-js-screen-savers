/*
https://en.wikipedia.org/wiki/Dither
https://github.com/mrdoob/three.js/blob/1a241ef10048770d56e06d6cd6a64c76cc720f95/examples/webgl_postprocessing.html
https://threejs.org/examples/?q=post#webgl_postprocessing
https://threejs.org/examples/?q=postpro#webgl_postprocessing_rgb_halftone
https://thebookofshaders.com/00/
*/

import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import vertexShader from './shaders/vertex.glsl';
import bayerFragmentShader from './shaders/fragment-bayer.glsl';
import blueFragmentShader from './shaders/fragment-blue.glsl';
import fixedFragmentShader from './shaders/fragment-fixed.glsl';
import randomFragmentShader from './shaders/fragment-random.glsl';
import originalFragmentShader from './shaders/fragment-original.glsl';
import bgImage from './asset/xp_background.jpg';
import blueNoiseImage from './asset/blue_noise_128_128_1.png';

/* TODOS:
- Clean up
- Add variable dithering algorithm, try to get all the ones in the wikipedia article
- Add blinn-phong on top of this shader?
- Add variable dark and bright color options
- Create a better scene with moving elements
- Implement non-monochrome dithering
- Add text on screen to show which dithering algorithm is being used
*/

// Based on formula by Arnauld: https://codegolf.stackexchange.com/a/259638
const getNormalizedBayerMatrix = (n) => {
  let g;
  let t = n + 1;
  const matrix = [...Array(1<<t)].map((_,y,a) => a.map(g=(k=t,x)=>k--&&4*g(k,x)|2*(x>>k)+3*(y>>k&1)&3));
  return matrix.flat().map(el => el / Math.pow(2, 2 * n + 2));
};

function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;
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

  // Create objects
  const geometry = new THREE.IcosahedronGeometry(10);

  // Create clock
  const clock = new THREE.Clock();
  const tick = () =>
  {
    const elapsedTime = clock.getElapsedTime();
  
    // Update material
    material.uniforms.uTime.value = elapsedTime;
    ditherMaterial.uniforms.uTime.value = elapsedTime;
  };

  const material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader: bayerFragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0.0 },
    },
  });
  const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  const geometry2 = new THREE.IcosahedronGeometry(10);
  const material2 = new THREE.MeshPhongMaterial({ color: 0x004499 });
  const cube2 = new THREE.Mesh(geometry2, material2);
  cube2.position.x = 10;
  cube2.position.y = 10;
  cube2.position.z = -20;
  // scene.add(cube2);

  // Create background
  const imageTexture = new THREE.TextureLoader().load(bgImage);
  const blueNoiseTexture = new THREE.TextureLoader().load(blueNoiseImage);
  const ditherMaterial = new THREE.ShaderMaterial({
    vertexShader,
    // fragmentShader: bayerFragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0.0 },
      uMap: { type: 't', value: imageTexture },
      uThresholdArray: { value: null },
      uThresholdMatrixWidth: { value: null },
      uThresholdTexture: { value: null },
    },
  });
  const bgGeometry = new THREE.PlaneGeometry(100, 60);
  const bgMesh = new THREE.Mesh(bgGeometry, ditherMaterial);
  scene.add(bgMesh);

  const applyBayerDither = (n) => {
    ditherMaterial.fragmentShader = bayerFragmentShader;
    ditherMaterial.uniforms.uThresholdMatrixWidth.value = Math.pow(2, n + 1);
    ditherMaterial.uniforms.uThresholdArray.value = getNormalizedBayerMatrix(n);
    ditherMaterial.needsUpdate = true;
  };
  const applyFixedDither = (n) => {
    ditherMaterial.fragmentShader = fixedFragmentShader;
    ditherMaterial.needsUpdate = true;
  };
  const applyRandomDither = (n) => {
    ditherMaterial.fragmentShader = randomFragmentShader;
    ditherMaterial.needsUpdate = true;
  };
  const applyNoDither = (n) => {
    ditherMaterial.fragmentShader = originalFragmentShader;
    ditherMaterial.needsUpdate = true;
  };
  const applyBlueNoise = (n) => {
    ditherMaterial.fragmentShader = blueFragmentShader;
    ditherMaterial.uniforms.uThresholdMatrixWidth.value = 128;
    ditherMaterial.uniforms.uThresholdTexture.value = blueNoiseTexture;
    ditherMaterial.needsUpdate = true;
  };
  
  // const geometry3 = new THREE.IcosahedronGeometry(10);
  // const cube3 = new THREE.Mesh(geometry3, ditherMaterial);
  // cube2.position.x = 10;
  // cube2.position.y = 10;
  // cube2.position.z = -20;
  // scene.add(cube3);

  // Initialize page to show Bayer dithering
  applyBayerDither(1);

  // Create GUI
  const gui = new GUI();
  gui.add({ 'Original': () => applyNoDither() }, 'Original');
  gui.add({ 'Fixed threshold': () => applyFixedDither() }, 'Fixed threshold');
  gui.add({ 'Random threshold': () => applyRandomDither() }, 'Random threshold');
  gui.add({ 'Bayer (level 0)': () => applyBayerDither(0) }, 'Bayer (level 0)');
  gui.add({ 'Bayer (level 1)': () => applyBayerDither(1) }, 'Bayer (level 1)');
  gui.add({ 'Bayer (level 2)': () => applyBayerDither(2) }, 'Bayer (level 2)');
  gui.add({ 'Bayer (level 3)': () => applyBayerDither(3) }, 'Bayer (level 3)');
  gui.add({ 'Blue noise': () => applyBlueNoise() }, 'Blue noise');

  function animate() {
    requestAnimationFrame(animate);

    // // Rotate cube
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    // // Rotate cube2
    // cube2.rotation.x -= 0.01;
    // cube2.rotation.z += 0.01;

    // // Move cube2 in a circle
    // cube2.position.x = 20 * Math.cos(Date.now() * 0.0005);
    // cube2.position.y = 20 * Math.sin(Date.now() * 0.0005);

    tick();

    renderer.render(scene, camera);
  };

  animate();
}

init();
