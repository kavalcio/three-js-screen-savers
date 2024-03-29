import * as THREE from 'three';
import { Vector3 } from 'three';

import { initializeScene } from 'pages/template';
import { getRandomColor, getRandomInt } from 'utils/general';

const PIPE_LENGTH_MAX = 15;
const PIPE_LENGTH_MIN = 5;
const PIPE_BUILD_SPEED = 3;
const PIPE_RADIUS = 1;
const PIPE_COUNT = 3;
const DIRECTIONS = [
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
];
const BOUNDS = {
  min: { x: -130, y: -70, z: -140 },
  max: { x: 130, y: 70, z: 60},
};

let params = {
  maxPipeLength: PIPE_LENGTH_MAX,
  minPipeLength: PIPE_LENGTH_MIN,
  buildSpeed: PIPE_BUILD_SPEED,
  pipeRadius: PIPE_RADIUS,
  pipeCount: PIPE_COUNT,
};

let paramsToApply = { ...params };

let pipeList = [];

// TODO: prevent pipe from overlapping itself
// TODO: remove old pipes as new ones are created. make max pipe limit a variable
function init() {
  const {
    scene,
    renderer,
    camera,
    gui,
    stats,
  } = initializeScene();

  camera.position.z = 70;
  camera.fov = 85;
  camera.updateProjectionMatrix();
  
  const deletePipe = (pipe) => {
    if (pipe.previous) {
      deletePipe(pipe.previous);
    }
    if (pipe.sphere) {
      scene.remove(pipe.sphere);
    }
    scene.remove(pipe.mesh);
  };

  const resetScene = () => {
    pipeList.forEach((pipe) => {
      deletePipe(pipe);
    });
    pipeList = [];
    params = { ...paramsToApply };
    createPipes();
  };

  gui.add(paramsToApply, 'maxPipeLength', 8, 100);
  gui.add(paramsToApply, 'minPipeLength', 1, 7);
  gui.add(paramsToApply, 'buildSpeed', 0, 20);
  gui.add(paramsToApply, 'pipeCount', 1, 15, 1);
  gui.add(paramsToApply, 'pipeRadius', 0.5, 2);
  gui.add({ 'Apply Params': resetScene }, 'Apply Params');

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.x = 1;
  directionalLight.position.z = 1;
  scene.add(directionalLight);

  function createPipe({
    parentMesh = null,
    start = new Vector3(0, 0, 0),
    end = new Vector3(0, 0, 0),
  }) {
    // Create pipe mesh
    let mesh;
    if (parentMesh) {
      mesh = parentMesh.clone();
    } else {
      const geometry = new THREE.CylinderGeometry(params.pipeRadius, params.pipeRadius, 1, 32);
      const material = new THREE.MeshPhongMaterial({ color: getRandomColor() });
      mesh = new THREE.Mesh(geometry, material);
    }

    mesh.scale.y = 0;

    // Move to start position
    mesh.position.set(...start);

    // Align to direction
    const direction = end.clone().sub(start).normalize();
    var axis = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(axis, direction.clone().normalize());

    // Add to scene
    scene.add(mesh);
    const newPipe = { mesh, start, end, currentScale: 0, previous: null };
    return newPipe;
  }

  function getRandomEndpoint({ directions, oldEnd }) {
    const randomDirection = directions[getRandomInt(0, directions.length - 1)];
    const randomLength = getRandomInt(params.minPipeLength, params.maxPipeLength);
    const newEnd = oldEnd.clone().addScaledVector(randomDirection, randomLength);

    if (
      newEnd.x > BOUNDS.max.x ||
      newEnd.x < BOUNDS.min.x ||
      newEnd.y > BOUNDS.max.y ||
      newEnd.y < BOUNDS.min.y ||
      newEnd.z > BOUNDS.max.z ||
      newEnd.z < BOUNDS.min.z
    ) {
      return getRandomEndpoint({ directions, oldEnd });
    }

    return newEnd;
  }

  const createPipes = () => {
    for (let i = 0; i < params.pipeCount; i++) {
      const start = new Vector3(getRandomInt(-30, 30), getRandomInt(-30, 30), getRandomInt(-30, 30));
      const end = getRandomEndpoint({ directions: DIRECTIONS, oldEnd: start });
      pipeList.push(createPipe({ start, end }));
    }
  };

  // Initialize pipes
  createPipes();

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    pipeList.forEach((pipe, index) => {
      const direction = pipe.end.clone().sub(pipe.start);
      if (direction.length() > pipe.currentScale) {
        // Translate
        pipe.mesh.position.addScaledVector(direction.clone().normalize(), params.buildSpeed / 2);
        if (pipe.mesh.position.clone().sub(pipe.start).length() > direction.length() / 2) {
          pipe.mesh.position.copy(pipe.start).addScaledVector(direction, 0.5);
        }

        // Scale
        pipe.currentScale += params.buildSpeed;
        if (pipe.currentScale > direction.length()) {
          pipe.currentScale = direction.length();
        }
        pipe.mesh.scale.y = pipe.currentScale;
      } else {
        // Create sphere at corner
        const geometry = new THREE.SphereGeometry(params.pipeRadius, 32, 32);
        const sphere = new THREE.Mesh(geometry, pipe.mesh.material);
        sphere.position.copy(pipe.end);
        scene.add(sphere);

        // Create new pipe
        const reverseDirection = direction.clone().normalize().multiplyScalar(-1);
        const validDirections = DIRECTIONS.filter(direction => !direction.equals(reverseDirection));
        const newEnd = getRandomEndpoint({ directions: validDirections, oldEnd: pipe.end });
        const newPipe = createPipe({ parentMesh: pipe.mesh, start: pipe.end, end: newEnd });
        newPipe.previous = { mesh: pipe.mesh, sphere ,previous: pipe.previous };
        pipeList[index] = newPipe;
      }
    });

    stats.end();
    renderer.render(scene, camera);
  }

  animate();
}

init();
