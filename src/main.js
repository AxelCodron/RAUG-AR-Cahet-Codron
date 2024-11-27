import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

let loadedFlask, loadedTube, loadedGlassBottle = false;

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

  // Renderer setup with WebXR and AR support
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Create AR button with hit-test feature
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  function onSelect() {
    if (reticle.visible) {
      // Load a model at the reticle position
      let currentModel;
      let baseScale;
      let modelType;

      if (!loadedFlask) {
        loader.load('flask.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.1;
          modelType = 'flask';
          setupModel(currentModel, baseScale, modelType);
        });
      } else if (!loadedTube) {
        loader.load('tube.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.1;
          modelType = 'tube';
          setupModel(currentModel, baseScale, modelType);
        });
      } else if (!loadedGlassBottle) {
        loader.load('glass-bottle.glb', (gltf) => {
          currentModel = gltf.scene;
          baseScale = 0.04;
          modelType = 'glassBottle';
          setupModel(currentModel, baseScale, modelType);
        });
      }
    }

    // Get the AR controller's position and direction
    const raycaster = new THREE.Raycaster();
    const controllerPosition = new THREE.Vector3();
    const controllerDirection = new THREE.Vector3();

    // Get controller's position and direction
    controller.matrixWorld.decompose(controllerPosition, new THREE.Quaternion(), new THREE.Vector3());
    controller.getWorldDirection(controllerDirection);

    // Set the raycaster from the controller
    raycaster.set(controllerPosition, controllerDirection);

    // Perform intersection check
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      // Get the closest intersected object
      const touchedObject = intersects[0].object;

      // Check if the object has the expected userData.type
      if (touchedObject && touchedObject.userData.type) {
        const modelType = touchedObject.userData.type;

        // Prevent multiple wiggles for the same model
        if (!modelsTouched[modelType]) {
          applyWiggleEffect(touchedObject, touchedObject.scale.x);
          modelsTouched[modelType] = true;
        }
      }
    }


    // Helper to set up models
    function setupModel(model, baseScale, modelType) {
      // Position and add the model
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);
      model.scale.set(baseScale, baseScale, baseScale);
      model.userData.type = modelType;

      scene.add(model);

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

      // Configure model material and interaction
      model.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.material = new THREE.MeshBasicMaterial({
            color: modelType === 'flask' ? 0xff0000 :
              modelType === 'tube' ? 0x00ff00 : 0x0000ff,
            transparent: true,
            opacity: 0.7,
          });
        }
      });
    }
  }

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

  // AR Controller setup
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // Reticle setup for AR placement
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Window resize handling
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

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