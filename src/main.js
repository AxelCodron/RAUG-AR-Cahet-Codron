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

  const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0);

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
        const model = scene.children[3];

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