import * as THREE from 'three';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

import vertexShader from './shaders/vertex.glsl';
import originalFragmentShader from './shaders/fragment-original.glsl';
import chromaticAberrationFragmentShader from './shaders/fragment-chromatic-aberration.glsl';
import filmGrainFragmentShader from './shaders/fragment-film-grain.glsl';
import bayerFragmentShader from './shaders/fragment-bayer.glsl';

import bgImage from './asset/xp_background.jpg';

// TODO: add custom color option to bayer dither shader?
// TODO: for film grain, create a different random value for each color channel?
// TODO: add the ability to manually shift shader pass order in gui. is that possible?
// TODO: add ability to toggle object texture on/off?

/* Based on formula by Arnauld: https://codegolf.stackexchange.com/a/259638 */
const getNormalizedBayerMatrix = (n) => {
  let g;
  let t = n + 1;
  const matrix = [...Array(1<<t)].map((_,y,a) => a.map(g=(k=t,x)=>k--&&4*g(k,x)|2*(x>>k)+3*(y>>k&1)&3));
  return matrix.flat().map(el => el / Math.pow(2, 2 * n + 2));
};

const ChromaticAberrationShader = {
  uniforms: {
    uMap: { type: 't' },
    uChromaticAberrationOffset: { value: 0.05 },
  },
  vertexShader,
  fragmentShader: chromaticAberrationFragmentShader,
};

const bayerOrder = 2;
const BayerDitherShader = {
  uniforms: {
    uMap: { type: 't' },
    uThresholdArray: { value: getNormalizedBayerMatrix(bayerOrder) },
    uThresholdMatrixWidth: { value: Math.pow(2, bayerOrder + 1) },
  },
  vertexShader,
  fragmentShader: bayerFragmentShader,
};

const FilmGrainShader = {
  uniforms: {
    uMap: { type: 't' },
    uTime: { value: 0.0 },
    uIntensity: { value: 0.1 },
  },
  vertexShader,
  fragmentShader: filmGrainFragmentShader,
};

// const imageTexture = new THREE.TextureLoader().load(bgImage);
const createObject = () => {
  const obj = new THREE.Mesh(
    new THREE.IcosahedronGeometry(10),
    // new THREE.MeshPhongMaterial({ color: 0xbbffdd, map: imageTexture }),
    new THREE.MeshPhongMaterial({ color: 0xbbffdd }),
  );
  return obj;
}

function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(58, 55, 130);

  const tanFOV = Math.tan(((Math.PI / 180) * camera.fov / 2));
  const initialWindowHeight = window.innerHeight;

  function onWindowResize(event) {
    // Adjust camera and renderer on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / initialWindowHeight));
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
  window.addEventListener('resize', onWindowResize, false);

  // Create renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);

  // Postprocessing
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const chromaticAberrationPass = new ShaderPass(ChromaticAberrationShader, 'uMap');
  composer.addPass(chromaticAberrationPass);
  const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
  composer.addPass(smaaPass);
  const bayerDitherPass = new ShaderPass(BayerDitherShader, 'uMap');
  composer.addPass(bayerDitherPass);
  bayerDitherPass.enabled = false;
  const filmGrainPass = new ShaderPass(FilmGrainShader, 'uMap');
  composer.addPass(filmGrainPass);
  filmGrainPass.enabled = false;

  // add custom AA shader here
  // const smaaPass = new ShaderPass();

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.x = 1;
  directionalLight.position.z = 1;
  scene.add(directionalLight);

  // Create objects
  const obj1 = createObject();
  scene.add(obj1);

  const obj2 = createObject();
  scene.add(obj2);

  // const planeMesh = new THREE.Mesh(
  //   new THREE.PlaneGeometry(100, 100),
  //   new THREE.MeshPhongMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide }),
  // );
  // planeMesh.rotation.x = Math.PI * -0.5;
  // planeMesh.position.y = -30;
  // scene.add(planeMesh);

  // Create clock
  const clock = new THREE.Clock();
  const tick = () =>
  {
    const elapsedTime = clock.getElapsedTime();
    // const elapsedTime = Date.now() / 10000 % 1;
    filmGrainPass.uniforms.uTime.value = elapsedTime;
  };

  // Create GUI
  const gui = new GUI();
  const chromaticAberrationGui = gui.addFolder('Chromatic Aberration');
  chromaticAberrationGui.open();
  chromaticAberrationGui.add(chromaticAberrationPass, 'enabled');
  chromaticAberrationGui.add(chromaticAberrationPass.uniforms.uChromaticAberrationOffset, 'value').name('intensity').min(0).max(0.2);
  const bayerDitherGui = gui.addFolder('Bayer Dithering');
  bayerDitherGui.open();
  bayerDitherGui.add(bayerDitherPass, 'enabled');
  const filmGrainGui = gui.addFolder('Film Grain');
  filmGrainGui.open();
  filmGrainGui.add(filmGrainPass, 'enabled');
  filmGrainGui.add(filmGrainPass.uniforms.uIntensity, 'value').name('intensity').min(0).max(1);

  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);


  function animate() {
    requestAnimationFrame(animate);

    stats.begin();

    // Rotate obj
    obj2.rotation.x -= 0.01;
    obj2.rotation.z += 0.01;

    // Move obj in a circle
    obj2.position.x = 20 * Math.cos(Date.now() * 0.0005);
    obj2.position.y = 20 * Math.sin(Date.now() * 0.0005);

    tick();

    composer.render(scene, camera);
    stats.end();
  };

  animate();
}

init();
