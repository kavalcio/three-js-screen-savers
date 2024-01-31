// Noise generators: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

import * as THREE from 'three';

import { initializeScene } from 'pages/template';

function init() {
  const {
    scene,
    renderer,
    camera,
    gui,
    stats,
    controls,
  } = initializeScene();

  // camera.position.set(58, 55, 130);
  // controls.update();

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.x = 1;
  directionalLight.position.z = 1;
  scene.add(directionalLight);

  // Create objects
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 32),
    new THREE.MeshPhongMaterial({ color: 0xbbffdd }),
  );
  sphere.position.x = 20;
  scene.add(sphere);

  const icosahedron = new THREE.Mesh(
    new THREE.IcosahedronGeometry(10),
    new THREE.MeshPhongMaterial({ color: 0xbbffdd }),
  );
  icosahedron.position.x = -20;
  scene.add(icosahedron);

  // Create clock
  const clock = new THREE.Clock();

  // Create GUI

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    const time = clock.getElapsedTime();

    // Move objects
    sphere.rotation.x = time * 0.2;
    sphere.rotation.y = time * 0.2;
    icosahedron.rotation.x = time * 0.2;
    icosahedron.rotation.y = time * 0.2;

    stats.end();
    renderer.render(scene, camera);
  }

  animate();
}

init();
