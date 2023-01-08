import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const DISTANCE = -30;

let params = {
  distance: DISTANCE,
};

function init() {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Create camera
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;
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
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const controls = new OrbitControls(camera, renderer.domElement);
  document.body.appendChild(renderer.domElement);

  // Create GUI
  const gui = new GUI();
  gui.add(params, 'distance', -120, -7);

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.x = 1;
  directionalLight.position.z = 1;
  scene.add(directionalLight);

  // Create glass orb
  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0,
    transmission: 1,
    thickness: 7,
  });
  // TODO: implement physically accurate refraction?
  // const refractSphereCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
	// scene.add( refractSphereCamera );
	// refractSphereCamera.renderTarget.mapping = new THREE.CubeRefractionMapping();
  // const sphereMaterial = new THREE.MeshBasicMaterial({ 
	// 	color: 0xccccff, 
	// 	envMap: refractSphereCamera.renderTarget, 
	// 	refractionRatio: 0.985, 
	// 	reflectivity: 0.9 
  // });
  const sphereGeometry = new THREE.SphereGeometry(7, 32, 32);
  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(sphereMesh);

  // Create background
  const bgTexture = new THREE.TextureLoader().load('asset/xp_background.jpg');
  const bgGeometry = new THREE.PlaneGeometry(100, 60);
  const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(bgMesh);

  function animate() {
    requestAnimationFrame(animate);

    // Move background
    bgMesh.position.set(0, 0, params.distance);

    renderer.render(scene, camera);
  };

  animate();
}

init();
