import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const PIPE_LENGTH_MAX = 15;
const PIPE_LENGTH_MIN = 5;
const PIPE_BUILD_SPEED = 0.5;
const DIRECTIONS = [
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
];

// TODO: add elbows to corners
// TODO: prevent pipe from overlapping itself
// TODO: randomize pipe length
// TODO: prevent pipe from getting too far away from center
// TODO: add ui and parameterize pipe length, pipe build speed, etc
// TODO: add some more comments
function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 45;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const controls = new OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.x = 1;
    directionalLight.position.z = 1;
    scene.add(directionalLight);

    const pipeList = [];

    const getRandomColor = () => {
        return "#" + Math.floor(Math.random()*16777215).toString(16);
    };

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function createPipeNew({
        parentMesh = null,
        start = new Vector3(0, 0, 0),
        end = new Vector3(0, 0, 0),
    }) {
        // Create pipe mesh
        let mesh;
        if (parentMesh) {
            mesh = parentMesh.clone();
        } else {
            const geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
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

        // Show arrow helpers
        // const arrowHelper = new THREE.ArrowHelper( direction, new Vector3(10, 0, 0), 2, '#00ff00' );
        // const arrowHelper2 = new THREE.ArrowHelper( mesh.up, new Vector3(12, 0, 0), 2, '#ff0000' );
        // const arrowHelper3 = new THREE.ArrowHelper( mesh.rotation, new Vector3(14, 0, 0), 2, '#0000ff' );
        // scene.add( arrowHelper );
        // scene.add( arrowHelper2 );
        // scene.add( arrowHelper3 );
    }

    function getRandomDirection(excludeDirection) {
        const randomDirection = DIRECTIONS[getRandomInt(0, DIRECTIONS.length - 1)];
        if (randomDirection.equals(excludeDirection)) {
            return getRandomDirection(excludeDirection);
        }
        return randomDirection;
    }

    createPipeNew({ start: new Vector3(0, 0, 0), end: new Vector3(10, 0, 0) });

    function animate() {
        requestAnimationFrame(animate);

        pipeList.forEach((pipe, index) => {
            const direction = pipe.end.clone().sub(pipe.start);
            if (direction.length() > pipe.currentScale) {
                // Translate
                pipe.mesh.position.addScaledVector(direction.clone().normalize(), PIPE_BUILD_SPEED / 2);
                if (pipe.mesh.position.clone().sub(pipe.start).length() > direction.length() / 2) {
                    pipe.mesh.position.copy(pipe.start).addScaledVector(direction, 0.5);
                }

                // Scale
                pipe.currentScale += PIPE_BUILD_SPEED;
                if (pipe.currentScale > direction.length()) {
                    pipe.currentScale = direction.length();
                }
                pipe.mesh.scale.y = pipe.currentScale;
            } else {
                // Pipe is done, remove from list
                pipeList.splice(index, 1);

                // Create new pipe
                const randomDirection = getRandomDirection(direction.clone().normalize().multiplyScalar(-1));
                const randomLength = getRandomInt(PIPE_LENGTH_MIN, PIPE_LENGTH_MAX);
                const newEnd = pipe.end.clone().addScaledVector(randomDirection, randomLength);
                createPipeNew({ parentMesh: pipe.mesh, start: pipe.end, end: newEnd });
            }
        });

        renderer.render(scene, camera);
    };

    animate();
}

init();
