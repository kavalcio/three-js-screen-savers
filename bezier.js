import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

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

    // Create lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Bounding box
    const WIDTH = 120;
    const HEIGHT = 80;
    const boundingBox = new THREE.Box2(new Vector2(-WIDTH / 2, -HEIGHT / 2), new Vector2(WIDTH / 2, HEIGHT / 2));
    const boxPlane = new THREE.PlaneGeometry(WIDTH, HEIGHT);
    const boxEdges = new THREE.EdgesGeometry(boxPlane);
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff0000' });
    const line = new THREE.LineSegments(boxEdges, lineMaterial);
    scene.add(line);

    // Points
    const point1 = new Vector2(0, 0);
    const sphereGeo = new THREE.SphereGeometry(0.5, 5, 5);
    const sphereMat = new THREE.MeshBasicMaterial({ color: '#00ff00' });
    const sphere1 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere1.position.x = point1.x;
    sphere1.position.y = point1.y;
    scene.add(sphere1);
    const point2 = new Vector2(20, 5);
    const sphere2 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere2.position.x = point2.x;
    sphere2.position.y = point2.y;
    scene.add(sphere2);
    const point3 = new Vector2(20, 5);
    const sphere3 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere3.position.x = point3.x;
    sphere3.position.y = point3.y;
    scene.add(sphere3);
    const point4 = new Vector2(20, 5);
    const sphere4 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere4.position.x = point4.x;
    sphere4.position.y = point4.y;
    scene.add(sphere4);

    // Set point velocities
    const pointVelocity1 = new Vector2(1, 0.5);
    const pointVelocity2 = new Vector2(-0.6, 0.9);
    const pointVelocity3 = new Vector2(-1, 1.2);
    const pointVelocity4 = new Vector2(0.8, 0.9);

    // Create curves
    const curveMaterial = new THREE.LineBasicMaterial({ color: '#00ffff' });
    const curveObject = new THREE.Line(new THREE.BufferGeometry(), curveMaterial);
    scene.add(curveObject);

    function movePoint(point, velocity, sphere) {
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

        if (sphere) {
            sphere.position.x = point.x;
            sphere.position.y = point.y;
        }
    }

    // TODO: close curve. maybe use CurvePath?
    function animate() {
        requestAnimationFrame(animate);

        // Move anchor points
        movePoint(point1, pointVelocity1, sphere1);
        movePoint(point2, pointVelocity2, sphere2);
        movePoint(point3, pointVelocity3, sphere3);
        movePoint(point4, pointVelocity4, sphere4);

        // const curve = new THREE.CubicBezierCurve( // Bezier
        //     point1,
        //     point2,
        //     point3,
        //     point4,
        // );
        const curve = new THREE.CatmullRomCurve3([ // CatmullRomSpline
            new Vector3(point1.x, point1.y, 0),
            new Vector3(point2.x, point2.y, 0),
            new Vector3(point3.x, point3.y, 0),
            new Vector3(point4.x, point4.y, 0),
        ], true);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        curveObject.geometry = geometry;

        renderer.render(scene, camera);
    };

    animate();
}

// init();

export default init;
