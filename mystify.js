import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

// TODO: add gui for speed, number of points per chain, number of chains, how many old chains to show
// TODO: keep chains in an array, pop and delete the oldest chain when the array gets too long
// TODO: add my name to page header for every page
// TODO: change color over time

const WIDTH = 120;
const HEIGHT = 80;
const ECHO_COUNT = 10;
const VERTEX_COUNT = 5;
const POLYGON_COUNT = 2;

function init() {
    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    // gui.add({ reset }, 'reset');


    // Create lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Bounding box
    const boundingBox = new THREE.Box2(new Vector2(-WIDTH / 2, -HEIGHT / 2), new Vector2(WIDTH / 2, HEIGHT / 2));
    const boxPlane = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const boxEdges = new THREE.EdgesGeometry(boxPlane);
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff0000' });
    const line = new THREE.LineSegments(boxEdges, lineMaterial);
    scene.add(line);

    const edgeMaterial = new THREE.LineBasicMaterial({ color: '#00ffff' });

    const createPolygon = () => {
        const polygon = {
            vertices: [],
            echoes: [],
        };
        // Create vertices for VERTEX_COUNT
        for (let i = 0; i < VERTEX_COUNT; i++) {
            polygon.vertices.push({
                position: new Vector2(Math.random() * WIDTH - WIDTH / 2, Math.random() * HEIGHT - HEIGHT / 2),
                velocity: new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
            });
        }
        return polygon;
    };

    // Create polygons
    const polygons = [];
    for (let i = 0; i < POLYGON_COUNT; i++) {
        polygons.push(createPolygon());
    }

    function movePoint(point, velocity) {
        let newX = point.x + velocity.x;
        let newY = point.y + velocity.y;

        if (newX > boundingBox.max.x) {
            newX = boundingBox.max.x;
            velocity.x *= -1;
        } else if (newX < boundingBox.min.x) {
            newX = boundingBox.min.x;
            velocity.x *= -1;
        }

        if (newY > boundingBox.max.y) {
            newY = boundingBox.max.y;
            velocity.y *= -1;
        } else if (newY < boundingBox.min.y) {
            newY = boundingBox.min.y;
            velocity.y *= -1;
        }

        point.x = newX;
        point.y = newY;
    }

    function animate() {
        requestAnimationFrame(animate);

        polygons.forEach(polygon => {
            // Move vertices
            polygon.vertices.forEach((point) => {
                movePoint(point.position, point.velocity);
            });

            // Create new edges
            const edges = [];
            for (let i = 0; i < polygon.vertices.length; i++) {
                const point1 = polygon.vertices[i].position;
                let point2;
                if (i === polygon.vertices.length - 1) {
                    point2 = polygon.vertices[0].position;
                } else {
                    point2 = polygon.vertices[i + 1].position;
                }

                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new Vector3(point1.x, point1.y, 0),
                    new Vector3(point2.x, point2.y, 0)
                ]);
                const edge = new THREE.Line(geometry, edgeMaterial);
                edges.push(edge);
                scene.add(edge);
            }

             // Delete old edges
            polygon.echoes.push(edges);
            if (polygon.echoes.length > ECHO_COUNT) {
                const edgesToRemove = polygon.echoes.shift();
                edgesToRemove.forEach(edge => {
                    scene.remove(edge);
                });
            }
        })

        renderer.render(scene, camera);
    };

    animate();
}

export default init;
