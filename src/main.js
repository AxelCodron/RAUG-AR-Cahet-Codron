import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let model;

let loadedFlask, loadedTube, loadedGlassBottle = false;

// Define button materials and geometry
const buttonGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
const buttonMaterials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
  new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
];

const buttons = [];
const buttonPositions = [
  { x: -0.5, y: -1.2, z: -2 }, // Left button
  { x: 0, y: -1.2, z: -2 },    // Center button
  { x: 0.5, y: -1.2, z: -2 },  // Right button
];

init();

function init() {

  const loader = new GLTFLoader().setPath('/RAUG-AR-Cahet-Codron/assets/models/');

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  //

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  //

  // Raycaster for interaction
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(event) {
    // Convert touch/mouse coordinates to normalized device coordinates (-1 to 1)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
      const clickedButton = intersects[0].object;

      if (clickedButton.material.color.getHex() === 0xff0000) {
        console.log('Red button pressed!');
        console.log(clickedButton.material.color.getHex());
        clickedButton.material.color.set(0xffffff);
        console.log(clickedButton.material.color.getHex())
      } else if (clickedButton.material.color.getHex() === 0x00ff00) {
        console.log('Green button pressed!');
        clickedButton.material.color.set(0x000000);
      } else if (clickedButton.material.color.getHex() === 0x0000ff) {
        console.log('Blue button pressed!');
        clickedButton.material.color.set(0xffff00);
      }
    }
  }

  // Add buttons to the scene
  buttonPositions.forEach((pos, index) => {
    const button = new THREE.Mesh(buttonGeometry, buttonMaterials[index]);
    // Set the position relative to the camera's initial position
    button.position.set(pos.x, pos.y, -2);
    camera.add(button);
    buttons.push(button);
  });

  scene.add(camera);

  function onPointerDown(event) {
    // Convert touch/mouse coordinates to normalized device coordinates (-1 to 1)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
      const clickedButton = intersects[0].object;

      if (clickedButton.material.color.getHex() === 0xff0000) {
        console.log('Red button pressed!');
      } else if (clickedButton.material.color.getHex() === 0x00ff00) {
        console.log('Green button pressed!');
      } else if (clickedButton.material.color.getHex() === 0x0000ff) {
        console.log('Blue button pressed!');
      }
    }
  }

  // Add event listener for user input
  window.addEventListener('pointerdown', onPointerDown);

  //

  function onSelect() {

    if (reticle.visible) {
      if (!loadedFlask) {
        // Load the flask
        loader.load('flask.glb', (gltf) => {
          model = gltf.scene;

          reticle.matrix.decompose(model.position, model.quaternion, model.scale);

          // Scale the model
          model.scale.x = 0.1;
          model.scale.y = 0.1;
          model.scale.z = 0.1;

          scene.add(model);

          loadedFlask = true;

          model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
          });
        });
      }
      else if (!loadedTube) {
        // Load the tube
        loader.load('tube.glb', (gltf) => {
          model = gltf.scene;

          reticle.matrix.decompose(model.position, model.quaternion, model.scale);

          // Scale the model
          model.scale.x = 0.1;
          model.scale.y = 0.1;
          model.scale.z = 0.1;

          scene.add(model);

          loadedTube = true;

          model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
          });
        });
      }
      else if (!loadedGlassBottle) {
        // Load the glass bottle
        loader.load('glass-bottle.glb', (gltf) => {
          model = gltf.scene;

          reticle.matrix.decompose(model.position, model.quaternion, model.scale);

          // Scale the model
          model.scale.x = 0.05;
          model.scale.y = 0.05;
          model.scale.z = 0.05;

          scene.add(model);

          loadedGlassBottle = true;

          model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true;
          });
        });
      }
      else {
        const model = scene.children[4];

        const duration = 3000;
        const wiggleFrequency = 100;
        const baseScale = 0.1;
        const wiggleAmplitude = 0.01;
        const startTime = performance.now();

        let lastFrameTime = startTime;

        function wiggle() {
          const currentTime = performance.now();
          const elapsedTime = currentTime - startTime;

          if (elapsedTime < duration) {
            if (currentTime - lastFrameTime >= wiggleFrequency) {
              lastFrameTime = currentTime;
              const scaleFactor = baseScale +
                wiggleAmplitude * Math.sin((elapsedTime / 1000) * wiggleFrequency * 2 * Math.PI);
              model.scale.set(scaleFactor, scaleFactor, scaleFactor);
            }

            requestAnimationFrame(wiggle);
          } else {
            model.scale.set(baseScale, baseScale, baseScale);
          }
        }

        wiggle();
      }
    }
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  //

  window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate(timestamp, frame) {

  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer').then(function (referenceSpace) {

        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {

          hitTestSource = source;

        });

      });

      session.addEventListener('end', function () {

        hitTestSourceRequested = false;
        hitTestSource = null;

      });

      hitTestSourceRequested = true;

    }

    if (hitTestSource) {

      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {

        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

      } else {

        reticle.visible = false;

      }

    }

  }

  renderer.render(scene, camera);
}