import * as THREE from 'three';
import { Vector2 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from 'dat.gui';

const INNER_WIDTH = 120;
const INNER_HEIGHT = 80;
// const OUTER_WIDTH = 200;
// const OUTER_HEIGHT = 140;

const CURVE_COUNT = 1;
const ECHO_COUNT = 10;
const SPEED = 30;

let curveSegments = [];
// {
//   controlPoints,
//   pointVelocities,
//   material,
//   echoes: [],
// };

let params = {
  echoCount: ECHO_COUNT,
  curveCount: CURVE_COUNT,
  speed: SPEED,
};
let paramsToApply = { ...params };

// TODO: add speed param
// TODO: unify colors, make them cycle over time
// TODO: rename curveSegments param
// TODO: should inner control points have smaller bounds than outer control points?
// TODO: add ui param to toggle drawing control points, connection lines and bounds
// TODO: add random magnitude to velocities
// TODO: make sure intermediate control points are within bounding box
// TODO: add reset function
// TODO: move bezier
function init() {
  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 90;
  // camera.position.z = 180;
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
  gui.add(paramsToApply, 'echoCount', 1, 50, 1);
  gui.add(paramsToApply, 'speed', 0, 100, 1);

  // Create lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Create clock
  const clock = new THREE.Clock();

  // Inner bounding box, for vertex control points
  const innerBounds = new THREE.Box2(new Vector2(-INNER_WIDTH / 2, -INNER_HEIGHT / 2), new Vector2(INNER_WIDTH / 2, INNER_HEIGHT / 2));
  const boxPlane = new THREE.PlaneGeometry(INNER_WIDTH, INNER_HEIGHT);
  const boxEdges = new THREE.EdgesGeometry(boxPlane);
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff0000' });
  const line = new THREE.LineSegments(boxEdges, lineMaterial);
  scene.add(line);

  // Outer bounding box, for intermediate control points
  // const innerBounds = new THREE.Box2(new Vector2(-OUTER_WIDTH / 2, -OUTER_HEIGHT / 2), new Vector2(OUTER_WIDTH / 2, OUTER_HEIGHT / 2));
  // const boxPlane2 = new THREE.PlaneGeometry(OUTER_WIDTH, OUTER_HEIGHT);
  // const boxEdges2 = new THREE.EdgesGeometry(boxPlane2);
  // const lineMaterial2 = new THREE.LineBasicMaterial({ color: '#ffff00' });
  // const line2 = new THREE.LineSegments(boxEdges2, lineMaterial2);
  // scene.add(line2);

  const sphereGeo = new THREE.SphereGeometry(1.5, 5, 5);
  
  function movePoint({ position, newPosition, velocity, sphere, controlLine }) {
    let newX = newPosition.x;
    let newY = newPosition.y;

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

    position.x = newX;
    position.y = newY;

    if (sphere) {
      sphere.position.x = position.x;
      sphere.position.y = position.y;
    }

    // if (controlLine) {
    //   const points = [];
    //   const oldPositions = controlLine.geometry.attributes.position;
    //   points.push(position);
    //   points.push(new Vector2(oldPositions.getX(1), oldPositions.getY(1)));
    //   // console.log(controlLine.geometry.attributes.position.count)
    //   // console.log(points)
    //   const edge = new THREE.BufferGeometry().setFromPoints(points);
    //   controlLine.geometry = edge;
    // }
  }

  const getRandomPoint = (maxWidth, maxHeight) => {
    return new Vector2((Math.random() - 0.5) * maxWidth, (Math.random() - 0.5) * maxHeight);
  };

  const getRandomColor = () => {
    return "#" + Math.floor(Math.random()*16777215).toString(16);
  };

  const drawRedSphere = (point) => {
    const sphereMat = new THREE.MeshBasicMaterial({ color: '#ff0000' });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.x = point.x;
    sphere.position.y = point.y;
    scene.add(sphere);
  }

  const clipSegmentWithinBounds = (p1, p2) => {
    if (!(
      p2.x > innerBounds.max.x ||
      p2.x < innerBounds.min.x ||
      p2.y > innerBounds.max.y ||
      p2.y < innerBounds.min.y
    )) {
      return p2;
    }

    const segment = new Vector2(p2.x - p1.x, p2.y - p1.y);
    const d = segment.clone().normalize();
    if (p2.x > innerBounds.max.x) {
      const i_length = Math.abs((innerBounds.max.x - p1.x) / d.x);
      const i_point = d.clone().multiplyScalar(i_length).add(p1);
      if (i_point.y > innerBounds.min.y && i_point.y < innerBounds.max.y) {
        // console.log('--intersects with right side', p2);
        // drawRedSphere(i_point);
        return i_point;
      }
    }
    if (p2.x < innerBounds.min.x) {
      const i_length = Math.abs((innerBounds.min.x - p1.x) / d.x);
      const i_point = d.clone().multiplyScalar(i_length).add(p1);
      if (i_point.y > innerBounds.min.y && i_point.y < innerBounds.max.y) {
        // console.log('--intersects with left side', p2);
        // drawRedSphere(i_point);
        return i_point;
      }
    }
    if (p2.y > innerBounds.max.y) {
      const i_length = Math.abs((innerBounds.max.y - p1.y) / d.y);
      const i_point = d.clone().multiplyScalar(i_length).add(p1);
      if (i_point.x > innerBounds.min.x && i_point.x < innerBounds.max.x) {
        // console.log('--intersects with top side', p2);
        // drawRedSphere(i_point);
        return i_point;
      }
    }
    if (p2.y < innerBounds.min.y) {
      const i_length = Math.abs((innerBounds.min.y - p1.y) / d.y);
      const i_point = d.clone().multiplyScalar(i_length).add(p1);
      if (i_point.x > innerBounds.min.x && i_point.x < innerBounds.max.x) {
        // console.log('--intersects with bottom side', p2);
        // drawRedSphere(i_point);
        return i_point;
      }
    }

    return p2;
  }

  function createRandomBezierCurves() {
    for (let i = 0; i < params.curveCount; i += 1) {
      let controlPoints;
      if (i === 0) {
        // First curve
        controlPoints = [
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
        ];
      } else if (i === (params.curveCount) - 1) {
        // Last curve
        const firstCurve = curveSegments[0].controlPoints;
        const previousCurve = curveSegments[i - 1].controlPoints;
        controlPoints = [
          previousCurve[3],
          new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y),
          new Vector2(2 * firstCurve[0].x - firstCurve[1].x, 2 * firstCurve[0].y - firstCurve[1].y),
          firstCurve[0],
        ];

        controlPoints[1] = clipSegmentWithinBounds(controlPoints[0], controlPoints[1]);
        controlPoints[2] = clipSegmentWithinBounds(controlPoints[3], controlPoints[2]);
        // clipSegmentWithinBounds(controlPoints[0], controlPoints[1]);
        // clipSegmentWithinBounds(controlPoints[3], controlPoints[2]);
      } else {
        // Middle curves
        const previousCurve = curveSegments[i - 1].controlPoints;
        controlPoints = [
          previousCurve[3],
          new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y),
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
          getRandomPoint(innerBounds.max.x - innerBounds.min.x, innerBounds.max.y - innerBounds.min.y),
        ];
        controlPoints[1] = clipSegmentWithinBounds(controlPoints[0], controlPoints[1]);
        // clipSegmentWithinBounds(controlPoints[0], controlPoints[1]);
      }

      const pointSpheres = [];
      const pointControlLines = [];
      const color = getRandomColor();
      const sphereMat = new THREE.MeshBasicMaterial({ color });
      controlPoints.forEach((point, index) => {
        // Draw control points
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.x = point.x;
        sphere.position.y = point.y;
        scene.add(sphere);
        pointSpheres.push(sphere);

        // Draw control lines
        // if (index === 1 || index === 2) {
        //   const points = [point];
        //   points.push(index === 1 ? controlPoints[0] : controlPoints[3]);
        //   const edge = new THREE.BufferGeometry().setFromPoints(points);
        //   const lmat = new THREE.LineBasicMaterial({ color: '#999999' });
        //   const line = new THREE.LineSegments(edge, lmat);
        //   scene.add(line);
        //   pointControlLines.push(line);
        // }
      });

      const pointVelocities = [
        new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(params.speed * (Math.random() + 1)),
        new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(params.speed * (Math.random() + 1)),
        new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(params.speed * (Math.random() + 1)),
        new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(params.speed * (Math.random() + 1)),
      ];

      const newCurveSegment = {
        controlPoints,
        pointVelocities,
        pointSpheres,
        pointControlLines,
        color,
        // material,
        echoes: [],
      };
      curveSegments.push(newCurveSegment);
    }
  }
  createRandomBezierCurves();

  function animate() {
    requestAnimationFrame(animate);

    const deltaT = clock.getDelta();

    curveSegments.forEach((curveSegment, curveIndex) => {
      // Move control points
      curveSegment.controlPoints.forEach((point, pointIndex) => {
        let newPosition;
        if (curveIndex === 0) {
          newPosition = point.clone().add(curveSegment.pointVelocities[pointIndex].clone().multiplyScalar(deltaT));
        } else if (curveIndex === curveSegments.length - 1) {
          const firstCurve = curveSegments[0].controlPoints;
          const previousCurve = curveSegments[curveIndex - 1].controlPoints;
          if (pointIndex === 0) {
            newPosition = previousCurve[3].clone();
          } else if (pointIndex === 1) {
            newPosition = new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y);
            newPosition = clipSegmentWithinBounds(curveSegment.controlPoints[0], newPosition);
          } else if (pointIndex === 2) {
            newPosition = new Vector2(2 * firstCurve[0].x - firstCurve[1].x, 2 * firstCurve[0].y - firstCurve[1].y);
            newPosition = clipSegmentWithinBounds(curveSegment.controlPoints[3], newPosition);
          } else {
            newPosition = firstCurve[0].clone();
          }
        } else {
          const previousCurve = curveSegments[curveIndex - 1].controlPoints;
          if (pointIndex === 0) {
            newPosition = previousCurve[3].clone();
          } else if (pointIndex === 1) {
            newPosition = new Vector2(2 * previousCurve[3].x - previousCurve[2].x, 2 * previousCurve[3].y - previousCurve[2].y),
            newPosition = clipSegmentWithinBounds(curveSegment.controlPoints[0], newPosition);
          } else if (pointIndex === 2) {
            newPosition = point.clone().add(curveSegment.pointVelocities[pointIndex].clone().multiplyScalar(deltaT));
          } else {
            newPosition = point.clone().add(curveSegment.pointVelocities[pointIndex].clone().multiplyScalar(deltaT));
          }
        }
        movePoint({
          position: point,
          newPosition,
          velocity: curveSegment.pointVelocities[pointIndex],
          sphere: curveSegment.pointSpheres[pointIndex],
          controlLine: curveSegment.pointControlLines[pointIndex],
        });
      });
      // Draw new echo
      const curve = new THREE.CubicBezierCurve(...curveSegment.controlPoints);
      const points = curve.getPoints(50);
      const curveMaterial = new THREE.LineBasicMaterial({ color: curveSegment.color });
      const curveObject = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), curveMaterial);
      scene.add(curveObject);
      curveSegment.echoes.push(curveObject);

      // Delete old echo
      if (curveSegment.echoes.length > params.echoCount) {
        const echoToRemove = curveSegment.echoes.shift();
        scene.remove(echoToRemove);
      }
    });

    renderer.render(scene, camera);
  };

  animate();
}

init();
