import * as THREE from 'three';
import { Vector2 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const INNER_WIDTH = 120;
const INNER_HEIGHT = 80;
const OUTER_WIDTH = 200;
const OUTER_HEIGHT = 140;

const CURVE_COUNT = 3;

let params = {
  curveCount: CURVE_COUNT,
};
let paramsToApply = { ...params };

// TODO: make sure intermediate control points are within bounding box
// TODO: add reset function
// TODO: move bezier
// TODO: create echoes
// TODO: create closed bezier curve, refer to this: https://stackoverflow.com/questions/27001117/3-and-4-degree-curves-in-three-js
function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  // camera.position.z = 110;
  camera.position.z = 180;
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

  // Create GUI
  const gui = new GUI();
  gui.add(paramsToApply, 'curveCount', 2, 16, 1);

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Inner bounding box, for vertex control points
  const innerBounds = new THREE.Box2(new Vector2(-INNER_WIDTH / 2, -INNER_HEIGHT / 2), new Vector2(INNER_WIDTH / 2, INNER_HEIGHT / 2));
  const boxPlane = new THREE.PlaneGeometry(INNER_WIDTH, INNER_HEIGHT);
  const boxEdges = new THREE.EdgesGeometry(boxPlane);
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff0000' });
  const line = new THREE.LineSegments(boxEdges, lineMaterial);
  scene.add(line);

  // Outer bounding box, for intermediate control points
  const outerBounds = new THREE.Box2(new Vector2(-OUTER_WIDTH / 2, -OUTER_HEIGHT / 2), new Vector2(OUTER_WIDTH / 2, OUTER_HEIGHT / 2));
  const boxPlane2 = new THREE.PlaneGeometry(OUTER_WIDTH, OUTER_HEIGHT);
  const boxEdges2 = new THREE.EdgesGeometry(boxPlane2);
  const lineMaterial2 = new THREE.LineBasicMaterial({ color: '#ffff00' });
  const line2 = new THREE.LineSegments(boxEdges2, lineMaterial2);
  scene.add(line2);

  const sphereGeo = new THREE.SphereGeometry(1.5, 5, 5);
  
  function movePoint(point, velocity, sphere) {
    let newX = point.x + velocity.x;
    let newY = point.y + velocity.y;

    if (newX > innerBounds.max.x) {
      newX = innerBounds.max.x;
      velocity.x *= -1;
    } else if (newX < innerBounds.min.x) {
      newX = innerBounds.min.x;
      velocity.x *= -1;
    }

    if (newY > innerBounds.max.y) {
      newY = innerBounds.max.y;
      velocity.y *= -1;
    } else if (newY < innerBounds.min.y) {
      newY = innerBounds.min.y;
      velocity.y *= -1;
    }

    point.x = newX;
    point.y = newY;

    if (sphere) {
      sphere.position.x = point.x;
      sphere.position.y = point.y;
    }
  }

  const getRandomPoint = (maxWidth, maxHeight) => {
    return new Vector2((Math.random() - 0.5) * maxWidth, (Math.random() - 0.5) * maxHeight);
  };

  const getRandomColor = () => {
    return "#" + Math.floor(Math.random()*16777215).toString(16);
  };

  const bezierCurves = [];
  function createActualRandomBezierCurve() {
    for (let i = 0; i < params.curveCount; i += 1) {
      let controlPoints;
      if (i === 0) {
        // First curve
        controlPoints = [
          getRandomPoint(INNER_WIDTH, INNER_HEIGHT),
          getRandomPoint(OUTER_WIDTH, OUTER_HEIGHT),
          getRandomPoint(OUTER_WIDTH, OUTER_HEIGHT),
          getRandomPoint(INNER_WIDTH, INNER_HEIGHT),
        ];
      } else if (i === (params.curveCount) - 1) {
        // Last curve
        const firstCurve = bezierCurves[0];
        const previousCurve = bezierCurves[i - 1];
        controlPoints = [
          previousCurve[3],
          new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y),
          new Vector2(2 * firstCurve[0].x - firstCurve[1].x, 2 * firstCurve[0].y - firstCurve[1].y),
          firstCurve[0],
        ];
      } else {
        // Middle curves
        const previousCurve = bezierCurves[i - 1];
        controlPoints = [
          previousCurve[3],
          new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y),
          getRandomPoint(OUTER_WIDTH, OUTER_HEIGHT),
          getRandomPoint(INNER_WIDTH, INNER_HEIGHT),
        ];
      }
      const color = getRandomColor();
      const sphereMat = new THREE.MeshBasicMaterial({ color });
      controlPoints.forEach(point => {
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.x = point.x;
        sphere.position.y = point.y;
        scene.add(sphere);
      });
      const curve = new THREE.CubicBezierCurve(...controlPoints);
      const points = curve.getPoints(50);
      const curveMaterial = new THREE.LineBasicMaterial({ color });
      const curveObject = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), curveMaterial);
      scene.add(curveObject);

      bezierCurves.push(controlPoints);
    }
  }
  createActualRandomBezierCurve();

  function animate() {
    requestAnimationFrame(animate);

    // Move anchor points
    // movePoint(point1, pointVelocity1, sphere1);
    // movePoint(point2, pointVelocity2, sphere2);
    // movePoint(point3, pointVelocity3, sphere3);
    // movePoint(point4, pointVelocity4, sphere4);

    // const curve = new THREE.CatmullRomCurve3([ // CatmullRomSpline
    //   new Vector3(point1.x, point1.y, 0),
    //   new Vector3(point2.x, point2.y, 0),
    //   new Vector3(point3.x, point3.y, 0),
    //   new Vector3(point4.x, point4.y, 0),
    // ], true);
    // const points = curve.getPoints(50);
    // const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // curveObject.geometry = geometry;

    renderer.render(scene, camera);
  };

  animate();
}

init();
