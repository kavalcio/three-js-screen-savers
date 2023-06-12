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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import bgImage from './asset/xp_background.jpg';
// import { DotScreenShader } from './jsm/shaders/DotScreenShader.js';
// import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from './jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from './jsm/postprocessing/ShaderPass.js';

let params = {
  scale: 1,
  center: 1,
  angle: 0,
};

// https://codegolf.stackexchange.com/questions/259633/make-a-custom-bayer-matrix
const getNormalizedBayerMatrix = (n) => {
  // const matrix = [];
  // for (let i = 0; i < size; i++) {
  //   matrix[i] = [];
  //   for (let j = 0; j < size; j++) {
  //     matrix[i][j] = 0;
  //   }
  // }
  // return matrix;
  let g;
  const matrix = [...Array(1<<n)].map((_,y,a) => a.map(g=(k=n,x)=>k--&&4*g(k,x)|2*(x>>k)+3*(y>>k&1)&3));
  return matrix;
};
// const getNormalizedBayerMatrix = n=>[...Array(1<<n)].map((_,y,a)=>a.map(g=(k=n,x)=>k--&&4*g(k,x)|2*(x>>k)+3*(y>>k&1)&3));

function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;
  // const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
  // camera.position.z = 10;
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
  // const material = new THREE.MeshPhongMaterial({ color: 0xaa4400 });

  // Create clock
  const clock = new THREE.Clock();
  const tick = () =>
  {
    const elapsedTime = clock.getElapsedTime();
  
    // Update material
    material.uniforms.uTime.value = elapsedTime;
    bgMaterial.uniforms.uTime.value = elapsedTime;
  };

  const material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0.0 },
    },
  });
  console.log('vertexShader', vertexShader)
  console.log('fragmentShader', fragmentShader)
  const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  const geometry2 = new THREE.IcosahedronGeometry(10);
  const material2 = new THREE.MeshPhongMaterial({ color: 0x004499 });
  const cube2 = new THREE.Mesh(geometry2, material2);
  cube2.position.x = 10;
  cube2.position.y = 10;
  cube2.position.z = -20;
  // scene.add(cube2);

  // TODO: use bayer matrix, function here
  // const bayerMatrix = getNormalizedBayerMatrix(3);
  const bayerMatrix = getNormalizedBayerMatrix(2);
  console.log('bayerMatrix', bayerMatrix)

  // Create background
  const bgTexture = new THREE.TextureLoader().load(bgImage);
  // const bgMaterial = new THREE.RawShaderMaterial({
  const bgMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    // map: bgTexture,
    uniforms: {
      uTime: { value: 0.0 },
      uMap: { type: 't', value: bgTexture },
      uThresholdMap: { value: bayerMatrix },
      // uThresholdMap: new THREE.Uniform(bayerMatrix),
    },
  });
  const bgGeometry = new THREE.PlaneGeometry(100, 60);
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(bgMesh);

  // const geometry3 = new THREE.IcosahedronGeometry(10);
  // const cube3 = new THREE.Mesh(geometry3, bgMaterial);
  // cube2.position.x = 10;
  // cube2.position.y = 10;
  // cube2.position.z = -20;
  // scene.add(cube3);

  // Create GUI
  const gui = new GUI();
  gui.add(params, 'center', 0, 100);
  gui.add(params, 'angle', 0, 360, 1);
  gui.add(params, 'scale', 1, 100, 1);

  // TODO: add dithering

  // const composer = new EffectComposer(renderer);
  // composer.addPass(new RenderPass(scene, camera));

  // const effect1 = new ShaderPass(DotScreenShader);
  // // effect1.uniforms.center.value = params.center;
  // effect1.uniforms.angle.value = params.angle;
  // effect1.uniforms.scale.value = params.scale;
  // composer.addPass(effect1);

  // const effect2 = new ShaderPass( RGBShiftShader );
  // effect2.uniforms[ 'amount' ].value = 0.0015;
  // composer.addPass( effect2 );

  function animate() {
    requestAnimationFrame(animate);

    // Rotate cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Rotate cube2
    cube2.rotation.x -= 0.01;
    cube2.rotation.z += 0.01;

    // Move cube2 in a circle
    cube2.position.x = 20 * Math.cos(Date.now() * 0.0005);
    cube2.position.y = 20 * Math.sin(Date.now() * 0.0005);

    tick();

    renderer.render(scene, camera);
    // composer.render();
  };

  animate();
}

init();
