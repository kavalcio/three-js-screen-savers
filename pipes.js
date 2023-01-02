import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const PIPE_LENGTH_MAX = 15;
const PIPE_LENGTH_MIN = 5;
const PIPE_BUILD_SPEED = 3;
const PIPE_RADIUS = 1;
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

const PARAMS = {
    maxPipeLength: PIPE_LENGTH_MAX,
    minPipeLength: PIPE_LENGTH_MIN,
    buildSpeed: PIPE_BUILD_SPEED,
}

const pipeList = [];

// TODO: prevent pipe from overlapping itself
// TODO: add Apply button that applies gui params and deletes all pipes (dont delete other stuff in the scene, or just recreate them after deleting)
// TODO: randomize starting point of pipes within a smaller bounding box
function init() {
    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 70;
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
    gui.add(PARAMS, 'maxPipeLength', 8, 100);
    gui.add(PARAMS, 'minPipeLength', 1, 7);
    gui.add(PARAMS, 'buildSpeed', 0, 20);

    // Create lights
    const ambientLight = new THREE.AmbientLight(0x707070);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.x = 1;
    directionalLight.position.z = 1;
    scene.add(directionalLight);

    const getRandomColor = () => {
        return "#" + Math.floor(Math.random()*16777215).toString(16);
    };

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

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
            const geometry = new THREE.CylinderGeometry(PARAMS.pipeRadius, PARAMS.pipeRadius, 1, 32);
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
        pipeList.push({ mesh, start, end, currentScale: 0 });
        scene.add(mesh);
    }

    function getRandomEndpoint({ directions, oldEnd }) {
        const randomDirection = directions[getRandomInt(0, directions.length - 1)];
        const randomLength = getRandomInt(PARAMS.minPipeLength, PARAMS.maxPipeLength);
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

    // Initialize several pipes
    createPipe({ start: new Vector3(20, 0, 0), end: new Vector3(30, 0, 0) });
    createPipe({ start: new Vector3(-20, 10, 0), end: new Vector3(-20, 20, 0) });
    createPipe({ start: new Vector3(0, -10, -40), end: new Vector3(0, -10, -50) });

    function animate() {
        requestAnimationFrame(animate);

        pipeList.forEach((pipe, index) => {
            const direction = pipe.end.clone().sub(pipe.start);
            if (direction.length() > pipe.currentScale) {
                // Translate
                pipe.mesh.position.addScaledVector(direction.clone().normalize(), PARAMS.buildSpeed / 2);
                if (pipe.mesh.position.clone().sub(pipe.start).length() > direction.length() / 2) {
                    pipe.mesh.position.copy(pipe.start).addScaledVector(direction, 0.5);
                }

                // Scale
                pipe.currentScale += PARAMS.buildSpeed;
                if (pipe.currentScale > direction.length()) {
                    pipe.currentScale = direction.length();
                }
                pipe.mesh.scale.y = pipe.currentScale;
            } else {
                // Pipe is done, remove from list
                pipeList.splice(index, 1);

                // Create sphere at corner
                const geometry = new THREE.SphereGeometry(PARAMS.pipeRadius, 32, 32);
                const material = new THREE.MeshPhongMaterial({ color: pipe.mesh.material.color.getHex() });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.copy(pipe.end);
                scene.add(sphere);

                // Create new pipe
                const reverseDirection = direction.clone().normalize().multiplyScalar(-1);
                const validDirections = DIRECTIONS.filter(direction => !direction.equals(reverseDirection));
                const newEnd = getRandomEndpoint({ directions: validDirections, oldEnd: pipe.end });
                createPipe({ parentMesh: pipe.mesh, start: pipe.end, end: newEnd });
            }
        });

        renderer.render(scene, camera);
    };

    animate();
}

init();
