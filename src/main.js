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

let currentSelectedModel = null;
let modelsTouched = {
  flask: false,
  tube: false,
  glassBottle: false
};

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

  function onSelect() {
    if (reticle.visible) {
      let currentModel;
      let baseScale;
      let modelType;

      // Load models as before, but add a unique identifier
      if (!loadedFlask) {
        loader.load('flask.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.1;
          modelType = 'flask';
          setupModel(currentModel, baseScale, modelType);
        });
      }
      else if (!loadedTube) {
        loader.load('tube.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.1;
          modelType = 'tube';
          setupModel(currentModel, baseScale, modelType);
        });
      }
      else if (!loadedGlassBottle) {
        loader.load('glass-bottle.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.04;
          modelType = 'glassBottle';
          setupModel(currentModel, baseScale, modelType);
        });
      }
    }

    function setupModel(model, baseScale, modelType) {
      // Position the model at the reticle
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);

      // Scale the model
      model.scale.set(baseScale, baseScale, baseScale);

      // Add a custom property to identify the model
      model.userData.type = modelType;

      // Add to scene
      scene.add(model);

      // Update load flags
      switch (modelType) {
        case 'flask':
          loadedFlask = true;
          break;
        case 'tube':
          loadedTube = true;
          break;
        case 'glassBottle':
          loadedGlassBottle = true;
          break;
      }

      // Enable shadows
      model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
      });
    }
  }

  // Add this new function to handle touch interactions
  function onTouchMove(event) {
    // Prevent default touch behavior
    event.preventDefault();

    // Check if we're in AR session
    if (!renderer.xr.isPresenting) return;

    // Get touch coordinates
    const touch = event.touches[0];
    const touchX = (touch.clientX / window.innerWidth) * 2 - 1;
    const touchY = -(touch.clientY / window.innerHeight) * 2 + 1;

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(touchX, touchY);

    // Set up the raycaster from the camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with models
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      // Find the top-level model that was touched
      const touchedObject = intersects[0].object.parent;

      // Check if this is one of our loaded models
      if (touchedObject.userData.type) {
        const modelType = touchedObject.userData.type;

        // Prevent multiple wiggles for the same model
        if (!modelsTouched[modelType]) {
          console.log('Touched', modelType);
          applyWiggleEffect(touchedObject, touchedObject.scale.x);
          modelsTouched[modelType] = true;
        }
      }
    }
  }

  // Wiggle effect remains the same as in the previous example
  function applyWiggleEffect(model, baseScale, duration = 3000, wiggleFrequency = 100, wiggleAmplitude = 0.01) {
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

  // Add touch event listener
  window.addEventListener('touchmove', onTouchMove, { passive: false });

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